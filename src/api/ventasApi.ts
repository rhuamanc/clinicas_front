import api from './axios'
import { type Producto, type VentaDTO } from '@/types'

export async function listarProductos(idZona: number): Promise<Producto[]> {
  const { data } = await api.get<Producto[]>('/productos', { params: { idZona } })
  return data
}

export async function crearVenta(payload: VentaDTO): Promise<VentaDTO> {
  const { data } = await api.post<VentaDTO>('/ventas', payload)
  return data
}

export async function listarVentasPorFecha(fecha: string, idZona: number): Promise<VentaDTO[]> {
  const { data } = await api.get<VentaDTO[]>(`/ventas/fecha/${fecha}`, { params: { idZona } })
  return data
}
