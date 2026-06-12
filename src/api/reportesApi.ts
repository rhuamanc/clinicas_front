import api from './axios'
import {
  type ResumenDiario,
  type ReporteCargosDescargosData,
  type ReporteComprasProveedorData,
  type ReporteIncentivosData,
  type ReporteInventarioData,
  type ReporteProductoPorVencerItem,
  type ReporteVendedorItem,
  type ReporteVentasData,
} from '@/types'

export async function obtenerResumenDiario(idZona: number, fecha?: string): Promise<ResumenDiario> {
  const { data } = await api.get<ResumenDiario>('/reportes/resumen-diario', { params: { idZona, fecha } })
  return data
}

export async function obtenerReporteVentas(idZona: number, fechaInicio?: string, fechaFin?: string): Promise<ReporteVentasData> {
  const { data } = await api.get<ReporteVentasData>('/reportes/ventas', { params: { idZona, fechaInicio, fechaFin } })
  return data
}

export async function obtenerReporteVendedores(idZona: number, fechaInicio?: string, fechaFin?: string): Promise<ReporteVendedorItem[]> {
  const { data } = await api.get<ReporteVendedorItem[]>('/reportes/vendedores', { params: { idZona, fechaInicio, fechaFin } })
  return data
}

export async function obtenerReporteInventario(idZona: number): Promise<ReporteInventarioData> {
  const { data } = await api.get<ReporteInventarioData>('/reportes/inventario', { params: { idZona } })
  return data
}

export async function obtenerReporteProductosPorVencer(idZona: number, dias = 30, limite = 100): Promise<ReporteProductoPorVencerItem[]> {
  const { data } = await api.get<ReporteProductoPorVencerItem[]>('/reportes/productos-por-vencer', { params: { idZona, dias, limite } })
  return data
}

export async function obtenerReporteComprasPorProveedor(idZona: number, idProveedor?: number, fechaInicio?: string, fechaFin?: string): Promise<ReporteComprasProveedorData> {
  const params: Record<string, string | number> = { idZona }
  if (idProveedor && idProveedor > 0) params.idProveedor = idProveedor
  if (fechaInicio) params.fechaInicio = fechaInicio
  if (fechaFin) params.fechaFin = fechaFin
  const { data } = await api.get<ReporteComprasProveedorData>('/reportes/compras-por-proveedor', { params })
  return data
}

export async function obtenerReporteIncentivos(idZona: number, fechaInicio?: string, fechaFin?: string): Promise<ReporteIncentivosData> {
  const { data } = await api.get<ReporteIncentivosData>('/reportes/incentivos', { params: { idZona, fechaInicio, fechaFin } })
  return data
}

export async function obtenerReporteCargosDescargos(idZona: number, fechaInicio?: string, fechaFin?: string): Promise<ReporteCargosDescargosData> {
  const { data } = await api.get<ReporteCargosDescargosData>('/reportes/cargos-descargos', { params: { idZona, fechaInicio, fechaFin } })
  return data
}
