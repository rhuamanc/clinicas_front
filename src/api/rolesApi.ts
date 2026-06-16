import axios from './axios'

export interface Rol {
  idRol?: number
  nombre: string
  descripcion?: string
  estado?: number
  recursos?: string[]
}

export async function listarRoles(): Promise<Rol[]> {
  const { data } = await axios.get('/roles')
  return data
}

export async function listarRolesActivos(): Promise<Rol[]> {
  const { data } = await axios.get('/roles/activos')
  return data
}

export async function obtenerRol(id: number): Promise<Rol> {
  const { data } = await axios.get(`/roles/${id}`)
  return data
}

export async function crearRol(rol: Rol): Promise<Rol> {
  const { data } = await axios.post('/roles', rol)
  return data
}

export async function actualizarRol(id: number, rol: Rol): Promise<Rol> {
  const { data } = await axios.put(`/roles/${id}`, rol)
  return data
}

export async function desactivarRol(id: number): Promise<void> {
  await axios.delete(`/roles/${id}`)
}
