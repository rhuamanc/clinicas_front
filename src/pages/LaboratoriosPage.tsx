import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actualizarLaboratorio, crearLaboratorio, eliminarLaboratorio, listarLaboratorios } from '@/api/catalogosApi'
import { Button } from '@/components/ui/button'
import { FieldError, RequiredLabel, fieldClass, isBlank } from '@/components/ui/form-feedback'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'
import { type Laboratorio } from '@/types'

const base: Laboratorio = { nombreLaboratorio: '', abreviatura: '', ruc: '', direccion: '', estado: 1 }

export default function LaboratoriosPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Laboratorio>(base)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: laboratorios = [] } = useQuery({ queryKey: ['laboratorios'], queryFn: listarLaboratorios })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) return actualizarLaboratorio(editingId, form)
      return crearLaboratorio(form)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['laboratorios'] })
      setForm(base)
      setEditingId(null)
      notifySuccess(editingId ? 'Laboratorio modificado correctamente.' : 'Laboratorio guardado correctamente.')
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo guardar el laboratorio.')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => eliminarLaboratorio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['laboratorios'] })
      notifySuccess('Laboratorio eliminado correctamente.')
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo eliminar el laboratorio.')),
  })

  function validateForm() {
    const nextErrors: Record<string, string> = {}
    if (isBlank(form.nombreLaboratorio)) nextErrors.nombreLaboratorio = 'El laboratorio es obligatorio.'
    if (isBlank(form.abreviatura)) nextErrors.abreviatura = 'La abreviatura es obligatoria.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      notifyError('Completa los campos obligatorios del laboratorio.')
      return false
    }
    return true
  }

  return (
    <main className="p-6 space-y-6">
      <section>

      </section>

      <section className="rounded-md border bg-white p-4 grid gap-4 md:grid-cols-4">
        <div className="space-y-1"><RequiredLabel>Laboratorio</RequiredLabel><Input className={fieldClass(Boolean(errors.nombreLaboratorio))} value={form.nombreLaboratorio} onChange={(e) => { setForm((p) => ({ ...p, nombreLaboratorio: e.target.value })); setErrors((prev) => ({ ...prev, nombreLaboratorio: '' })) }} /><FieldError message={errors.nombreLaboratorio} /></div>
        <div className="space-y-1"><RequiredLabel>Abreviatura</RequiredLabel><Input className={fieldClass(Boolean(errors.abreviatura))} value={form.abreviatura ?? ''} onChange={(e) => { setForm((p) => ({ ...p, abreviatura: e.target.value })); setErrors((prev) => ({ ...prev, abreviatura: '' })) }} /><FieldError message={errors.abreviatura} /></div>
        <div className="space-y-1"><label className="text-sm font-medium">RUC</label><Input value={form.ruc ?? ''} onChange={(e) => setForm((p) => ({ ...p, ruc: e.target.value }))} /></div>
        <div className="space-y-1"><label className="text-sm font-medium">Dirección</label><Input value={form.direccion ?? ''} onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))} /></div>
      </section>

      <section className="flex gap-2">
        <Button onClick={() => { if (validateForm()) saveMutation.mutate() }}>{editingId ? 'Actualizar' : 'Crear'} laboratorio</Button>
        {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm(base) }}>Cancelar</Button>}
      </section>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Abrev.</TableHead>
              <TableHead>RUC</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {laboratorios.map((l) => (
              <TableRow key={l.idLaboratorio}>
                <TableCell>{l.nombreLaboratorio}</TableCell>
                <TableCell>{l.abreviatura ?? '-'}</TableCell>
                <TableCell>{l.ruc ?? '-'}</TableCell>
                <TableCell>{l.direccion ?? '-'}</TableCell>
                <TableCell className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditingId(l.idLaboratorio ?? null); setForm(l) }}>Editar</Button>
                  <Button size="sm" variant="outline" onClick={() => l.idLaboratorio && deleteMutation.mutate(l.idLaboratorio)}>Eliminar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}
