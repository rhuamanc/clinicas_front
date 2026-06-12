import api from './axios'
import { type Laboratorio, type Producto, type Proveedor, type UsuarioAdmin } from '@/types'

export async function listarLaboratorios(): Promise<Laboratorio[]> {
  const { data } = await api.get<Laboratorio[]>('/laboratorios')
  return data.filter((l) => (l.estado ?? 1) === 1)
}

export async function crearLaboratorio(payload: Laboratorio): Promise<Laboratorio> {
  const { data } = await api.post<Laboratorio>('/laboratorios', payload)
  return data
}

export async function actualizarLaboratorio(id: number, payload: Laboratorio): Promise<Laboratorio> {
  const { data } = await api.put<Laboratorio>(`/laboratorios/${id}`, payload)
  return data
}

export async function eliminarLaboratorio(id: number): Promise<void> {
  await api.delete(`/laboratorios/${id}`)
}

export async function crearProducto(payload: Producto): Promise<Producto> {
  const { data } = await api.post<Producto>('/productos', payload)
  return data
}

export async function actualizarProducto(id: number, idZona: number, payload: Producto): Promise<Producto> {
  const { data } = await api.put<Producto>(`/productos/${id}`, payload, { params: { idZona } })
  return data
}

export async function eliminarProducto(id: number, idZona: number): Promise<void> {
  await api.delete(`/productos/${id}`, { params: { idZona } })
}

export async function listarProveedores(): Promise<Proveedor[]> {
  const { data } = await api.get<Proveedor[]>('/proveedores')
  return data
}

export async function crearProveedor(payload: Proveedor): Promise<Proveedor> {
  const { data } = await api.post<Proveedor>('/proveedores', payload)
  return data
}

export async function actualizarProveedor(id: number, payload: Proveedor): Promise<Proveedor> {
  const { data } = await api.put<Proveedor>(`/proveedores/${id}`, payload)
  return data
}

export async function eliminarProveedor(id: number): Promise<void> {
  await api.delete(`/proveedores/${id}`)
}

export async function listarUsuarios(idZona: number): Promise<UsuarioAdmin[]> {
  const { data } = await api.get<UsuarioAdmin[]>('/usuarios', { params: { idZona } })
  return data
}

export async function crearUsuario(payload: UsuarioAdmin): Promise<UsuarioAdmin> {
  const { data } = await api.post<UsuarioAdmin>('/usuarios', payload)
  return data
}

export async function actualizarUsuario(id: number, payload: UsuarioAdmin): Promise<UsuarioAdmin> {
  const { data } = await api.put<UsuarioAdmin>(`/usuarios/${id}`, payload)
  return data
}

export async function eliminarUsuario(id: number): Promise<void> {
  await api.delete(`/usuarios/${id}`)
}
