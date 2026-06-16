import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarRoles, crearRol, actualizarRol, desactivarRol } from '@/api/rolesApi'
import { Button } from '@/components/ui/button'
import { FieldError, RequiredLabel, fieldClass, isBlank } from '@/components/ui/form-feedback'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RESOURCE_GROUPS, RESOURCE_LABELS, ALL_RESOURCE_KEYS, normalizeResources } from '@/security/resourceCatalog'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'
import { type Rol } from '@/types'

export default function RolesPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [recursos, setRecursos] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: listarRoles,
    refetchOnWindowFocus: true,
  })

  const crearMutation = useMutation({
    mutationFn: (rol: Rol) => crearRol(rol),
    onSuccess: () => {
      handleCancel()
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      notifySuccess('Rol creado correctamente.')
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo crear el rol.')),
  })

  const actualizarMutation = useMutation({
    mutationFn: (rol: Rol) => actualizarRol(rol.idRol!, rol),
    onSuccess: () => {
      handleCancel()
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      notifySuccess('Rol actualizado correctamente.')
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo actualizar el rol.')),
  })

  const desactivarMutation = useMutation({
    mutationFn: desactivarRol,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      notifySuccess('Rol desactivado correctamente.')
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo desactivar el rol.')),
  })

  function handleEdit(rol: Rol) {
    setEditingId(rol.idRol!)
    setNombre(rol.nombre)
    setDescripcion(rol.descripcion || '')
    setRecursos(normalizeResources(rol.recursos))
    setShowForm(true)
    setErrors({})
  }

  function handleCancel() {
    setNombre('')
    setDescripcion('')
    setRecursos([])
    setEditingId(null)
    setShowForm(false)
    setErrors({})
  }

  function toggleRecurso(recurso: string) {
    setRecursos((current) => (
      current.includes(recurso)
        ? current.filter((item) => item !== recurso)
        : normalizeResources([...current, recurso])
    ))
  }

  function guardar() {
    const nextErrors: Record<string, string> = {}
    if (isBlank(nombre)) nextErrors.nombre = 'El nombre es obligatorio.'
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      notifyError('Completa los campos obligatorios.')
      return
    }

    const rol: Rol = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      recursos: normalizeResources(recursos),
    }

    if (editingId) {
      rol.idRol = editingId
      actualizarMutation.mutate(rol)
      return
    }

    crearMutation.mutate(rol)
  }

  const isPending = crearMutation.isPending || actualizarMutation.isPending || desactivarMutation.isPending

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mantenimiento de Roles</h1>
          <p className="text-sm text-slate-500">Define los recursos visibles y accesibles para cada rol.</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>+ Nuevo Rol</Button>
        )}
      </div>

      {showForm && (
        <section className="rounded-md border bg-white p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">{editingId ? 'Editar Rol' : 'Crear Rol'}</h2>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setRecursos(ALL_RESOURCE_KEYS)} disabled={isPending}>
                Marcar todo
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setRecursos([])} disabled={isPending}>
                Limpiar
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <RequiredLabel>Nombre del Rol</RequiredLabel>
              <Input
                className={fieldClass(Boolean(errors.nombre))}
                placeholder="Ej: GERENTE, ALMACENERO"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value)
                  setErrors((prev) => ({ ...prev, nombre: '' }))
                }}
              />
              <FieldError message={errors.nombre} />
            </div>

            <div className="space-y-1">
              <label className="text-sm">Descripcion</label>
              <Input
                placeholder="Descripcion del rol"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium">Recursos del rol</h3>
                <p className="text-xs text-slate-500">Los recursos controlan el menu lateral y las rutas habilitadas.</p>
              </div>
              <span className="text-xs text-slate-500">{recursos.length} seleccionados</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {Object.entries(RESOURCE_GROUPS).map(([section, items]) => (
                <div key={section} className="rounded-md border p-3 space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">{section}</h4>
                    <p className="text-xs text-slate-500">Selecciona los accesos disponibles para este grupo.</p>
                  </div>
                  <div className="space-y-2">
                    {items.map((resource) => {
                      const checked = recursos.includes(resource.key)
                      return (
                        <label key={resource.key} className="flex items-start gap-3 rounded border px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4"
                            checked={checked}
                            onChange={() => toggleRecurso(resource.key)}
                            disabled={isPending}
                          />
                          <span className="space-y-1">
                            <span className="block font-medium text-slate-800">{resource.label}</span>
                            <span className="block text-xs text-slate-500">{resource.description}</span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={guardar} disabled={isPending}>
              {isPending ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isPending}>
              Cancelar
            </Button>
          </div>
        </section>
      )}

      <section className="rounded-md border bg-white">
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground">Cargando roles...</div>
        ) : roles.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">No hay roles registrados</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripcion</TableHead>
                <TableHead>Recursos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((rol) => {
                const recursosRol = normalizeResources(rol.recursos)
                return (
                  <TableRow key={rol.idRol}>
                    <TableCell className="font-medium">{rol.nombre}</TableCell>
                    <TableCell>{rol.descripcion || '-'}</TableCell>
                    <TableCell>
                      {recursosRol.length > 0 ? (
                        <div className="space-y-1">
                          <div className="text-xs text-slate-500">{recursosRol.length} recurso(s)</div>
                          <div className="text-sm text-slate-700">{recursosRol.map((recurso) => RESOURCE_LABELS[recurso] || recurso).join(', ')}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Sin recursos</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rol.estado === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {rol.estado === 1 ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(rol)}
                        disabled={isPending}
                      >
                        Editar
                      </Button>
                      {rol.estado === 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (confirm(`Desactivar rol "${rol.nombre}"?`)) {
                              desactivarMutation.mutate(rol.idRol!)
                            }
                          }}
                          disabled={isPending}
                        >
                          Desactivar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </section>
    </main>
  )
}
