import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cambiarEstadoCita, crearCita, listarCitasDia, listarEspecialidades, listarMedicos, listarPacientes, reprogramarCita, type CitaPayload } from '@/api/clinicaApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'

function today() {
  return new Date().toISOString().slice(0, 10)
}

const emptyForm: CitaPayload = {
  idPaciente: 0,
  idMedico: 0,
  idEspecialidad: 0,
  fechaHora: '',
  motivo: '',
  observaciones: '',
}

export default function CitasPage() {
  const queryClient = useQueryClient()
  const [fecha, setFecha] = useState(today())
  const [form, setForm] = useState<CitaPayload>(emptyForm)
  const [reprogramacion, setReprogramacion] = useState<Record<number, string>>({})

  const pacientesQuery = useQuery({ queryKey: ['clinica', 'pacientes'], queryFn: () => listarPacientes() })
  const medicosQuery = useQuery({ queryKey: ['clinica', 'medicos'], queryFn: listarMedicos })
  const especialidadesQuery = useQuery({ queryKey: ['clinica', 'especialidades'], queryFn: listarEspecialidades })
  const citasQuery = useQuery({ queryKey: ['clinica', 'citas', fecha], queryFn: () => listarCitasDia(fecha) })

  const createMutation = useMutation({
    mutationFn: () => crearCita(form),
    onSuccess: () => {
      notifySuccess('Cita agendada')
      setForm(emptyForm)
      queryClient.invalidateQueries({ queryKey: ['clinica', 'citas'] })
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo agendar la cita')),
  })

  const estadoMutation = useMutation({
    mutationFn: ({ idCita, estado }: { idCita: number; estado: string }) => cambiarEstadoCita(idCita, estado),
    onSuccess: () => {
      notifySuccess('Estado de cita actualizado')
      queryClient.invalidateQueries({ queryKey: ['clinica', 'citas'] })
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo actualizar la cita')),
  })

  const reprogramarMutation = useMutation({
    mutationFn: ({ idCita, fechaHora }: { idCita: number; fechaHora: string }) => reprogramarCita(idCita, fechaHora),
    onSuccess: () => {
      notifySuccess('Cita reprogramada')
      queryClient.invalidateQueries({ queryKey: ['clinica', 'citas'] })
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo reprogramar la cita')),
  })

  const pacientes = pacientesQuery.data ?? []
  const medicos = medicosQuery.data ?? []
  const especialidades = especialidadesQuery.data ?? []
  const citas = citasQuery.data ?? []

  return (
    <main className="p-6 space-y-6">
      <section className="rounded-xl border bg-white p-5">
        <h1 className="text-2xl font-semibold text-slate-900">Citas</h1>
        <p className="text-sm text-slate-600 mt-1">Agenda, confirmacion y cancelacion de citas medicas.</p>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold">Nueva cita</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <select className="h-10 rounded-md border px-3" value={form.idPaciente} onChange={(e) => setForm((s) => ({ ...s, idPaciente: Number(e.target.value) }))}>
            <option value={0}>Paciente</option>
            {pacientes.map((paciente) => <option key={paciente.idPaciente} value={paciente.idPaciente}>{paciente.apellidos}, {paciente.nombres}</option>)}
          </select>
          <select className="h-10 rounded-md border px-3" value={form.idMedico} onChange={(e) => setForm((s) => ({ ...s, idMedico: Number(e.target.value) }))}>
            <option value={0}>Medico</option>
            {medicos.map((medico) => <option key={medico.idMedico} value={medico.idMedico}>{medico.apellidos}, {medico.nombres}</option>)}
          </select>
          <select className="h-10 rounded-md border px-3" value={form.idEspecialidad} onChange={(e) => setForm((s) => ({ ...s, idEspecialidad: Number(e.target.value) }))}>
            <option value={0}>Especialidad</option>
            {especialidades.map((especialidad) => <option key={especialidad.idEspecialidad} value={especialidad.idEspecialidad}>{especialidad.nombre}</option>)}
          </select>
          <Input type="datetime-local" value={form.fechaHora} onChange={(e) => setForm((s) => ({ ...s, fechaHora: e.target.value }))} />
          <Input placeholder="Motivo" value={form.motivo ?? ''} onChange={(e) => setForm((s) => ({ ...s, motivo: e.target.value }))} className="xl:col-span-2" />
        </div>
        <textarea className="min-h-24 w-full rounded-md border px-3 py-2 text-sm" placeholder="Observaciones" value={form.observaciones ?? ''} onChange={(e) => setForm((s) => ({ ...s, observaciones: e.target.value }))} />
        <div className="flex justify-end">
          <Button disabled={createMutation.isPending || !form.idPaciente || !form.idMedico || !form.idEspecialidad || !form.fechaHora} onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? 'Guardando...' : 'Agendar cita'}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Agenda diaria</h2>
          <Input className="max-w-xs" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hora</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Medico</TableHead>
              <TableHead>Especialidad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {citas.map((cita) => (
              <TableRow key={cita.idCita}>
                <TableCell>{new Date(cita.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                <TableCell>{cita.paciente.apellidos}, {cita.paciente.nombres}</TableCell>
                <TableCell>{cita.medico.apellidos}, {cita.medico.nombres}</TableCell>
                <TableCell>{cita.especialidad.nombre}</TableCell>
                <TableCell>{cita.estado}</TableCell>
                <TableCell className="flex gap-2">
                  <Input
                    type="datetime-local"
                    className="w-56"
                    value={reprogramacion[cita.idCita] ?? ''}
                    onChange={(e) => setReprogramacion((prev) => ({ ...prev, [cita.idCita]: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reprogramarMutation.isPending || !reprogramacion[cita.idCita]}
                    onClick={() => reprogramarMutation.mutate({ idCita: cita.idCita, fechaHora: reprogramacion[cita.idCita] })}
                  >
                    Reprogramar
                  </Button>
                  <Button size="sm" variant="outline" disabled={estadoMutation.isPending} onClick={() => estadoMutation.mutate({ idCita: cita.idCita, estado: 'CONFIRMADA' })}>Confirmar</Button>
                  <Button size="sm" variant="outline" disabled={estadoMutation.isPending} onClick={() => estadoMutation.mutate({ idCita: cita.idCita, estado: 'CANCELADA' })}>Cancelar</Button>
                </TableCell>
              </TableRow>
            ))}
            {citas.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-500">No hay citas para la fecha seleccionada.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </main>
  )
}
