import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarProductos, crearVenta } from '@/api/ventasApi'
import { listarPacientes, listarRecetasPendientes, marcarRecetaDispensadaDesdeVenta, obtenerDetalleRecetaPendiente } from '@/api/clinicaApi'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { FieldError, OptionalLabel, RequiredLabel, fieldClass, isBlank } from '@/components/ui/form-feedback'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'
import { type DetalleVentaDTO, type Producto } from '@/types'

export default function VentasPage() {
  const queryClient = useQueryClient()
  const idZona = useAuthStore((s) => s.idZona) ?? 1
  const [busqueda, setBusqueda] = useState('')
  const [detalle, setDetalle] = useState<DetalleVentaDTO[]>([])
  const [tipoPago, setTipoPago] = useState<number>(1)
  const [documentoTipo, setDocumentoTipo] = useState<'NINGUNO' | 'BOLETA' | 'FACTURA' | 'TICKET'>('NINGUNO')
  const [documentoNumero, setDocumentoNumero] = useState('')
  const [documentoNombre, setDocumentoNombre] = useState('')
  const [montoCobrado, setMontoCobrado] = useState(0)
  const [pacienteBusqueda, setPacienteBusqueda] = useState('')
  const [idPacienteSeleccionado, setIdPacienteSeleccionado] = useState<number | ''>('')
  const [cargandoReceta, setCargandoReceta] = useState(false)
  const [idRecetaCargada, setIdRecetaCargada] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: productos = [], isLoading } = useQuery({
    queryKey: ['productos', idZona],
    queryFn: () => listarProductos(idZona),
    refetchOnWindowFocus: true,
  })

  const { data: pacientes = [], isLoading: cargandoPacientes } = useQuery({
    queryKey: ['clinica', 'pacientes', pacienteBusqueda],
    queryFn: () => listarPacientes(pacienteBusqueda.trim() || undefined),
    enabled: pacienteBusqueda.trim().length >= 2,
  })

  const { data: recetasPendientesPaciente = [], isLoading: cargandoRecetasPaciente } = useQuery({
    queryKey: ['clinica', 'recetas-pendientes', idPacienteSeleccionado],
    queryFn: () => listarRecetasPendientes(typeof idPacienteSeleccionado === 'number' ? idPacienteSeleccionado : undefined),
    enabled: typeof idPacienteSeleccionado === 'number',
  })

  const mutation = useMutation({
    mutationFn: crearVenta,
    onSuccess: async (venta) => {
      if (idRecetaCargada) {
        try {
          await marcarRecetaDispensadaDesdeVenta(idRecetaCargada, venta.idVenta)
        } catch (error) {
          notifyError(getApiErrorMessage(error, 'La venta se guardo, pero no se pudo marcar la receta como dispensada.'))
        }
      }
      setDetalle([])
      setIdRecetaCargada(null)
      queryClient.invalidateQueries({ queryKey: ['productos', idZona] })
      queryClient.invalidateQueries({ queryKey: ['clinica', 'recetas-pendientes'] })
      notifySuccess('Venta guardada correctamente.')
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo guardar la venta.')),
  })

  const filtrados = useMemo(() => {
    const t = busqueda.toLowerCase()
    return productos.filter((p) => p.nombreProducto.toLowerCase().includes(t)).slice(0, 20)
  }, [productos, busqueda])

  function agregarProducto(p: Producto) {
    const idx = detalle.findIndex((d) => d.idProducto === p.idProducto)
    if (idx >= 0) {
      const clone = [...detalle]
      clone[idx].cantidad += 1
      clone[idx].subtotal = clone[idx].cantidad * clone[idx].precioUnitario
      setDetalle(clone)
      return
    }

    setDetalle((prev) => [
      ...prev,
      {
        idProducto: p.idProducto,
        nombreProducto: p.nombreProducto,
        cantidad: 1,
        precioUnitario: p.precio,
        subtotal: p.precio,
      },
    ])
  }

  function cambiarCantidad(idProducto: number, cantidad: number) {
    setDetalle((prev) =>
      prev.map((d) =>
        d.idProducto === idProducto
          ? { ...d, cantidad, subtotal: Number((cantidad * d.precioUnitario).toFixed(2)) }
          : d
      )
    )
  }

  function quitar(idProducto: number) {
    setDetalle((prev) => prev.filter((d) => d.idProducto !== idProducto))
  }

  const total = detalle.reduce((acc, d) => acc + d.subtotal, 0)
  const subTotal = Number((total / 1.18).toFixed(2))
  const igv = Number((total - subTotal).toFixed(2))
  const vuelto = Number((montoCobrado - total).toFixed(2))

  function guardarVenta() {
    const nextErrors: Record<string, string> = {}
    if (detalle.length === 0) nextErrors.detalle = 'Agrega al menos un producto.'
    if (!tipoPago) nextErrors.tipoPago = 'El tipo de pago es obligatorio.'
    if (documentoTipo !== 'NINGUNO' && isBlank(documentoNumero)) nextErrors.documentoNumero = 'El DNI o RUC es obligatorio.'
    if (documentoTipo !== 'NINGUNO' && isBlank(documentoNombre)) nextErrors.documentoNombre = 'El nombre o razón social es obligatorio.'
    if (montoCobrado < total) nextErrors.montoCobrado = 'El monto cobrado no puede ser menor al total.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      notifyError('Completa los campos obligatorios de la venta.')
      return
    }
    mutation.mutate({
      montoVenta: Number(total.toFixed(2)),
      tipoPago,
      montoCobrado,
      vuelto,
      documentoTipo,
      documentoNumero,
      documentoNombre,
      detalleVentas: detalle,
    })
  }

  async function cargarRecetaEnVenta(idReceta: number) {
    setCargandoReceta(true)
    try {
      const receta = await obtenerDetalleRecetaPendiente(idReceta)
      const itemsConProducto = receta.detalles.filter((d) => d.idProducto)
      const itemsSinProducto = receta.detalles.length - itemsConProducto.length

      if (itemsConProducto.length === 0) {
        notifyError('La receta no tiene productos vinculados para farmacia.')
        return
      }

      setDetalle((prev) => {
        const acumulado = new Map(prev.map((d) => [d.idProducto, { ...d }]))

        for (const item of itemsConProducto) {
          const idProducto = item.idProducto as number
          const existente = acumulado.get(idProducto)
          const precio = Number(item.precioUnitario || 0)
          const cantidad = Number(item.cantidad || 0)

          if (existente) {
            const nuevaCantidad = existente.cantidad + cantidad
            acumulado.set(idProducto, {
              ...existente,
              cantidad: nuevaCantidad,
              subtotal: Number((nuevaCantidad * existente.precioUnitario).toFixed(2)),
            })
          } else {
            acumulado.set(idProducto, {
              idProducto,
              nombreProducto: item.nombreProducto,
              cantidad,
              precioUnitario: precio,
              subtotal: Number((cantidad * precio).toFixed(2)),
            })
          }
        }

        return Array.from(acumulado.values())
      })

      setDocumentoNombre(`${receta.paciente.apellidos}, ${receta.paciente.nombres}`)
      setIdRecetaCargada(idReceta)
      if (itemsSinProducto > 0) {
        notifySuccess(`Receta ${idReceta} cargada parcialmente. ${itemsSinProducto} item(s) sin producto vinculado.`)
      } else {
        notifySuccess(`Receta ${idReceta} cargada en la venta.`)
      }
    } catch (error) {
      notifyError(getApiErrorMessage(error, 'No se pudo cargar la receta del paciente.'))
    } finally {
      setCargandoReceta(false)
    }
  }

  return (
    <main className="p-6 space-y-6">

      <section className="rounded-md border bg-white p-4 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Jalar receta por paciente</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <OptionalLabel>Buscar paciente (nombre o apellido)</OptionalLabel>
            <Input
              placeholder="Escribe al menos 2 letras"
              value={pacienteBusqueda}
              onChange={(e) => {
                setPacienteBusqueda(e.target.value)
                setIdPacienteSeleccionado('')
              }}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <RequiredLabel>Paciente</RequiredLabel>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 w-full"
              value={idPacienteSeleccionado}
              onChange={(e) => setIdPacienteSeleccionado(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Selecciona un paciente</option>
              {pacientes.map((p) => (
                <option key={p.idPaciente} value={p.idPaciente}>
                  {p.apellidos}, {p.nombres} ({p.dni})
                </option>
              ))}
            </select>
            {cargandoPacientes && <p className="text-xs text-muted-foreground">Buscando pacientes...</p>}
          </div>
        </div>

        {typeof idPacienteSeleccionado === 'number' && (
          <div className="rounded-md border">
            <div className="px-3 py-2 border-b text-sm font-medium">Recetas pendientes del paciente</div>
            {cargandoRecetasPaciente ? (
              <p className="p-3 text-sm text-muted-foreground">Cargando recetas...</p>
            ) : recetasPendientesPaciente.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">No hay recetas pendientes para este paciente.</p>
            ) : (
              <div className="divide-y">
                {recetasPendientesPaciente.map((receta) => (
                  <div key={receta.idReceta} className="p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Receta #{receta.idReceta}</p>
                      <p className="text-xs text-muted-foreground">{new Date(receta.fechaReceta).toLocaleString()}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={cargandoReceta}
                      onClick={() => cargarRecetaEnVenta(receta.idReceta)}
                    >
                      {cargandoReceta ? 'Cargando...' : 'Cargar en venta'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>


      <section className="rounded-md border bg-white p-4 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="space-y-1"><OptionalLabel>Correlativo</OptionalLabel><Input value="Autogenerado" disabled /></div>
        <div className="space-y-1"><RequiredLabel>Tipo de pago</RequiredLabel><select className={fieldClass(Boolean(errors.tipoPago)) + ' h-10 rounded-md bg-background px-3 w-full'} value={tipoPago} onChange={(e) => { setTipoPago(Number(e.target.value)); setErrors((prev) => ({ ...prev, tipoPago: '' })) }}><option value={1}>Efectivo</option><option value={2}>Tarjeta</option></select><FieldError message={errors.tipoPago} /></div>
        <div className="space-y-1"><OptionalLabel>Documento</OptionalLabel><select className="h-10 rounded-md border border-input bg-background px-3 w-full" value={documentoTipo} onChange={(e) => setDocumentoTipo(e.target.value as 'NINGUNO' | 'BOLETA' | 'FACTURA' | 'TICKET')}><option value="NINGUNO">Sin documento</option><option value="BOLETA">Boleta</option><option value="FACTURA">Factura</option><option value="TICKET">Ticket</option></select></div>
        <div className="space-y-1"><RequiredLabel>DNI / RUC</RequiredLabel><Input className={fieldClass(Boolean(errors.documentoNumero))} value={documentoNumero} onChange={(e) => { setDocumentoNumero(e.target.value); setErrors((prev) => ({ ...prev, documentoNumero: '' })) }} /><FieldError message={errors.documentoNumero} /></div>
        <div className="space-y-1 xl:col-span-2"><RequiredLabel>Nombres / Razón social</RequiredLabel><Input className={fieldClass(Boolean(errors.documentoNombre))} value={documentoNombre} onChange={(e) => { setDocumentoNombre(e.target.value); setErrors((prev) => ({ ...prev, documentoNombre: '' })) }} /><FieldError message={errors.documentoNombre} /></div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <OptionalLabel>Buscar producto</OptionalLabel>
          <Input
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <div className="max-h-[420px] overflow-y-auto rounded-md border bg-white">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Cargando productos...</p>
            ) : (
              filtrados.map((p) => (
                <button
                  key={p.idProducto}
                  className="w-full text-left px-4 py-3 border-b hover:bg-slate-50"
                  onClick={() => agregarProducto(p)}
                >
                  <p className="font-medium">{p.nombreProducto}</p>
                  <p className="text-sm text-muted-foreground">
                    S/ {p.precio.toFixed(2)} | Stock: {p.stock}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-md border bg-white">
          <div className="px-4 pt-3"><FieldError message={errors.detalle} /></div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>P.U.</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detalle.map((d) => (
                <TableRow key={d.idProducto}>
                  <TableCell>{d.nombreProducto}</TableCell>
                  <TableCell>S/ {d.precioUnitario.toFixed(2)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      value={d.cantidad}
                      onChange={(e) => cambiarCantidad(d.idProducto, Number(e.target.value || 1))}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>S/ {d.subtotal.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => quitar(d.idProducto)}>
                      Quitar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="p-4 border-t space-y-4">
            <div className="grid gap-3 md:grid-cols-5">
              <div><p className="text-xs uppercase text-muted-foreground">Sub total</p><p className="text-lg font-semibold">S/ {subTotal.toFixed(2)}</p></div>
              <div><p className="text-xs uppercase text-muted-foreground">IGV</p><p className="text-lg font-semibold">S/ {igv.toFixed(2)}</p></div>
              <div><p className="text-xs uppercase text-muted-foreground">Total</p><p className="text-lg font-semibold">S/ {total.toFixed(2)}</p></div>
              <div className="space-y-1"><RequiredLabel>Paga con</RequiredLabel><Input className={fieldClass(Boolean(errors.montoCobrado))} type="number" step="0.01" value={montoCobrado} onChange={(e) => { setMontoCobrado(Number(e.target.value)); setErrors((prev) => ({ ...prev, montoCobrado: '' })) }} /><FieldError message={errors.montoCobrado} /></div>
              <div><p className="text-xs uppercase text-muted-foreground">Vuelto</p><p className={`text-lg font-semibold ${vuelto < 0 ? 'text-red-600' : 'text-emerald-600'}`}>S/ {vuelto.toFixed(2)}</p></div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="outline" onClick={guardarVenta} disabled={mutation.isPending || detalle.length === 0}>{mutation.isPending ? 'Guardando...' : 'Guardar'}</Button>
              <Button onClick={guardarVenta} disabled={mutation.isPending || detalle.length === 0}>Guardar | {documentoTipo === 'NINGUNO' ? 'Venta' : documentoTipo}</Button>
            </div>
          </div>

          {mutation.isError && (
            <p className="p-4 text-sm text-red-600">No se pudo guardar la venta. Revisa stock o permisos.</p>
          )}
          {mutation.isSuccess && (
            <p className="p-4 text-sm text-emerald-600">Venta registrada correctamente.</p>
          )}
        </div>
      </section>
    </main>
  )
}
