import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  crearOrdenLaboratorio,
  crearReceta,
  iniciarAtencion,
  listarAdmisiones,
  listarAtenciones,
  listarDiagnosticosPorAtencion,
  listarExamenesLaboratorio,
  listarMedicos,
  listarTriajes,
  obtenerResumenAtencion,
  registrarDiagnostico,
  type AtencionPayload,
  type DiagnosticoPayload,
  type ExamenLaboratorio,
  type RecetaDetallePayload,
} from '@/api/clinicaApi'
import { listarProductos } from '@/api/ventasApi'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'

const emptyAtencion: AtencionPayload = {
  idAdmision: 0,
  idMedico: 0,
  sintomas: '',
  examenFisico: '',
  tratamiento: '',
  evolucion: '',
  observaciones: '',
}

const emptyDiagnostico: DiagnosticoPayload = {
  codigoCie10: '',
  descripcion: '',
  tipo: 'PRESUNTIVO',
}

const emptyRecetaDetalle: RecetaDetallePayload = {
  idProducto: undefined,
  medicamento: '',
  cantidad: 1,
  dosis: '',
  frecuencia: '',
  duracion: '',
  indicaciones: '',
}

const emptyOrdenLaboratorio = {
  idExamen: 0,
  observaciones: '',
}

export default function ConsultaMedicaPage() {
  const queryClient = useQueryClient()
  const idZona = useAuthStore((s) => s.idZona) ?? 1
  const [atencionForm, setAtencionForm] = useState<AtencionPayload>(emptyAtencion)
  const [diagForm, setDiagForm] = useState<DiagnosticoPayload>(emptyDiagnostico)
  const [idAtencionActiva, setIdAtencionActiva] = useState<number | null>(null)
  const [recetaItems, setRecetaItems] = useState<RecetaDetallePayload[]>([{ ...emptyRecetaDetalle }])
  const [recetaObs, setRecetaObs] = useState('')
  const [filtroExamen, setFiltroExamen] = useState('')
  const [ordenLaboratorioForm, setOrdenLaboratorioForm] = useState(emptyOrdenLaboratorio)

  const admisionesQuery = useQuery({ queryKey: ['clinica', 'admisiones'], queryFn: () => listarAdmisiones() })
  const medicosQuery = useQuery({ queryKey: ['clinica', 'medicos'], queryFn: listarMedicos })
  const atencionesQuery = useQuery({ queryKey: ['clinica', 'atenciones'], queryFn: () => listarAtenciones() })
  const productosQuery = useQuery({ queryKey: ['productos', idZona], queryFn: () => listarProductos(idZona) })
  const diagnosticosQuery = useQuery({
    queryKey: ['clinica', 'diagnosticos', idAtencionActiva],
    queryFn: () => listarDiagnosticosPorAtencion(idAtencionActiva as number),
    enabled: Boolean(idAtencionActiva),
  })
  const resumenAtencionQuery = useQuery({
    queryKey: ['clinica', 'atencion-resumen', idAtencionActiva],
    queryFn: () => obtenerResumenAtencion(idAtencionActiva as number),
    enabled: Boolean(idAtencionActiva),
  })
  const triajeAdmisionQuery = useQuery({
    queryKey: ['clinica', 'triajes-admision', atencionForm.idAdmision],
    queryFn: () => listarTriajes(atencionForm.idAdmision),
    enabled: Boolean(atencionForm.idAdmision),
  })
  const examenesQuery = useQuery({
    queryKey: ['clinica', 'examenes-laboratorio', filtroExamen],
    queryFn: () => listarExamenesLaboratorio({ activo: true, q: filtroExamen || undefined, page: 0, size: 50 }),
  })

  const createAtencionMutation = useMutation({
    mutationFn: () => iniciarAtencion(atencionForm),
    onSuccess: (data) => {
      notifySuccess('Atencion iniciada')
      setIdAtencionActiva(data.idAtencion)
      queryClient.invalidateQueries({ queryKey: ['clinica', 'atenciones'] })
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo iniciar atencion')),
  })

  const createDiagMutation = useMutation({
    mutationFn: () => registrarDiagnostico(idAtencionActiva as number, diagForm),
    onSuccess: () => {
      notifySuccess('Diagnostico registrado')
      setDiagForm(emptyDiagnostico)
      queryClient.invalidateQueries({ queryKey: ['clinica', 'diagnosticos', idAtencionActiva] })
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo registrar diagnostico')),
  })

  const createRecetaMutation = useMutation({
    mutationFn: () => crearReceta(idAtencionActiva as number, { observaciones: recetaObs, detalles: recetaItems }),
    onSuccess: () => {
      notifySuccess('Receta generada para farmacia')
      setRecetaItems([{ ...emptyRecetaDetalle }])
      setRecetaObs('')
      queryClient.invalidateQueries({ queryKey: ['clinica', 'recetas-pendientes'] })
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo generar receta')),
  })

  const createOrdenLaboratorioMutation = useMutation({
    mutationFn: () =>
      crearOrdenLaboratorio(idAtencionActiva as number, {
        idExamen: ordenLaboratorioForm.idExamen,
        observaciones: ordenLaboratorioForm.observaciones || undefined,
      }),
    onSuccess: () => {
      notifySuccess('Orden de laboratorio generada')
      setOrdenLaboratorioForm(emptyOrdenLaboratorio)
      queryClient.invalidateQueries({ queryKey: ['clinica', 'atencion-resumen', idAtencionActiva] })
      queryClient.invalidateQueries({ queryKey: ['clinica', 'lab-ordenes'] })
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo generar la orden de laboratorio')),
  })

  const admisiones = admisionesQuery.data ?? []
  const medicos = medicosQuery.data ?? []
  const atenciones = atencionesQuery.data ?? []
  const diagnosticos = diagnosticosQuery.data ?? []
  const productos = productosQuery.data ?? []
  const resumenAtencion = resumenAtencionQuery.data
  const triajeAdmision = (triajeAdmisionQuery.data ?? [])[0] ?? null
  const examenesActivos = examenesQuery.data?.content ?? []

  const examenSeleccionado: ExamenLaboratorio | null =
    examenesActivos.find((examen) => examen.idExamen === ordenLaboratorioForm.idExamen) ?? null

  const atencionActiva = useMemo(
    () => atenciones.find((atencion) => atencion.idAtencion === idAtencionActiva) ?? null,
    [atenciones, idAtencionActiva]
  )

  function updateRecetaItem(index: number, patch: Partial<RecetaDetallePayload>) {
    setRecetaItems((prev) => prev.map((item, i) => i === index ? { ...item, ...patch } : item))
  }

  return (
    <main className="p-6 space-y-6">
      <section className="rounded-xl border bg-white p-5">
        <h1 className="text-2xl font-semibold text-slate-900">Consulta Medica</h1>
        <p className="text-sm text-slate-600 mt-1">Atencion, diagnosticos y receta integrada con farmacia.</p>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold">1) Iniciar atencion</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select className="h-10 rounded-md border px-3 xl:col-span-2" value={atencionForm.idAdmision} onChange={(e) => setAtencionForm((s) => ({ ...s, idAdmision: Number(e.target.value) }))}>
            <option value={0}>Admision</option>
            {admisiones.map((admision) => <option key={admision.idAdmision} value={admision.idAdmision}>{admision.paciente.apellidos}, {admision.paciente.nombres}</option>)}
          </select>
          <select className="h-10 rounded-md border px-3" value={atencionForm.idMedico} onChange={(e) => setAtencionForm((s) => ({ ...s, idMedico: Number(e.target.value) }))}>
            <option value={0}>Medico</option>
            {medicos.map((medico) => <option key={medico.idMedico} value={medico.idMedico}>{medico.apellidos}, {medico.nombres}</option>)}
          </select>
          <Button disabled={createAtencionMutation.isPending || !atencionForm.idAdmision || !atencionForm.idMedico} onClick={() => createAtencionMutation.mutate()}>
            {createAtencionMutation.isPending ? 'Guardando...' : 'Iniciar atencion'}
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <textarea className="min-h-20 rounded-md border px-3 py-2 text-sm" placeholder="Sintomas" value={atencionForm.sintomas ?? ''} onChange={(e) => setAtencionForm((s) => ({ ...s, sintomas: e.target.value }))} />
          <textarea className="min-h-20 rounded-md border px-3 py-2 text-sm" placeholder="Examen fisico" value={atencionForm.examenFisico ?? ''} onChange={(e) => setAtencionForm((s) => ({ ...s, examenFisico: e.target.value }))} />
          <textarea className="min-h-20 rounded-md border px-3 py-2 text-sm" placeholder="Tratamiento" value={atencionForm.tratamiento ?? ''} onChange={(e) => setAtencionForm((s) => ({ ...s, tratamiento: e.target.value }))} />
          <textarea className="min-h-20 rounded-md border px-3 py-2 text-sm" placeholder="Evolucion y observaciones" value={atencionForm.evolucion ?? ''} onChange={(e) => setAtencionForm((s) => ({ ...s, evolucion: e.target.value }))} />
        </div>

        {atencionForm.idAdmision > 0 && (
          <div className="rounded-lg border bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-800">Triaje de la admision seleccionada</p>
            {triajeAdmision ? (
              <div className="mt-2 grid gap-2 text-xs text-slate-700 md:grid-cols-3">
                <span>Peso: {triajeAdmision.pesoKg ?? '-'} kg</span>
                <span>Talla: {triajeAdmision.tallaM ?? '-'} m</span>
                <span>IMC: {triajeAdmision.imc ?? '-'}</span>
                <span>Presion: {triajeAdmision.presionArterial ?? '-'}</span>
                <span>Temperatura: {triajeAdmision.temperatura ?? '-'} C</span>
                <span>FC: {triajeAdmision.frecuenciaCardiaca ?? '-'}</span>
                <span>SpO2: {triajeAdmision.saturacionOxigeno ?? '-'}%</span>
                <span className="md:col-span-2">Motivo: {triajeAdmision.motivoConsulta ?? '-'}</span>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">La admision seleccionada no tiene triaje registrado.</p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">2) Diagnosticos</h2>
          <select className="h-10 rounded-md border px-3" value={idAtencionActiva ?? ''} onChange={(e) => setIdAtencionActiva(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Seleccionar atencion</option>
            {atenciones.map((atencion) => (
              <option key={atencion.idAtencion} value={atencion.idAtencion}>
                {atencion.idAtencion} - {atencion.admision.paciente.apellidos}, {atencion.admision.paciente.nombres}
              </option>
            ))}
          </select>
        </div>

        {atencionActiva && (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Atencion activa: {atencionActiva.admision.paciente.apellidos}, {atencionActiva.admision.paciente.nombres}</p>
            <div className="rounded-lg border bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-800">Triaje de la atencion</p>
              {resumenAtencion?.triaje ? (
                <div className="mt-2 grid gap-2 text-xs text-slate-700 md:grid-cols-3">
                  <span>Peso: {resumenAtencion.triaje.pesoKg ?? '-'} kg</span>
                  <span>Talla: {resumenAtencion.triaje.tallaM ?? '-'} m</span>
                  <span>IMC: {resumenAtencion.triaje.imc ?? '-'}</span>
                  <span>Presion: {resumenAtencion.triaje.presionArterial ?? '-'}</span>
                  <span>Temperatura: {resumenAtencion.triaje.temperatura ?? '-'} C</span>
                  <span>FC: {resumenAtencion.triaje.frecuenciaCardiaca ?? '-'}</span>
                  <span>SpO2: {resumenAtencion.triaje.saturacionOxigeno ?? '-'}%</span>
                  <span className="md:col-span-2">Motivo: {resumenAtencion.triaje.motivoConsulta ?? '-'}</span>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500">La admision aun no tiene triaje registrado.</p>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-4">
          <Input placeholder="Codigo CIE-10" value={diagForm.codigoCie10 ?? ''} onChange={(e) => setDiagForm((s) => ({ ...s, codigoCie10: e.target.value }))} />
          <Input placeholder="Descripcion" value={diagForm.descripcion} onChange={(e) => setDiagForm((s) => ({ ...s, descripcion: e.target.value }))} className="md:col-span-2" />
          <select className="h-10 rounded-md border px-3" value={diagForm.tipo ?? 'PRESUNTIVO'} onChange={(e) => setDiagForm((s) => ({ ...s, tipo: e.target.value }))}>
            <option value="PRESUNTIVO">Presuntivo</option>
            <option value="DEFINITIVO">Definitivo</option>
          </select>
        </div>

        <div className="flex justify-end">
          <Button disabled={!idAtencionActiva || createDiagMutation.isPending || !diagForm.descripcion.trim()} onClick={() => createDiagMutation.mutate()}>
            {createDiagMutation.isPending ? 'Guardando...' : 'Registrar diagnostico'}
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CIE-10</TableHead>
              <TableHead>Descripcion</TableHead>
              <TableHead>Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {diagnosticos.map((diagnostico) => (
              <TableRow key={diagnostico.idDiagnosticoAtencion}>
                <TableCell>{diagnostico.codigoCie10 ?? '-'}</TableCell>
                <TableCell>{diagnostico.descripcion}</TableCell>
                <TableCell>{diagnostico.tipo}</TableCell>
              </TableRow>
            ))}
            {diagnosticos.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-slate-500">No hay diagnosticos en la atencion seleccionada.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold">3) Orden de laboratorio desde consulta</h2>

        <div className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Buscar examen por codigo o nombre"
            value={filtroExamen}
            onChange={(e) => setFiltroExamen(e.target.value)}
          />
          <select
            className="h-10 rounded-md border px-3 md:col-span-2"
            value={ordenLaboratorioForm.idExamen}
            onChange={(e) => setOrdenLaboratorioForm((s) => ({ ...s, idExamen: Number(e.target.value) || 0 }))}
          >
            <option value={0}>Seleccionar examen de catalogo</option>
            {examenesActivos.map((examen) => (
              <option key={examen.idExamen} value={examen.idExamen}>
                {examen.codigo} - {examen.nombre}
              </option>
            ))}
          </select>
          <Input
            className="md:col-span-3"
            placeholder="Observaciones de orden"
            value={ordenLaboratorioForm.observaciones}
            onChange={(e) => setOrdenLaboratorioForm((s) => ({ ...s, observaciones: e.target.value }))}
          />
        </div>

        {examenSeleccionado && (
          <div className="rounded-lg border bg-slate-50 p-3 text-xs text-slate-700">
            <p><strong>Area:</strong> {examenSeleccionado.areaLaboratorio}</p>
            <p><strong>Precio:</strong> S/ {Number(examenSeleccionado.precio ?? 0).toFixed(2)}</p>
            <p><strong>Entrega estimada:</strong> {examenSeleccionado.tiempoEntrega}</p>
            <p><strong>Ayuno:</strong> {examenSeleccionado.requiereAyuno ? 'Si' : 'No'} | <strong>Muestra especial:</strong> {examenSeleccionado.requiereMuestraEspecial ? 'Si' : 'No'}</p>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            disabled={!idAtencionActiva || !ordenLaboratorioForm.idExamen || createOrdenLaboratorioMutation.isPending}
            onClick={() => createOrdenLaboratorioMutation.mutate()}
          >
            {createOrdenLaboratorioMutation.isPending ? 'Generando...' : 'Generar orden de laboratorio'}
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Examen</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Precio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(resumenAtencion?.ordenesLaboratorio ?? []).map((orden) => (
              <TableRow key={orden.idOrdenLaboratorio}>
                <TableCell>{new Date(orden.fechaOrden).toLocaleString()}</TableCell>
                <TableCell>{orden.examen}</TableCell>
                <TableCell>{orden.estado}</TableCell>
                <TableCell>{orden.precioExamen ? `S/ ${Number(orden.precioExamen).toFixed(2)}` : '-'}</TableCell>
              </TableRow>
            ))}
            {(resumenAtencion?.ordenesLaboratorio ?? []).length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-slate-500">No hay ordenes de laboratorio para esta atencion.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold">4) Receta medica</h2>
        <div className="space-y-3">
          {recetaItems.map((item, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-6">
              <select className="h-10 rounded-md border px-3 md:col-span-2" value={item.idProducto ?? ''} onChange={(e) => {
                const idProducto = e.target.value ? Number(e.target.value) : undefined
                const producto = productos.find((p) => p.idProducto === idProducto)
                updateRecetaItem(index, { idProducto, medicamento: producto?.nombreProducto ?? item.medicamento })
              }}>
                <option value="">Producto farmacia</option>
                {productos.map((producto) => <option key={producto.idProducto} value={producto.idProducto}>{producto.nombreProducto}</option>)}
              </select>
              <Input placeholder="Medicamento" value={item.medicamento} onChange={(e) => updateRecetaItem(index, { medicamento: e.target.value })} />
              <Input type="number" min={1} placeholder="Cantidad" value={item.cantidad} onChange={(e) => updateRecetaItem(index, { cantidad: Number(e.target.value) || 1 })} />
              <Input placeholder="Dosis" value={item.dosis ?? ''} onChange={(e) => updateRecetaItem(index, { dosis: e.target.value })} />
              <Input placeholder="Frecuencia" value={item.frecuencia ?? ''} onChange={(e) => updateRecetaItem(index, { frecuencia: e.target.value })} />
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setRecetaItems((prev) => [...prev, { ...emptyRecetaDetalle }])}>Agregar item</Button>
          {recetaItems.length > 1 && <Button variant="outline" onClick={() => setRecetaItems((prev) => prev.slice(0, -1))}>Quitar ultimo</Button>}
        </div>

        <textarea className="min-h-20 w-full rounded-md border px-3 py-2 text-sm" placeholder="Observaciones receta" value={recetaObs} onChange={(e) => setRecetaObs(e.target.value)} />

        <div className="flex justify-end">
          <Button disabled={!idAtencionActiva || createRecetaMutation.isPending || recetaItems.some((item) => !item.medicamento || !item.cantidad)} onClick={() => createRecetaMutation.mutate()}>
            {createRecetaMutation.isPending ? 'Guardando...' : 'Generar receta para farmacia'}
          </Button>
        </div>
      </section>
    </main>
  )
}
