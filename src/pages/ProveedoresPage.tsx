import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actualizarProveedor, crearProveedor, eliminarProveedor, listarProveedores } from '@/api/catalogosApi'
import { Button } from '@/components/ui/button'
import { FieldError, OptionalLabel, RequiredLabel, fieldClass, isBlank } from '@/components/ui/form-feedback'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'
import { type Proveedor } from '@/types'

const base: Proveedor = { nombreProveedor: '', ruc: '', direccion: '', telefono: '', estado: 1 }

export default function ProveedoresPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Proveedor>(base)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: proveedores = [] } = useQuery({ queryKey: ['proveedores'], queryFn: listarProveedores })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) return actualizarProveedor(editingId, form)
      return crearProveedor(form)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] })
      setForm(base)
      setEditingId(null)
      notifySuccess(editingId ? 'Proveedor modificado correctamente.' : 'Proveedor guardado correctamente.')
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo guardar el proveedor.')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => eliminarProveedor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] })
      notifySuccess('Proveedor eliminado correctamente.')
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo eliminar el proveedor.')),
  })

  function validateForm() {
    const nextErrors: Record<string, string> = {}
    if (isBlank(form.nombreProveedor)) nextErrors.nombreProveedor = 'El nombre del proveedor es obligatorio.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      notifyError('Completa los campos obligatorios del proveedor.')
      return false
    }
    return true
  }

  return (
    <main className="p-6 space-y-6">
      {/* Encabezado */}
      <section>
        <h1 className="text-3xl font-bold text-gray-900">Mantenimiento de Proveedores</h1>
        <p className="text-sm text-gray-600 mt-1">Gestiona la información de todos los proveedores de la farmacia</p>
      </section>

      {/* Formulario */}
      <section className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">{editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <RequiredLabel>Nombre</RequiredLabel>
            <Input 
              className={fieldClass(Boolean(errors.nombreProveedor))} 
              placeholder="Nombre del proveedor"
              value={form.nombreProveedor} 
              onChange={(e) => { setForm((p) => ({ ...p, nombreProveedor: e.target.value })); setErrors((prev) => ({ ...prev, nombreProveedor: '' })) }} 
            />
            <FieldError message={errors.nombreProveedor} />
          </div>
          <div className="space-y-1">
            <OptionalLabel>RUC</OptionalLabel>
            <Input 
              placeholder="RUC del proveedor"
              value={form.ruc ?? ''} 
              onChange={(e) => setForm((p) => ({ ...p, ruc: e.target.value }))} 
            />
          </div>
          <div className="space-y-1">
            <OptionalLabel>Dirección</OptionalLabel>
            <Input 
              placeholder="Dirección"
              value={form.direccion ?? ''} 
              onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))} 
            />
          </div>
          <div className="space-y-1">
            <OptionalLabel>Teléfono</OptionalLabel>
            <Input 
              placeholder="Teléfono"
              value={form.telefono ?? ''} 
              onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))} 
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={() => { if (validateForm()) saveMutation.mutate() }} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'} Proveedor
          </Button>
          {editingId && (
            <Button variant="outline" onClick={() => { setEditingId(null); setForm(base) }} disabled={saveMutation.isPending}>
              Cancelar
            </Button>
          )}
        </div>
      </section>

      {/* Tabla de Proveedores */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Listado de Proveedores</h2>
        {proveedores.length === 0 ? (
          <div className="rounded-md border bg-gray-50 p-8 text-center">
            <p className="text-gray-500">No hay proveedores registrados</p>
          </div>
        ) : (
          <div className="rounded-md border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b">
                  <TableHead className="font-semibold">Nombre</TableHead>
                  <TableHead className="font-semibold">RUC</TableHead>
                  <TableHead className="font-semibold">Dirección</TableHead>
                  <TableHead className="font-semibold">Teléfono</TableHead>
                  <TableHead className="font-semibold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proveedores.map((p) => (
                  <TableRow key={p.idProveedor} className="border-b hover:bg-gray-50">
                    <TableCell className="font-medium">{p.nombreProveedor}</TableCell>
                    <TableCell>{p.ruc ?? '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{p.direccion ?? '-'}</TableCell>
                    <TableCell>{p.telefono ?? '-'}</TableCell>
                    <TableCell className="flex gap-2 justify-end">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => { setEditingId(p.idProveedor ?? null); setForm(p) }}
                        disabled={deleteMutation.isPending}
                      >
                        Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => p.idProveedor && deleteMutation.mutate(p.idProveedor)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </main>
  )
}
