import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { crearEspecialidad, listarEspecialidades } from '@/api/clinicaApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'

export default function EspecialidadesPage() {
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const especialidadesQuery = useQuery({
    queryKey: ['clinica', 'especialidades'],
    queryFn: listarEspecialidades,
  })

  const createMutation = useMutation({
    mutationFn: () => crearEspecialidad({ nombre, descripcion }),
    onSuccess: () => {
      notifySuccess('Especialidad registrada')
      setNombre('')
      setDescripcion('')
      queryClient.invalidateQueries({ queryKey: ['clinica', 'especialidades'] })
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo registrar la especialidad')),
  })

  const especialidades = especialidadesQuery.data ?? []

  return (
    <main className="p-6 space-y-6">
      <section className="rounded-xl border bg-white p-5">
        <h1 className="text-2xl font-semibold text-slate-900">Especialidades</h1>
        <p className="text-sm text-slate-600 mt-1">Catalogo medico del policlinico.</p>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold">Nueva especialidad</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Input placeholder="Descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="md:col-span-2" />
        </div>
        <div className="flex justify-end">
          <Button disabled={createMutation.isPending || !nombre.trim()} onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? 'Guardando...' : 'Registrar especialidad'}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripcion</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {especialidades.map((especialidad) => (
              <TableRow key={especialidad.idEspecialidad}>
                <TableCell>{especialidad.nombre}</TableCell>
                <TableCell>{especialidad.descripcion ?? '-'}</TableCell>
                <TableCell>{especialidad.activa ? 'Activa' : 'Inactiva'}</TableCell>
              </TableRow>
            ))}
            {especialidades.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-slate-500">No hay especialidades registradas.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </main>
  )
}
