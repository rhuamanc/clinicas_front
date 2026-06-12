import api from './axios'
import { type Caja, type Cargo, type DigemidRow, type Generico, type Incentivo, type Pedido, type Salida } from '@/types'

export async function listarGenericos(): Promise<Generico[]> {
  const { data } = await api.get<Generico[]>('/genericos')
  return data
}

export async function crearGenerico(payload: Generico): Promise<Generico> {
  const { data } = await api.post<Generico>('/genericos', payload)
  return data
}

export async function actualizarGenerico(id: number, payload: Generico): Promise<Generico> {
  const { data } = await api.put<Generico>(`/genericos/${id}`, payload)
  return data
}

export async function eliminarGenerico(id: number): Promise<void> {
  await api.delete(`/genericos/${id}`)
}

export async function crearPedido(payload: Pedido): Promise<Pedido> {
  const { data } = await api.post<Pedido>('/pedidos', payload)
  return data
}

export async function confirmarPedido(id: number): Promise<Pedido> {
  const { data } = await api.put<Pedido>(`/pedidos/${id}/confirmar`, {})
  return data
}

export async function listarPedidosRango(idZona: number, fechaIni: string, fechaFin: string): Promise<Pedido[]> {
  const { data } = await api.get<Pedido[]>('/pedidos/rango', { params: { idZona, fechaIni, fechaFin } })
  return data
}

export async function crearSalida(payload: Salida): Promise<Salida> {
  const { data } = await api.post<Salida>('/salidas', payload)
  return data
}

export async function listarSalidasRango(idZona: number, fechaIni: string, fechaFin: string): Promise<Salida[]> {
  const { data } = await api.get<Salida[]>('/salidas/rango', { params: { idZona, fechaIni, fechaFin } })
  return data
}

export async function crearCargo(payload: Cargo): Promise<Cargo> {
  const { data } = await api.post<Cargo>('/cargos', payload)
  return data
}

export async function listarCargosRango(idZona: number, fechaIni: string, fechaFin: string): Promise<Cargo[]> {
  const { data } = await api.get<Cargo[]>('/cargos/rango', { params: { idZona, fechaIni, fechaFin } })
  return data
}

export async function listarIncentivos(idZona: number): Promise<Incentivo[]> {
  const { data } = await api.get<Incentivo[]>('/incentivos', { params: { idZona } })
  return data
}

export async function crearIncentivo(payload: Incentivo): Promise<Incentivo> {
  const { data } = await api.post<Incentivo>('/incentivos', payload)
  return data
}

export async function eliminarIncentivo(id: number): Promise<void> {
  await api.delete(`/incentivos/${id}`)
}

export async function listarCajas(idZona: number): Promise<Caja[]> {
  const { data } = await api.get<Caja[]>('/caja', { params: { idZona } })
  return data
}

export async function abrirCaja(payload: Caja): Promise<Caja> {
  const { data } = await api.post<Caja>('/caja/apertura', payload)
  return data
}

export async function cerrarCaja(id: number, payload: Caja): Promise<Caja> {
  const { data } = await api.put<Caja>(`/caja/${id}/cierre`, payload)
  return data
}

export async function buscarDigemid(q: string, idZona: number): Promise<DigemidRow[]> {
  const { data } = await api.get<DigemidRow[]>('/digemid/buscar', { params: { q, idZona } })
  return data
}

export async function sincronizarDigemid(idZona: number): Promise<{ mensaje: string }> {
  const { data } = await api.post<{ mensaje: string }>('/digemid/sincronizar', null, { params: { idZona } })
  return data
}

export async function actualizarCodigoDigemid(idProducto: number, idZona: number, codigoDigemid: string): Promise<{ mensaje: string }> {
  const { data } = await api.put<{ mensaje: string }>(`/digemid/${idProducto}/codigo`, { codigoDigemid }, { params: { idZona } })
  return data
}
