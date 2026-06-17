import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarAdmisiones, listarTriajes, registrarTriaje, type TriajePayload } from '@/api/clinicaApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'

const emptyForm: TriajePayload = {
  idAdmision: 0,
  pesoKg: undefined,
  tallaM: undefined,
  presionArterial: '',
  temperatura: undefined,
  frecuenciaCardiaca: undefined,
  saturacionOxigeno: undefined,
  motivoConsulta: '',
}

export default function TriajePage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<TriajePayload>(emptyForm)

  const admisionesQuery = useQuery({ queryKey: ['clinica', 'admisiones'], queryFn: () => listarAdmisiones() })
  const triajesQuery = useQuery({ queryKey: ['clinica', 'triajes'], queryFn: () => listarTriajes() })

  const createMutation = useMutation({
    mutationFn: () => registrarTriaje(form),
    onSuccess: () => {
      notifySuccess('Triaje registrado')
      setForm(emptyForm)
      queryClient.invalidateQueries({ queryKey: ['clinica', 'triajes'] })
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo registrar triaje')),
  })

  const admisiones = admisionesQuery.data ?? []
  const triajes = triajesQuery.data ?? []

  return (
    <main className="p-6 space-y-6">
      <section className="rounded-xl border bg-white p-5">
        <h1 className="text-2xl font-semibold text-slate-900">Triaje</h1>
        <p className="text-sm text-slate-600 mt-1">Registro de signos vitales y motivo de consulta.</p>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold">Nuevo triaje</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select className="h-10 rounded-md border px-3 xl:col-span-2" value={form.idAdmision} onChange={(e) => setForm((s) => ({ ...s, idAdmision: Number(e.target.value) }))}>
            <option value={0}>Admision</option>
            {admisiones.map((admision) => (
              <option key={admision.idAdmision} value={admision.idAdmision}>
                {admision.paciente.apellidos}, {admision.paciente.nombres} ({new Date(admision.fechaLlegada).toLocaleString()})
              </option>
            ))}
          </select>
          <Input type="number" step="0.01" placeholder="Peso (kg)" value={form.pesoKg ?? ''} onChange={(e) => setForm((s) => ({ ...s, pesoKg: e.target.value ? Number(e.target.value) : undefined }))} />
          <Input type="number" step="0.01" placeholder="Talla (m)" value={form.tallaM ?? ''} onChange={(e) => setForm((s) => ({ ...s, tallaM: e.target.value ? Number(e.target.value) : undefined }))} />
          <Input placeholder="Presion arterial" value={form.presionArterial ?? ''} onChange={(e) => setForm((s) => ({ ...s, presionArterial: e.target.value }))} />
          <Input type="number" step="0.01" placeholder="Temperatura" value={form.temperatura ?? ''} onChange={(e) => setForm((s) => ({ ...s, temperatura: e.target.value ? Number(e.target.value) : undefined }))} />
          <Input type="number" placeholder="Frecuencia cardiaca" value={form.frecuenciaCardiaca ?? ''} onChange={(e) => setForm((s) => ({ ...s, frecuenciaCardiaca: e.target.value ? Number(e.target.value) : undefined }))} />
          <Input type="number" placeholder="Saturacion O2" value={form.saturacionOxigeno ?? ''} onChange={(e) => setForm((s) => ({ ...s, saturacionOxigeno: e.target.value ? Number(e.target.value) : undefined }))} />
        </div>
        <textarea className="min-h-24 w-full rounded-md border px-3 py-2 text-sm" placeholder="Motivo de consulta" value={form.motivoConsulta ?? ''} onChange={(e) => setForm((s) => ({ ...s, motivoConsulta: e.target.value }))} />

        <div className="flex justify-end">
          <Button disabled={createMutation.isPending || !form.idAdmision} onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? 'Guardando...' : 'Registrar triaje'}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Peso/Talla</TableHead>
              <TableHead>PA</TableHead>
              <TableHead>Temp.</TableHead>
              <TableHead>IMC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {triajes.map((triaje) => (
              <TableRow key={triaje.idTriaje}>
                <TableCell>{new Date(triaje.fechaRegistro).toLocaleString()}</TableCell>
                <TableCell>{triaje.admision.paciente.apellidos}, {triaje.admision.paciente.nombres}</TableCell>
                <TableCell>{triaje.pesoKg ?? '-'} / {triaje.tallaM ?? '-'}</TableCell>
                <TableCell>{triaje.presionArterial ?? '-'}</TableCell>
                <TableCell>{triaje.temperatura ?? '-'}</TableCell>
                <TableCell>{triaje.imc ?? '-'}</TableCell>
              </TableRow>
            ))}
            {triajes.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-500">No hay triajes registrados.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </main>
  )
}
