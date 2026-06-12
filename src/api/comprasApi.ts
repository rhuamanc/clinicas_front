import api from './axios'
import { type CompraDTO } from '@/types'

export async function crearCompra(payload: CompraDTO): Promise<CompraDTO> {
  const { data } = await api.post<CompraDTO>('/compras', payload)
  return data
}

export async function listarComprasPorFecha(fecha: string, idZona: number): Promise<CompraDTO[]> {
  const { data } = await api.get<CompraDTO[]>(`/compras/fecha/${fecha}`, { params: { idZona } })
  return data
}
