import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { crearGenerico, actualizarGenerico, eliminarGenerico, listarGenericos } from '@/api/operacionesApi'
import { Button } from '@/components/ui/button'
import { FieldError, OptionalLabel, RequiredLabel, fieldClass, isBlank } from '@/components/ui/form-feedback'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'
import { type Generico } from '@/types'

const base: Generico = { nombre: '', descripcion: '', estado: 1 }

export default function GenericosPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Generico>(base)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function setField<K extends keyof Generico>(key: K, value: Generico[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key as string]) return prev
      const next = { ...prev }
      delete next[key as string]
      return next
    })
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {}
    if (isBlank(form.nombre)) nextErrors.nombre = 'El nombre es obligatorio.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      notifyError('Completa los campos obligatorios del genérico.')
      return false
    }
    return true
  }

  const { data: genericos = [] } = useQuery({ queryKey: ['genericos'], queryFn: listarGenericos })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) return actualizarGenerico(editingId, form)
      return crearGenerico(form)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genericos'] })
      setForm(base)
      setEditingId(null)
      notifySuccess(editingId ? 'Generico modificado correctamente.' : 'Generico guardado correctamente.')
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo guardar el generico.')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => eliminarGenerico(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genericos'] })
      notifySuccess('Generico eliminado correctamente.')
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo eliminar el generico.')),
  })

  return (
    <main className="p-6 space-y-6">


      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1"><RequiredLabel>Nombre</RequiredLabel><Input className={fieldClass(Boolean(errors.nombre))} value={form.nombre} onChange={(e) => setField('nombre', e.target.value)} /><FieldError message={errors.nombre} /></div>
        <div className="space-y-1"><OptionalLabel>Descripcion</OptionalLabel><Input value={form.descripcion ?? ''} onChange={(e) => setField('descripcion', e.target.value)} /></div>
      </section>

      <section className="flex gap-2">
        <Button onClick={() => { if (validateForm()) saveMutation.mutate() }}>{editingId ? 'Actualizar' : 'Crear'} generico</Button>
        {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm(base) }}>Cancelar</Button>}
      </section>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Descripcion</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {genericos.map((g) => (
              <TableRow key={g.idGenerico}>
                <TableCell>{g.nombre}</TableCell>
                <TableCell>{g.descripcion ?? '-'}</TableCell>
                <TableCell className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditingId(g.idGenerico ?? null); setForm(g) }}>Editar</Button>
                  <Button size="sm" variant="outline" onClick={() => g.idGenerico && deleteMutation.mutate(g.idGenerico)}>Eliminar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}
