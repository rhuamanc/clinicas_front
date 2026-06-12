import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarProductos } from '@/api/ventasApi'
import { listarProveedores } from '@/api/catalogosApi'
import { crearCompra } from '@/api/comprasApi'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { FieldError, OptionalLabel, RequiredLabel, fieldClass, isBlank } from '@/components/ui/form-feedback'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'
import { type DetalleCompraDTO, type Producto } from '@/types'

export default function ComprasPage() {
  const queryClient = useQueryClient()
  const idZona = useAuthStore((s) => s.idZona) ?? 1
  const [idProveedor, setIdProveedor] = useState<number>(0)
  const [busqueda, setBusqueda] = useState('')
  const [detalle, setDetalle] = useState<DetalleCompraDTO[]>([])
  const [tipoComprobante, setTipoComprobante] = useState('FACTURA')
  const [nroComprobante, setNroComprobante] = useState('')
  const [nroGuia, setNroGuia] = useState('')
  const [tipoPago, setTipoPago] = useState('CONTADO')
  const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().slice(0, 10))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: productos = [] } = useQuery({ 
    queryKey: ['productos', idZona], 
    queryFn: () => listarProductos(idZona),
    refetchOnWindowFocus: true,
  })
  const { data: proveedores = [] } = useQuery({ queryKey: ['proveedores'], queryFn: listarProveedores })
  const proveedorSeleccionado = proveedores.find((p) => p.idProveedor === idProveedor)

  const mutation = useMutation({
    mutationFn: crearCompra,
    onSuccess: () => {
      setDetalle([])
      queryClient.invalidateQueries({ queryKey: ['productos', idZona] })
      notifySuccess('Compra guardada correctamente.')
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo guardar la compra.')),
  })

  const filtrados = useMemo(() => {
    const t = busqueda.toLowerCase()
    return productos.filter((p) => p.nombreProducto.toLowerCase().includes(t)).slice(0, 20)
  }, [productos, busqueda])

  function agregar(p: Producto) {
    const idx = detalle.findIndex((d) => d.idProducto === p.idProducto)
    if (idx >= 0) {
      const clone = [...detalle]
      clone[idx].cantidad += 1
      clone[idx].subtotal = Number((clone[idx].cantidad * clone[idx].precioUnitario).toFixed(2))
      setDetalle(clone)
      return
    }

    const precio = p.precioCompra ?? p.precio
    setDetalle((prev) => [...prev, { idProducto: p.idProducto, nombreProducto: p.nombreProducto, cantidad: 1, precioUnitario: precio, subtotal: precio }])
  }

  function cambiarCantidad(idProducto: number, cantidad: number) {
    setDetalle((prev) => prev.map((d) => d.idProducto === idProducto ? { ...d, cantidad, subtotal: Number((cantidad * d.precioUnitario).toFixed(2)) } : d))
  }

  function quitar(idProducto: number) {
    setDetalle((prev) => prev.filter((d) => d.idProducto !== idProducto))
  }

  const total = detalle.reduce((acc, d) => acc + d.subtotal, 0)

  function guardarCompra() {
    const nextErrors: Record<string, string> = {}
    if (isBlank(tipoComprobante)) nextErrors.tipoComprobante = 'El tipo de comprobante es obligatorio.'
    if (isBlank(nroComprobante)) nextErrors.nroComprobante = 'El número de comprobante es obligatorio.'
    if (isBlank(nroGuia)) nextErrors.nroGuia = 'El número de guía es obligatorio.'
    if (isBlank(fechaCompra)) nextErrors.fechaCompra = 'La fecha es obligatoria.'
    if (idProveedor <= 0) nextErrors.idProveedor = 'Selecciona un proveedor.'
    if (isBlank(tipoPago)) nextErrors.tipoPago = 'El tipo de pago es obligatorio.'
    if (detalle.length === 0) nextErrors.detalle = 'Agrega al menos un producto.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      notifyError('Completa los campos obligatorios de la compra.')
      return
    }
    mutation.mutate({ idProveedor, tipoComprobante, nroComprobante, nroGuia, tipoPago, fechaTransaccion: `${fechaCompra}T00:00:00`, montoCompra: Number(total.toFixed(2)), detalleCompras: detalle })
  }

  return (
    <main className="p-6 space-y-6">


      <section className="rounded-md border bg-white p-4 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <div className="space-y-1"><RequiredLabel>Tipo comprobante</RequiredLabel><select className={fieldClass(Boolean(errors.tipoComprobante)) + ' h-10 rounded-md bg-background px-3 w-full'} value={tipoComprobante} onChange={(e) => { setTipoComprobante(e.target.value); setErrors((prev) => ({ ...prev, tipoComprobante: '' })) }}><option value="FACTURA">Factura</option><option value="BOLETA">Boleta</option><option value="GUIA">Guía</option></select><FieldError message={errors.tipoComprobante} /></div>
        <div className="space-y-1"><RequiredLabel>Nro. comprobante</RequiredLabel><Input className={fieldClass(Boolean(errors.nroComprobante))} value={nroComprobante} onChange={(e) => { setNroComprobante(e.target.value); setErrors((prev) => ({ ...prev, nroComprobante: '' })) }} /><FieldError message={errors.nroComprobante} /></div>
        <div className="space-y-1"><RequiredLabel>Nro. guía</RequiredLabel><Input className={fieldClass(Boolean(errors.nroGuia))} value={nroGuia} onChange={(e) => { setNroGuia(e.target.value); setErrors((prev) => ({ ...prev, nroGuia: '' })) }} /><FieldError message={errors.nroGuia} /></div>
        <div className="space-y-1"><RequiredLabel>Fecha</RequiredLabel><Input className={fieldClass(Boolean(errors.fechaCompra))} type="date" value={fechaCompra} onChange={(e) => { setFechaCompra(e.target.value); setErrors((prev) => ({ ...prev, fechaCompra: '' })) }} /><FieldError message={errors.fechaCompra} /></div>
        <div className="space-y-1"><RequiredLabel>Proveedor</RequiredLabel><select className={fieldClass(Boolean(errors.idProveedor)) + ' h-10 rounded-md bg-background px-3 w-full'} value={idProveedor} onChange={(e) => { setIdProveedor(Number(e.target.value)); setErrors((prev) => ({ ...prev, idProveedor: '' })) }}><option value={0}>Seleccionar proveedor</option>{proveedores.map((p) => <option key={p.idProveedor} value={p.idProveedor}>{p.nombreProveedor}</option>)}</select><FieldError message={errors.idProveedor} /></div>
        <div className="space-y-1"><OptionalLabel>RUC</OptionalLabel><Input value={proveedorSeleccionado?.ruc ?? ''} disabled /></div>
        <div className="space-y-1"><OptionalLabel>Dirección</OptionalLabel><Input value={proveedorSeleccionado?.direccion ?? ''} disabled /></div>
        <div className="space-y-1"><RequiredLabel>Tipo pago</RequiredLabel><select className={fieldClass(Boolean(errors.tipoPago)) + ' h-10 rounded-md bg-background px-3 w-full'} value={tipoPago} onChange={(e) => { setTipoPago(e.target.value); setErrors((prev) => ({ ...prev, tipoPago: '' })) }}><option value="CONTADO">CONTADO</option><option value="CREDITO_15">CREDITO 15 DIAS</option><option value="CREDITO_30">CREDITO 30 DIAS</option><option value="CREDITO_45">CREDITO 45 DIAS</option></select><FieldError message={errors.tipoPago} /></div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <OptionalLabel>Buscar producto</OptionalLabel>
          <Input placeholder="Buscar producto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          <div className="max-h-[380px] overflow-y-auto rounded-md border bg-white">
            {filtrados.map((p) => (
              <button key={p.idProducto} className="w-full text-left px-4 py-3 border-b hover:bg-slate-50" onClick={() => agregar(p)}>
                <p className="font-medium">{p.nombreProducto}</p>
                <p className="text-sm text-muted-foreground">Costo S/ {(p.precioCompra ?? p.precio).toFixed(2)}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-md border bg-white">
          <div className="px-4 pt-3"><FieldError message={errors.detalle} /></div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Lab.</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Vcto.</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>P.C.U.</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detalle.map((d) => (
                <TableRow key={d.idProducto}>
                  <TableCell>{d.nombreProducto}</TableCell>
                  <TableCell>{productos.find((p) => p.idProducto === d.idProducto)?.nombreLaboratorio ?? '-'}</TableCell>
                  <TableCell>{productos.find((p) => p.idProducto === d.idProducto)?.lote ?? '-'}</TableCell>
                  <TableCell>{productos.find((p) => p.idProducto === d.idProducto)?.fechaVencimiento ?? '-'}</TableCell>
                  <TableCell><Input type="number" min={1} value={d.cantidad} onChange={(e) => cambiarCantidad(d.idProducto, Number(e.target.value || 1))} className="w-24" /></TableCell>
                  <TableCell>S/ {d.precioUnitario.toFixed(2)}</TableCell>
                  <TableCell>S/ {d.subtotal.toFixed(2)}</TableCell>
                  <TableCell><Button size="sm" variant="outline" onClick={() => quitar(d.idProducto)}>Quitar</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-lg font-semibold">Total compra: S/ {total.toFixed(2)}</p>
            <Button onClick={guardarCompra} disabled={mutation.isPending || detalle.length === 0 || idProveedor <= 0}>{mutation.isPending ? 'Guardando...' : 'Guardar compra'}</Button>
          </div>
        </div>
      </section>
    </main>
  )
}
