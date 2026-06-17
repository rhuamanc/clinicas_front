import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarPacientes, listarCitasDia, registrarAdmision, listarAdmisiones, type AdmisionPayload } from '@/api/clinicaApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'

function today() {
  return new Date().toISOString().slice(0, 10)
}

const emptyForm: AdmisionPayload = {
  idPaciente: 0,
  idCita: undefined,
  tipoIngreso: 'SIN_CITA',
  derivacion: 'TRIAJE',
}

export default function AdmisionPage() {
  const queryClient = useQueryClient()
  const [fecha, setFecha] = useState(today())
  const [form, setForm] = useState<AdmisionPayload>(emptyForm)

  const pacientesQuery = useQuery({ queryKey: ['clinica', 'pacientes'], queryFn: () => listarPacientes() })
  const citasQuery = useQuery({ queryKey: ['clinica', 'citas', fecha], queryFn: () => listarCitasDia(fecha) })
  const admisionesQuery = useQuery({ queryKey: ['clinica', 'admisiones'], queryFn: () => listarAdmisiones() })

  const createMutation = useMutation({
    mutationFn: () => registrarAdmision(form),
    onSuccess: () => {
      notifySuccess('Admision registrada')
      setForm(emptyForm)
      queryClient.invalidateQueries({ queryKey: ['clinica', 'admisiones'] })
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo registrar admision')),
  })

  const pacientes = pacientesQuery.data ?? []
  const citas = citasQuery.data ?? []
  const admisiones = admisionesQuery.data ?? []

  return (
    <main className="p-6 space-y-6">
      <section className="rounded-xl border bg-white p-5">
        <h1 className="text-2xl font-semibold text-slate-900">Admision</h1>
        <p className="text-sm text-slate-600 mt-1">Registro de llegada y derivacion del paciente.</p>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold">Registrar ingreso</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select className="h-10 rounded-md border px-3" value={form.idPaciente} onChange={(e) => setForm((s) => ({ ...s, idPaciente: Number(e.target.value) }))}>
            <option value={0}>Paciente</option>
            {pacientes.map((paciente) => <option key={paciente.idPaciente} value={paciente.idPaciente}>{paciente.apellidos}, {paciente.nombres}</option>)}
          </select>

          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />

          <select className="h-10 rounded-md border px-3" value={form.idCita ?? ''} onChange={(e) => setForm((s) => ({ ...s, idCita: e.target.value ? Number(e.target.value) : undefined, tipoIngreso: e.target.value ? 'CON_CITA' : 'SIN_CITA' }))}>
            <option value="">Sin cita</option>
            {citas.map((cita) => (
              <option key={cita.idCita} value={cita.idCita}>
                {new Date(cita.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {cita.paciente.apellidos}
              </option>
            ))}
          </select>

          <select className="h-10 rounded-md border px-3" value={form.derivacion ?? 'TRIAJE'} onChange={(e) => setForm((s) => ({ ...s, derivacion: e.target.value }))}>
            <option value="TRIAJE">Triaje</option>
            <option value="CONSULTA">Consulta</option>
            <option value="CAJA">Caja</option>
          </select>
        </div>

        <div className="flex justify-end">
          <Button disabled={createMutation.isPending || !form.idPaciente} onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? 'Guardando...' : 'Registrar admision'}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Derivacion</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admisiones.map((admision) => (
              <TableRow key={admision.idAdmision}>
                <TableCell>{new Date(admision.fechaLlegada).toLocaleString()}</TableCell>
                <TableCell>{admision.paciente.apellidos}, {admision.paciente.nombres}</TableCell>
                <TableCell>{admision.tipoIngreso}</TableCell>
                <TableCell>{admision.derivacion}</TableCell>
                <TableCell>{admision.estado}</TableCell>
              </TableRow>
            ))}
            {admisiones.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-slate-500">No hay admisiones registradas.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </main>
  )
}
