import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  crearCita,
  crearPaciente,
  dispensarReceta,
  listarEspecialidades,
  listarMedicos,
  listarPacientes,
  listarRecetasPendientes,
  obtenerResumenClinico,
} from '@/api/clinicaApi'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'

function hoyIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function ClinicaPage() {
  const queryClient = useQueryClient()
  const [qPaciente, setQPaciente] = useState('')
  const [formPaciente, setFormPaciente] = useState({ nombres: '', apellidos: '', dni: '', telefono: '' })
  const [formCita, setFormCita] = useState({ idPaciente: 0, idMedico: 0, idEspecialidad: 0, fechaHora: '', motivo: '' })

  const pacientesQuery = useQuery({
    queryKey: ['clinica', 'pacientes', qPaciente],
    queryFn: () => listarPacientes(qPaciente || undefined),
  })

  const medicosQuery = useQuery({
    queryKey: ['clinica', 'medicos'],
    queryFn: listarMedicos,
  })

  const especialidadesQuery = useQuery({
    queryKey: ['clinica', 'especialidades'],
    queryFn: listarEspecialidades,
  })

  const recetasPendientesQuery = useQuery({
    queryKey: ['clinica', 'recetas-pendientes'],
    queryFn: () => listarRecetasPendientes(),
    refetchInterval: 20000,
  })

  const resumenQuery = useQuery({
    queryKey: ['clinica', 'resumen', hoyIso()],
    queryFn: () => obtenerResumenClinico(hoyIso()),
  })

  const createPacienteMutation = useMutation({
    mutationFn: crearPaciente,
    onSuccess: () => {
      notifySuccess('Paciente registrado')
      setFormPaciente({ nombres: '', apellidos: '', dni: '', telefono: '' })
      queryClient.invalidateQueries({ queryKey: ['clinica', 'pacientes'] })
      queryClient.invalidateQueries({ queryKey: ['clinica', 'resumen'] })
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo registrar paciente')),
  })

  const createCitaMutation = useMutation({
    mutationFn: crearCita,
    onSuccess: () => {
      notifySuccess('Cita agendada')
      setFormCita({ idPaciente: 0, idMedico: 0, idEspecialidad: 0, fechaHora: '', motivo: '' })
      queryClient.invalidateQueries({ queryKey: ['clinica', 'resumen'] })
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo agendar la cita')),
  })

  const dispensarMutation = useMutation({
    mutationFn: dispensarReceta,
    onSuccess: () => {
      notifySuccess('Receta dispensada y enviada a venta')
      queryClient.invalidateQueries({ queryKey: ['clinica', 'recetas-pendientes'] })
      queryClient.invalidateQueries({ queryKey: ['clinica', 'resumen'] })
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo dispensar receta')),
  })

  const pacientes = pacientesQuery.data ?? []
  const medicos = medicosQuery.data ?? []
  const especialidades = especialidadesQuery.data ?? []
  const recetasPendientes = recetasPendientesQuery.data ?? []

  const resumen = useMemo(() => resumenQuery.data as Record<string, number | string> | undefined, [resumenQuery.data])

  return (
    <main className="p-6 space-y-6">
      <section className="rounded-xl border bg-white p-5">
        <h1 className="text-2xl font-semibold text-slate-900">Centro Clinico Integrado</h1>
        <p className="text-sm text-slate-600 mt-1">Pacientes, citas y recetas conectadas con farmacia y caja.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Stat title="Pacientes" value={String(resumen?.pacientes ?? 0)} />
        <Stat title="Medicos" value={String(resumen?.medicos ?? 0)} />
        <Stat title="Citas Hoy" value={String(resumen?.citas ?? 0)} />
        <Stat title="Recetas Pendientes" value={String(resumen?.recetasPendientes ?? 0)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 space-y-4">
          <h2 className="text-lg font-semibold">Registrar Paciente</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Nombres" value={formPaciente.nombres} onChange={(e) => setFormPaciente((s) => ({ ...s, nombres: e.target.value }))} />
            <Input placeholder="Apellidos" value={formPaciente.apellidos} onChange={(e) => setFormPaciente((s) => ({ ...s, apellidos: e.target.value }))} />
            <Input placeholder="DNI" value={formPaciente.dni} onChange={(e) => setFormPaciente((s) => ({ ...s, dni: e.target.value }))} />
            <Input placeholder="Telefono" value={formPaciente.telefono} onChange={(e) => setFormPaciente((s) => ({ ...s, telefono: e.target.value }))} />
          </div>
          <div className="flex justify-end">
            <Button
              disabled={createPacienteMutation.isPending || !formPaciente.nombres || !formPaciente.apellidos || !formPaciente.dni}
              onClick={() => createPacienteMutation.mutate(formPaciente)}
            >
              {createPacienteMutation.isPending ? 'Guardando...' : 'Guardar Paciente'}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 space-y-4">
          <h2 className="text-lg font-semibold">Agendar Cita</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <select className="h-10 rounded-md border px-3" value={formCita.idPaciente} onChange={(e) => setFormCita((s) => ({ ...s, idPaciente: Number(e.target.value) }))}>
              <option value={0}>Selecciona paciente</option>
              {pacientes.map((p) => <option key={p.idPaciente} value={p.idPaciente}>{p.apellidos}, {p.nombres}</option>)}
            </select>
            <select className="h-10 rounded-md border px-3" value={formCita.idMedico} onChange={(e) => setFormCita((s) => ({ ...s, idMedico: Number(e.target.value) }))}>
              <option value={0}>Selecciona medico</option>
              {medicos.map((m) => <option key={m.idMedico} value={m.idMedico}>{m.apellidos}, {m.nombres}</option>)}
            </select>
            <select className="h-10 rounded-md border px-3" value={formCita.idEspecialidad} onChange={(e) => setFormCita((s) => ({ ...s, idEspecialidad: Number(e.target.value) }))}>
              <option value={0}>Selecciona especialidad</option>
              {especialidades.map((e) => <option key={e.idEspecialidad} value={e.idEspecialidad}>{e.nombre}</option>)}
            </select>
            <Input type="datetime-local" value={formCita.fechaHora} onChange={(e) => setFormCita((s) => ({ ...s, fechaHora: e.target.value }))} />
            <Input className="md:col-span-2" placeholder="Motivo" value={formCita.motivo} onChange={(e) => setFormCita((s) => ({ ...s, motivo: e.target.value }))} />
          </div>
          <div className="flex justify-end">
            <Button
              disabled={createCitaMutation.isPending || !formCita.idPaciente || !formCita.idMedico || !formCita.idEspecialidad || !formCita.fechaHora}
              onClick={() => createCitaMutation.mutate(formCita)}
            >
              {createCitaMutation.isPending ? 'Agendando...' : 'Agendar Cita'}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recetas Pendientes para Farmacia</h2>
          <Input placeholder="Buscar paciente..." className="max-w-xs" value={qPaciente} onChange={(e) => setQPaciente(e.target.value)} />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Receta</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recetasPendientes.map((r) => (
              <TableRow key={r.idReceta}>
                <TableCell>{r.idReceta}</TableCell>
                <TableCell>{r.atencion?.admision?.paciente?.apellidos}, {r.atencion?.admision?.paciente?.nombres}</TableCell>
                <TableCell>{new Date(r.fechaReceta).toLocaleString()}</TableCell>
                <TableCell>{r.estado}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" disabled={dispensarMutation.isPending} onClick={() => dispensarMutation.mutate(r.idReceta)}>
                    Dispensar en Farmacia
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {recetasPendientes.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-slate-500">No hay recetas pendientes.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </main>
  )
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-xl border bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
    </article>
  )
}
