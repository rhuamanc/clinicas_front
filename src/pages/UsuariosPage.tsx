import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actualizarUsuario, crearUsuario, eliminarUsuario, listarUsuarios } from '@/api/catalogosApi'
import { listarRolesActivos } from '@/api/rolesApi'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { FieldError, OptionalLabel, RequiredLabel, fieldClass, isBlank } from '@/components/ui/form-feedback'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'
import { type UsuarioAdmin } from '@/types'

export default function UsuariosPage() {
  const queryClient = useQueryClient()
  const idZona = useAuthStore((s) => s.idZona) ?? 1
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<UsuarioAdmin>({ nombre: '', password: '', rol: 'VENDEDOR', idRol: undefined, idZona, nombreCliente: '', cuentaHabilitada: true })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: roles = [] } = useQuery({
    queryKey: ['rolesActivos'],
    queryFn: listarRolesActivos,
  })

  function setField<K extends keyof UsuarioAdmin>(key: K, value: UsuarioAdmin[K]) {
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
    if (isBlank(form.nombre)) nextErrors.nombre = 'El usuario es obligatorio.'
    if (!editingId && isBlank(form.password)) nextErrors.password = 'La contraseña es obligatoria.'
    if (isBlank(form.nombreCliente)) nextErrors.nombreCliente = 'El cliente es obligatorio.'
    if (!form.idRol) nextErrors.rol = 'El rol es obligatorio.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      notifyError('Completa los campos obligatorios del usuario.')
      return false
    }
    return true
  }

  const { data: usuarios = [] } = useQuery({ queryKey: ['usuarios', idZona], queryFn: () => listarUsuarios(idZona) })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) return actualizarUsuario(editingId, { ...form, idZona })
      return crearUsuario({ ...form, idZona })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios', idZona] })
      setEditingId(null)
      setForm({ nombre: '', password: '', rol: 'VENDEDOR', idRol: undefined, idZona, nombreCliente: '', cuentaHabilitada: true })
      notifySuccess(editingId ? 'Usuario modificado correctamente.' : 'Usuario guardado correctamente.')
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo guardar el usuario.')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => eliminarUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios', idZona] })
      notifySuccess('Usuario eliminado correctamente.')
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo eliminar el usuario.')),
  })

  return (
    <main className="p-6 space-y-6">


      <section className="rounded-md border bg-white p-4 grid gap-4 md:grid-cols-4">
        <div className="space-y-1"><RequiredLabel>Usuario</RequiredLabel><Input className={fieldClass(Boolean(errors.nombre))} value={form.nombre} onChange={(e) => setField('nombre', e.target.value)} /><FieldError message={errors.nombre} /></div>
        <div className="space-y-1"><RequiredLabel>Contraseña</RequiredLabel><Input className={fieldClass(Boolean(errors.password))} placeholder={editingId ? 'Nueva contraseña (opcional)' : ''} type="password" value={form.password ?? ''} onChange={(e) => setField('password', e.target.value)} /><FieldError message={errors.password} /></div>
        <div className="space-y-1"><RequiredLabel>Cliente</RequiredLabel><Input className={fieldClass(Boolean(errors.nombreCliente))} value={form.nombreCliente ?? ''} onChange={(e) => setField('nombreCliente', e.target.value)} /><FieldError message={errors.nombreCliente} /></div>
        <div className="space-y-1"><OptionalLabel>Zona / distrito</OptionalLabel><Input value={`Zona ${idZona}`} disabled /></div>
        <div className="space-y-1"><RequiredLabel>Rol</RequiredLabel><select className={fieldClass(Boolean(errors.rol)) + ' h-10 rounded-md bg-background px-3 w-full'} value={form.idRol || ''} onChange={(e) => { const rol = roles.find(r => r.idRol === Number(e.target.value)); setForm(p => ({ ...p, idRol: Number(e.target.value), rol: rol?.nombre || 'VENDEDOR' })); setErrors((prev) => { const next = { ...prev }; delete next.rol; return next }) }}><option value="">Seleccionar rol</option>{roles.map(r => <option key={r.idRol} value={r.idRol}>{r.nombre}</option>)}</select><FieldError message={errors.rol} /></div>
        <div className="space-y-1"><OptionalLabel>Foto</OptionalLabel><Input type="file" disabled title="Pendiente de carga de archivos" /></div>
        <div className="flex items-end gap-2"><input id="habilitar" type="checkbox" checked={form.cuentaHabilitada ?? true} onChange={(e) => setForm((p) => ({ ...p, cuentaHabilitada: e.target.checked }))} /><label htmlFor="habilitar" className="text-sm font-medium">Habilitar cuenta</label></div>
      </section>

      <section className="flex gap-2">
        <Button onClick={() => { if (validateForm()) saveMutation.mutate() }}>{editingId ? 'Actualizar' : 'Crear'} usuario</Button>
        {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm({ nombre: '', password: '', rol: 'VENDEDOR', idRol: undefined, idZona, nombreCliente: '', cuentaHabilitada: true }) }}>Cancelar</Button>}
      </section>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Habilitada</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.nombre}</TableCell>
                <TableCell>{u.nombreCliente ?? '-'}</TableCell>
                <TableCell>{u.cuentaHabilitada ? 'Sí' : 'No'}</TableCell>
                <TableCell>{u.rol}</TableCell>
                <TableCell>{u.estado === 1 ? 'Activo' : 'Inactivo'}</TableCell>
                <TableCell className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditingId(u.id ?? null); setForm({ ...u, password: '', idZona }) }}>Editar</Button>
                  <Button size="sm" variant="outline" onClick={() => u.id && deleteMutation.mutate(u.id)}>Eliminar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}
