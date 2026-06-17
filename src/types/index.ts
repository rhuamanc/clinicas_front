// â”€â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface LoginRequest {
  nombre: string
  password: string
  idZona: number
}

export interface LoginResponse {
  token: string
  nombre: string
  rol: string
  idZona: number
  recursos: string[]
}

export interface AuthState {
  token: string | null
  nombre: string | null
  rol: string | null
  idZona: number | null
  recursos: string[]
  isAuthenticated: boolean
}

// â”€â”€â”€ Rol â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface Rol {
  idRol?: number
  nombre: string
  descripcion?: string
  estado?: number
  recursos?: string[]
}

// â”€â”€â”€ Producto â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface Producto {
  idProducto: number
  nombreProducto: string
  nroFraccion?: number
  unidades?: number
  fraccion?: number
  lote?: string
  precio: number
  precioCompra?: number
  porcentajeGanancia?: number
  precioVentaCaja?: number
  stock: number
  stockMinimo: number
  unidad: string
  presentacion: string
  nroBlister?: string
  precioBlister?: number
  ubicacion?: string
  codigoBarras?: string
  codigoDigemid?: string
  fechaAdquisicion?: string
  fechaVencimiento?: string
  descripcion?: string
  estado?: number
  idLaboratorio?: number
  idZona?: number
  nombreLaboratorio?: string
}

export interface Laboratorio {
  idLaboratorio?: number
  nombreLaboratorio: string
  abreviatura?: string
  ruc?: string
  direccion?: string
  estado?: number
}

export interface Proveedor {
  idProveedor?: number
  nombreProveedor: string
  ruc?: string
  direccion?: string
  telefono?: string
  estado?: number
}

export interface DetalleCompraDTO {
  idProducto: number
  nombreProducto?: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface CompraDTO {
  idCompra?: number
  fechaTransaccion?: string
  tipoComprobante?: string
  nroComprobante?: string
  nroGuia?: string
  tipoPago?: string
  montoCompra: number
  estado?: number
  idProveedor: number
  nombreProveedor?: string
  detalleCompras: DetalleCompraDTO[]
}

export interface ResumenDiario {
  fecha: string
  cantidadVentas: number
  montoTotal: number
  productosBajoStock: number
  ventas?: ResumenDiarioVenta[]
}

export interface ResumenDiarioDetalleVenta {
  idProducto?: number
  nombreProducto?: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface ResumenDiarioVenta {
  correlativoVenta: number
  idVenta: number
  fecha: string
  usuario?: string
  tipoPago?: number
  montoVenta: number
  estado?: number
  detalles: ResumenDiarioDetalleVenta[]
}

export interface ReporteVentasItem {
  idVenta: number
  fecha: string
  usuario: string
  tipoPago: number
  montoVenta: number
  estado: number
  cantidadItems?: number
  unidadesVendidas?: number
  utilidad?: number
}

export interface ReporteVentasData {
  items: ReporteVentasItem[]
  totalVentas: number
  montoTotal: number
  montoEfectivo: number
  montoTarjeta: number
  utilidadTotal: number
}

export interface ReporteVendedorItem {
  idUsuario: number
  usuario: string
  cantidadVentas: number
  montoTotal: number
  utilidadTotal: number
}

export interface ReporteInventarioItem {
  idProducto: number
  nombreProducto: string
  laboratorio?: string
  unidades?: number
  fraccion?: number
  stock: number
  precioCompra: number
  precioVenta: number
  capital: number
  venta: number
  ubicacion?: string
  fechaVencimiento?: string
  stockMinimo?: number
}

export interface ReporteInventarioData {
  items: ReporteInventarioItem[]
  totalCapital: number
  totalVenta: number
  totalUtilidad: number
}

export interface ReporteProductoPorVencerItem {
  idProducto: number
  nombreProducto: string
  stock?: number
  fraccion?: number
  fechaVencimiento?: string
  diasRestantes: number
}

export interface ReporteCompraProveedorItem {
  idCompra: number
  fecha: string
  proveedor: string
  tipoComprobante?: string
  nroComprobante?: string
  nroGuia?: string
  tipoPago?: string
  monto: number
}

export interface ReporteComprasProveedorData {
  items: ReporteCompraProveedorItem[]
  cantidadCompras: number
  montoTotal: number
}

export interface ReporteIncentivoItem {
  idIncentivo: number
  fecha: string
  usuario: string
  monto: number
  descripcion?: string
}

export interface ReporteIncentivosData {
  items: ReporteIncentivoItem[]
  montoTotal: number
}

export interface ReporteCargoItem {
  idReferencia: number
  fecha: string
  usuario: string
  producto: string
  cantidad: number
  nroFraccion?: number
  cajas?: number
  fracciones?: number
  stockAntes?: number | null
  stockDespues?: number | null
  stockAntesCajas?: number | null
  stockAntesFracciones?: number | null
  stockDespuesCajas?: number | null
  stockDespuesFracciones?: number | null
  motivo?: string
}

export interface ReporteDescargoItem {
  idReferencia: number
  fecha: string
  usuario: string
  producto: string
  cantidad: number
  nroFraccion?: number
  cajas?: number
  fracciones?: number
  stockAntes?: number | null
  stockDespues?: number | null
  stockAntesCajas?: number | null
  stockAntesFracciones?: number | null
  stockDespuesCajas?: number | null
  stockDespuesFracciones?: number | null
  tipoDescargo: 'MOD_STOCK' | 'VENTA'
  motivo?: string
}

export interface ReporteCargosDescargosData {
  cargos: ReporteCargoItem[]
  descargos: ReporteDescargoItem[]
  totalCargos: number
  totalDescargosModStock: number
  totalDescargosVenta: number
  totalUnidadesDescargadas: number
}

export interface UsuarioAdmin {
  id?: number
  nombre: string
  password?: string
  rol: string
  idRol?: number
  estado?: number
  idZona: number
  idCliente?: number
  nombreCliente?: string
  cuentaHabilitada?: boolean
}

export interface Generico {
  idGenerico?: number
  nombre: string
  descripcion?: string
  estado?: number
}

export interface ItemCantidad {
  idProducto: number
  nombreProducto?: string
  cantidad: number
}

export interface Pedido {
  idPedido?: number
  fechaRegistro?: string
  estadoPedido?: string
  observacion?: string
  items: ItemCantidad[]
}

export interface Salida {
  idSalida?: number
  fechaSalida?: string
  motivo: string
  estado?: number
  items: ItemCantidad[]
}

export interface Cargo {
  idCargo?: number
  fecha?: string
  tipo: string
  monto: number
  descripcion?: string
}

export interface Incentivo {
  idIncentivo?: number
  fecha?: string
  monto: number
  descripcion?: string
  idProducto: number
  nombreProducto?: string
  estado?: number
}

export interface Caja {
  idCaja?: number
  fechaApertura?: string
  fechaCierre?: string
  montoInicial: number
  montoFinal?: number
  estado?: string
}

export interface DigemidRow {
  idProducto: number
  nombreProducto: string
  presentacion?: string
  laboratorio?: string
  codigoDigemid?: string
}

// â”€â”€â”€ Venta â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface DetalleVentaDTO {
  idProducto: number
  nombreProducto: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface VentaDTO {
  idVenta?: number
  fechaTransaccion?: string
  montoVenta: number
  tipoPago: number
  montoCobrado?: number
  vuelto?: number
  documentoTipo?: 'NINGUNO' | 'BOLETA' | 'FACTURA' | 'TICKET'
  documentoNumero?: string
  documentoNombre?: string
  estado?: number
  detalleVentas: DetalleVentaDTO[]
}

