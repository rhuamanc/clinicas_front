import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actualizarMedico, crearMedico, listarEspecialidades, listarMedicos, type Medico, type MedicoPayload } from '@/api/clinicaApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'

const emptyForm: MedicoPayload = {
  nombres: '',
  apellidos: '',
  cmp: '',
  telefono: '',
  email: '',
  consultorio: '',
  horarioInicio: '08:00',
  horarioFin: '14:00',
  activo: true,
  idsEspecialidad: [],
}

export default function MedicosPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<MedicoPayload>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)

  const medicosQuery = useQuery({
    queryKey: ['clinica', 'medicos'],
    queryFn: listarMedicos,
  })

  const especialidadesQuery = useQuery({
    queryKey: ['clinica', 'especialidades'],
    queryFn: listarEspecialidades,
  })

  const createMutation = useMutation({
    mutationFn: () => editingId ? actualizarMedico(editingId, form) : crearMedico(form),
    onSuccess: () => {
      notifySuccess(editingId ? 'Medico actualizado' : 'Medico registrado')
      setForm(emptyForm)
      setEditingId(null)
      queryClient.invalidateQueries({ queryKey: ['clinica', 'medicos'] })
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo registrar el medico')),
  })

  function editarMedico(medico: Medico) {
    setEditingId(medico.idMedico)
    setForm({
      nombres: medico.nombres,
      apellidos: medico.apellidos,
      cmp: medico.cmp,
      telefono: medico.telefono ?? '',
      email: medico.email ?? '',
      consultorio: medico.consultorio ?? '',
      horarioInicio: '08:00',
      horarioFin: '14:00',
      activo: medico.activo,
      idsEspecialidad: medico.especialidades?.map((e) => e.idEspecialidad) ?? [],
    })
  }

  function toggleEspecialidad(idEspecialidad: number) {
    setForm((prev) => ({
      ...prev,
      idsEspecialidad: prev.idsEspecialidad.includes(idEspecialidad)
        ? prev.idsEspecialidad.filter((id) => id !== idEspecialidad)
        : [...prev.idsEspecialidad, idEspecialidad],
    }))
  }

  const medicos = medicosQuery.data ?? []
  const especialidades = especialidadesQuery.data ?? []

  return (
    <main className="p-6 space-y-6">
      <section className="rounded-xl border bg-white p-5">
        <h1 className="text-2xl font-semibold text-slate-900">Medicos</h1>
        <p className="text-sm text-slate-600 mt-1">Registro de medicos, horarios, consultorio y especialidades.</p>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{editingId ? 'Editar medico' : 'Nuevo medico'}</h2>
          {editingId && (
            <Button variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm) }}>
              Cancelar edicion
            </Button>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input placeholder="Nombres" value={form.nombres} onChange={(e) => setForm((s) => ({ ...s, nombres: e.target.value }))} />
          <Input placeholder="Apellidos" value={form.apellidos} onChange={(e) => setForm((s) => ({ ...s, apellidos: e.target.value }))} />
          <Input placeholder="CMP" value={form.cmp} onChange={(e) => setForm((s) => ({ ...s, cmp: e.target.value }))} />
          <Input placeholder="Consultorio" value={form.consultorio ?? ''} onChange={(e) => setForm((s) => ({ ...s, consultorio: e.target.value }))} />
          <Input placeholder="Telefono" value={form.telefono ?? ''} onChange={(e) => setForm((s) => ({ ...s, telefono: e.target.value }))} />
          <Input placeholder="Email" value={form.email ?? ''} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
          <Input type="time" value={form.horarioInicio ?? ''} onChange={(e) => setForm((s) => ({ ...s, horarioInicio: e.target.value }))} />
          <Input type="time" value={form.horarioFin ?? ''} onChange={(e) => setForm((s) => ({ ...s, horarioFin: e.target.value }))} />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Especialidades</p>
          <div className="flex flex-wrap gap-2">
            {especialidades.map((especialidad) => {
              const active = form.idsEspecialidad.includes(especialidad.idEspecialidad)
              return (
                <button
                  key={especialidad.idEspecialidad}
                  type="button"
                  onClick={() => toggleEspecialidad(especialidad.idEspecialidad)}
                  className={`rounded-full border px-3 py-1 text-sm ${active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700'}`}
                >
                  {especialidad.nombre}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <Button disabled={createMutation.isPending || !form.nombres || !form.apellidos || !form.cmp || form.idsEspecialidad.length === 0} onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? 'Guardando...' : editingId ? 'Actualizar medico' : 'Registrar medico'}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medico</TableHead>
              <TableHead>CMP</TableHead>
              <TableHead>Consultorio</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead>Especialidades</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medicos.map((medico) => (
              <TableRow key={medico.idMedico}>
                <TableCell>{medico.apellidos}, {medico.nombres}</TableCell>
                <TableCell>{medico.cmp}</TableCell>
                <TableCell>{medico.consultorio ?? '-'}</TableCell>
                <TableCell>{medico.activo ? 'Activo' : 'Inactivo'}</TableCell>
                <TableCell>{medico.especialidades?.map((item) => item.nombre).join(', ') || '-'}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => editarMedico(medico)}>Editar</Button>
                </TableCell>
              </TableRow>
            ))}
            {medicos.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-500">No hay medicos registrados.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </main>
  )
}
