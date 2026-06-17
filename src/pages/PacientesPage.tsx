import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actualizarPaciente, crearPaciente, listarPacientes, type Paciente, type PacientePayload } from '@/api/clinicaApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'

const emptyForm: PacientePayload = {
  nombres: '',
  apellidos: '',
  dni: '',
  telefono: '',
  direccion: '',
  fechaNacimiento: '',
  sexo: '',
  alergias: '',
  antecedentes: '',
  contactoEmergenciaNombre: '',
  contactoEmergenciaTelefono: '',
}

export default function PacientesPage() {
  const queryClient = useQueryClient()
  const [busqueda, setBusqueda] = useState('')
  const [editing, setEditing] = useState<Paciente | null>(null)
  const [form, setForm] = useState<PacientePayload>(emptyForm)

  const pacientesQuery = useQuery({
    queryKey: ['clinica', 'pacientes', busqueda],
    queryFn: () => listarPacientes(busqueda || undefined),
  })

  const saveMutation = useMutation({
    mutationFn: () => editing ? actualizarPaciente(editing.idPaciente, form) : crearPaciente(form),
    onSuccess: () => {
      notifySuccess(editing ? 'Paciente actualizado' : 'Paciente registrado')
      setEditing(null)
      setForm(emptyForm)
      queryClient.invalidateQueries({ queryKey: ['clinica', 'pacientes'] })
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo guardar el paciente')),
  })

  const pacientes = useMemo(() => pacientesQuery.data ?? [], [pacientesQuery.data])

  function setField<K extends keyof PacientePayload>(key: K, value: PacientePayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function editarPaciente(paciente: Paciente) {
    setEditing(paciente)
    setForm({
      nombres: paciente.nombres,
      apellidos: paciente.apellidos,
      dni: paciente.dni,
      telefono: paciente.telefono ?? '',
      direccion: paciente.direccion ?? '',
      fechaNacimiento: paciente.fechaNacimiento ?? '',
      sexo: paciente.sexo ?? '',
      alergias: paciente.alergias ?? '',
      antecedentes: paciente.antecedentes ?? '',
      contactoEmergenciaNombre: paciente.contactoEmergenciaNombre ?? '',
      contactoEmergenciaTelefono: paciente.contactoEmergenciaTelefono ?? '',
    })
  }

  return (
    <main className="p-6 space-y-6">
      <section className="rounded-xl border bg-white p-5">
        <h1 className="text-2xl font-semibold text-slate-900">Pacientes</h1>
        <p className="text-sm text-slate-600 mt-1">Registro, busqueda y actualizacion de datos del paciente.</p>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Formulario</h2>
          {editing && (
            <Button variant="outline" onClick={() => { setEditing(null); setForm(emptyForm) }}>
              Cancelar edicion
            </Button>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input placeholder="Nombres" value={form.nombres} onChange={(e) => setField('nombres', e.target.value)} />
          <Input placeholder="Apellidos" value={form.apellidos} onChange={(e) => setField('apellidos', e.target.value)} />
          <Input placeholder="DNI" value={form.dni} onChange={(e) => setField('dni', e.target.value)} disabled={Boolean(editing)} />
          <Input placeholder="Telefono" value={form.telefono ?? ''} onChange={(e) => setField('telefono', e.target.value)} />
          <Input placeholder="Direccion" value={form.direccion ?? ''} onChange={(e) => setField('direccion', e.target.value)} className="xl:col-span-2" />
          <Input type="date" value={form.fechaNacimiento ?? ''} onChange={(e) => setField('fechaNacimiento', e.target.value)} />
          <select className="h-10 rounded-md border px-3" value={form.sexo ?? ''} onChange={(e) => setField('sexo', e.target.value)}>
            <option value="">Sexo</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <textarea className="min-h-24 rounded-md border px-3 py-2 text-sm" placeholder="Alergias" value={form.alergias ?? ''} onChange={(e) => setField('alergias', e.target.value)} />
          <textarea className="min-h-24 rounded-md border px-3 py-2 text-sm" placeholder="Antecedentes" value={form.antecedentes ?? ''} onChange={(e) => setField('antecedentes', e.target.value)} />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input placeholder="Contacto de emergencia" value={form.contactoEmergenciaNombre ?? ''} onChange={(e) => setField('contactoEmergenciaNombre', e.target.value)} className="xl:col-span-2" />
          <Input placeholder="Telefono de emergencia" value={form.contactoEmergenciaTelefono ?? ''} onChange={(e) => setField('contactoEmergenciaTelefono', e.target.value)} />
          <div className="flex justify-end xl:justify-start">
            <Button disabled={saveMutation.isPending || !form.nombres || !form.apellidos || !form.dni} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? 'Guardando...' : editing ? 'Actualizar paciente' : 'Registrar paciente'}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Listado</h2>
          <Input className="max-w-sm" placeholder="Buscar por nombre o apellido" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Telefono</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead>Emergencia</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pacientes.map((paciente) => (
              <TableRow key={paciente.idPaciente}>
                <TableCell>{paciente.apellidos}, {paciente.nombres}</TableCell>
                <TableCell>{paciente.dni}</TableCell>
                <TableCell>{paciente.telefono ?? '-'}</TableCell>
                <TableCell>{paciente.sexo ?? '-'}</TableCell>
                <TableCell>{paciente.contactoEmergenciaNombre ?? '-'}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => editarPaciente(paciente)}>
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {pacientes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-500">No hay pacientes registrados.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </main>
  )
}
