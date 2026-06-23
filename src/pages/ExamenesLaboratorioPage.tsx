import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  activarExamenLaboratorio,
  actualizarExamenLaboratorio,
  crearExamenLaboratorio,
  inactivarExamenLaboratorio,
  listarExamenesLaboratorio,
  type ExamenLaboratorio,
  type ExamenLaboratorioPayload,
} from '@/api/clinicaApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'

const AREAS = [
  'HEMATOLOGIA',
  'BIOQUIMICA',
  'INMUNOLOGIA',
  'MICROBIOLOGIA',
  'PARASITOLOGIA',
  'HORMONAS',
  'UROANALISIS',
  'OTROS',
]

const emptyForm: ExamenLaboratorioPayload = {
  codigo: '',
  nombre: '',
  descripcion: '',
  areaLaboratorio: 'HEMATOLOGIA',
  precio: 0,
  tiempoEntrega: '',
  requiereAyuno: false,
  requiereMuestraEspecial: false,
  indicacionesPaciente: '',
  activo: true,
}

export default function ExamenesLaboratorioPage() {
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const [area, setArea] = useState('')
  const [activo, setActivo] = useState<'TODOS' | 'ACTIVO' | 'INACTIVO'>('TODOS')
  const [page, setPage] = useState(0)

  const [editing, setEditing] = useState<ExamenLaboratorio | null>(null)
  const [form, setForm] = useState<ExamenLaboratorioPayload>(emptyForm)

  const examenesQuery = useQuery({
    queryKey: ['clinica', 'examenes-laboratorio', { q, area, activo, page }],
    queryFn: () =>
      listarExamenesLaboratorio({
        q: q || undefined,
        area: area || undefined,
        activo: activo === 'TODOS' ? undefined : activo === 'ACTIVO',
        page,
        size: 10,
      }),
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      if (editing) return actualizarExamenLaboratorio(editing.idExamen, form)
      return crearExamenLaboratorio(form)
    },
    onSuccess: () => {
      notifySuccess(editing ? 'Examen actualizado' : 'Examen registrado')
      setEditing(null)
      setForm(emptyForm)
      queryClient.invalidateQueries({ queryKey: ['clinica', 'examenes-laboratorio'] })
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo guardar examen')),
  })

  const toggleEstadoMutation = useMutation({
    mutationFn: (examen: ExamenLaboratorio) => {
      if (examen.activo) return inactivarExamenLaboratorio(examen.idExamen)
      return activarExamenLaboratorio(examen.idExamen)
    },
    onSuccess: () => {
      notifySuccess('Estado actualizado')
      queryClient.invalidateQueries({ queryKey: ['clinica', 'examenes-laboratorio'] })
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo actualizar estado')),
  })

  const data = examenesQuery.data
  const rows = data?.content ?? []

  const tituloFormulario = useMemo(() => (editing ? `Editar examen #${editing.idExamen}` : 'Registrar examen'), [editing])

  function cargarParaEditar(examen: ExamenLaboratorio) {
    setEditing(examen)
    setForm({
      codigo: examen.codigo,
      nombre: examen.nombre,
      descripcion: examen.descripcion ?? '',
      areaLaboratorio: examen.areaLaboratorio,
      precio: examen.precio,
      tiempoEntrega: examen.tiempoEntrega,
      requiereAyuno: examen.requiereAyuno,
      requiereMuestraEspecial: examen.requiereMuestraEspecial,
      indicacionesPaciente: examen.indicacionesPaciente ?? '',
      activo: examen.activo,
    })
  }

  function limpiarFormulario() {
    setEditing(null)
    setForm(emptyForm)
  }

  return (
    <main className="p-6 space-y-6">
      <section className="rounded-xl border bg-white p-5">
        <h1 className="text-2xl font-semibold text-slate-900">Mantenimiento de Examenes de Laboratorio</h1>
        <p className="mt-1 text-sm text-slate-600">Catalogo de examenes para consulta medica, caja y laboratorio clinico.</p>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold">{tituloFormulario}</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <Input placeholder="Codigo" value={form.codigo} onChange={(e) => setForm((s) => ({ ...s, codigo: e.target.value }))} />
          <Input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))} className="md:col-span-2" />
          <select className="h-10 rounded-md border px-3" value={form.areaLaboratorio} onChange={(e) => setForm((s) => ({ ...s, areaLaboratorio: e.target.value }))}>
            {AREAS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <Input placeholder="Precio" type="number" min={0.01} step="0.01" value={form.precio || ''} onChange={(e) => setForm((s) => ({ ...s, precio: Number(e.target.value) }))} />
          <Input placeholder="Tiempo estimado de entrega" value={form.tiempoEntrega} onChange={(e) => setForm((s) => ({ ...s, tiempoEntrega: e.target.value }))} />
          <label className="h-10 rounded-md border px-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(form.requiereAyuno)} onChange={(e) => setForm((s) => ({ ...s, requiereAyuno: e.target.checked }))} />
            Requiere ayuno
          </label>
          <label className="h-10 rounded-md border px-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(form.requiereMuestraEspecial)} onChange={(e) => setForm((s) => ({ ...s, requiereMuestraEspecial: e.target.checked }))} />
            Muestra especial
          </label>

          <textarea className="min-h-20 rounded-md border px-3 py-2 text-sm md:col-span-2" placeholder="Descripcion" value={form.descripcion ?? ''} onChange={(e) => setForm((s) => ({ ...s, descripcion: e.target.value }))} />
          <textarea className="min-h-20 rounded-md border px-3 py-2 text-sm md:col-span-2" placeholder="Indicaciones para el paciente" value={form.indicacionesPaciente ?? ''} onChange={(e) => setForm((s) => ({ ...s, indicacionesPaciente: e.target.value }))} />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={limpiarFormulario}>Limpiar</Button>
          <Button
            disabled={saveMutation.isPending || !form.codigo.trim() || !form.nombre.trim() || !form.tiempoEntrega.trim() || Number(form.precio) <= 0}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? 'Guardando...' : editing ? 'Actualizar examen' : 'Registrar examen'}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Input placeholder="Buscar por codigo o nombre" value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} className="md:col-span-2" />
          <select className="h-10 rounded-md border px-3" value={area} onChange={(e) => { setArea(e.target.value); setPage(0) }}>
            <option value="">Todas las areas</option>
            {AREAS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="h-10 rounded-md border px-3" value={activo} onChange={(e) => { setActivo(e.target.value as 'TODOS' | 'ACTIVO' | 'INACTIVO'); setPage(0) }}>
            <option value="TODOS">Todos</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Codigo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((examen) => (
              <TableRow key={examen.idExamen}>
                <TableCell>{examen.codigo}</TableCell>
                <TableCell>
                  <div className="font-medium text-slate-900">{examen.nombre}</div>
                  <div className="text-xs text-slate-500">{examen.descripcion || '-'}</div>
                </TableCell>
                <TableCell>{examen.areaLaboratorio}</TableCell>
                <TableCell>S/ {Number(examen.precio ?? 0).toFixed(2)}</TableCell>
                <TableCell>{examen.tiempoEntrega}</TableCell>
                <TableCell>
                  <span className={`rounded-full px-2 py-1 text-xs ${examen.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                    {examen.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => cargarParaEditar(examen)}>Editar</Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={toggleEstadoMutation.isPending}
                      onClick={() => toggleEstadoMutation.mutate(examen)}
                    >
                      {examen.activo ? 'Inactivar' : 'Activar'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-500">No hay examenes para los filtros seleccionados.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Pagina {(data?.page ?? 0) + 1} de {Math.max(data?.totalPages ?? 1, 1)} | Total: {data?.totalElements ?? 0}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={Boolean(data?.first) || examenesQuery.isFetching} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={Boolean(data?.last) || examenesQuery.isFetching} onClick={() => setPage((p) => p + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
