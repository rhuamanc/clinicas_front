import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import {
  obtenerReporteCargosDescargos,
  obtenerReporteComprasPorProveedor,
  obtenerReporteIncentivos,
  obtenerReporteInventario,
  obtenerReporteProductosPorVencer,
  obtenerReporteVendedores,
  obtenerReporteVentas,
  obtenerResumenDiario,
} from '@/api/reportesApi'
import { listarProveedores } from '@/api/catalogosApi'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type TipoReporte =
  | 'resumen'
  | 'ventas'
  | 'vendedores'
  | 'inventario'
  | 'porVencer'
  | 'comprasProveedor'
  | 'incentivos'
  | 'cargosDescargos'

function money(value: number | undefined) {
  return `S/ ${(value ?? 0).toFixed(2)}`
}

function formatUF(unidades?: number | null, fracciones?: number | null) {
  if (unidades == null || fracciones == null) return '-'
  return `${unidades}f${fracciones}`
}

function toExportValue(value: unknown) {
  if (value == null) return ''
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'SI' : 'NO'
  if (typeof value === 'string') return value
  return String(value)
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return ''
  const headers = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key))
    return set
  }, new Set<string>()))

  const escapeCell = (raw: unknown) => `"${toExportValue(raw).replace(/"/g, '""')}"`
  const lines = [headers.map((h) => escapeCell(h)).join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h])).join(','))
  }
  return lines.join('\n')
}

function downloadCsv(fileName: string, rows: Array<Record<string, unknown>>) {
  const csv = toCsv(rows)
  if (!csv) return
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function ReportesPage() {
  const idZona = useAuthStore((s) => s.idZona) ?? 1
  const hoy = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const inicioMes = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().slice(0, 10)
  }, [])
  const [tipoReporte, setTipoReporte] = useState<TipoReporte>('resumen')
  const [fecha, setFecha] = useState<string>(hoy)
  const [fechaInicio, setFechaInicio] = useState<string>(inicioMes)
  const [fechaFin, setFechaFin] = useState<string>(hoy)
  const [idProveedor, setIdProveedor] = useState<number>(0)
  const [diasVencer, setDiasVencer] = useState<number>(30)
  const [limiteVencer, setLimiteVencer] = useState<number>(100)

  const { data: proveedores = [] } = useQuery({ queryKey: ['proveedores'], queryFn: listarProveedores })

  const resumenQuery = useQuery({
    queryKey: ['reporteResumen', idZona, fecha],
    queryFn: () => obtenerResumenDiario(idZona, fecha),
    enabled: tipoReporte === 'resumen',
  })

  const ventasQuery = useQuery({
    queryKey: ['reporteVentas', idZona, fechaInicio, fechaFin],
    queryFn: () => obtenerReporteVentas(idZona, fechaInicio, fechaFin),
    enabled: tipoReporte === 'ventas',
  })

  const vendedoresQuery = useQuery({
    queryKey: ['reporteVendedores', idZona, fechaInicio, fechaFin],
    queryFn: () => obtenerReporteVendedores(idZona, fechaInicio, fechaFin),
    enabled: tipoReporte === 'vendedores',
  })

  const inventarioQuery = useQuery({
    queryKey: ['reporteInventario', idZona],
    queryFn: () => obtenerReporteInventario(idZona),
    enabled: tipoReporte === 'inventario',
  })

  const porVencerQuery = useQuery({
    queryKey: ['reportePorVencer', idZona, diasVencer, limiteVencer],
    queryFn: () => obtenerReporteProductosPorVencer(idZona, diasVencer, limiteVencer),
    enabled: tipoReporte === 'porVencer',
  })

  const comprasProveedorQuery = useQuery({
    queryKey: ['reporteComprasProveedor', idZona, idProveedor, fechaInicio, fechaFin],
    queryFn: () => obtenerReporteComprasPorProveedor(idZona, idProveedor || undefined, fechaInicio, fechaFin),
    enabled: tipoReporte === 'comprasProveedor',
  })

  const incentivosQuery = useQuery({
    queryKey: ['reporteIncentivos', idZona, fechaInicio, fechaFin],
    queryFn: () => obtenerReporteIncentivos(idZona, fechaInicio, fechaFin),
    enabled: tipoReporte === 'incentivos',
  })

  const cargosDescargosQuery = useQuery({
    queryKey: ['reporteCargosDescargos', idZona, fechaInicio, fechaFin],
    queryFn: () => obtenerReporteCargosDescargos(idZona, fechaInicio, fechaFin),
    enabled: tipoReporte === 'cargosDescargos',
  })

  const exportRows = useMemo<Array<Record<string, unknown>>>(() => {
    if (tipoReporte === 'resumen' && resumenQuery.data) {
      return [{
        fecha: resumenQuery.data.fecha,
        cantidadVentas: resumenQuery.data.cantidadVentas,
        montoTotal: resumenQuery.data.montoTotal,
        productosBajoStock: resumenQuery.data.productosBajoStock,
      }]
    }

    if (tipoReporte === 'ventas') {
      return (ventasQuery.data?.items ?? []).map((v) => ({
        correlativo: v.idVenta,
        fecha: v.fecha,
        vendedor: v.usuario,
        tipoPago: v.tipoPago === 1 ? 'Efectivo' : 'Tarjeta/Otro',
        items: v.cantidadItems ?? 0,
        unidadesVendidas: v.unidadesVendidas ?? 0,
        monto: v.montoVenta,
        utilidad: v.utilidad ?? 0,
        estado: v.estado === 1 ? 'Activo' : 'Anulado',
      }))
    }

    if (tipoReporte === 'vendedores') {
      return (vendedoresQuery.data ?? []).map((v) => ({
        vendedor: v.usuario,
        cantidadVentas: v.cantidadVentas,
        montoTotal: v.montoTotal,
        utilidadTotal: v.utilidadTotal,
      }))
    }

    if (tipoReporte === 'inventario') {
      return (inventarioQuery.data?.items ?? []).map((p) => ({
        producto: p.nombreProducto,
        laboratorio: p.laboratorio ?? '-',
        stock: p.stock,
        precioCompra: p.precioCompra,
        precioVenta: p.precioVenta,
        ubicacion: p.ubicacion ?? '-',
        fechaVencimiento: p.fechaVencimiento ?? '-',
      }))
    }

    if (tipoReporte === 'porVencer') {
      return (porVencerQuery.data ?? []).map((p) => ({
        producto: p.nombreProducto,
        stock: p.stock ?? 0,
        fraccion: p.fraccion ?? 0,
        fechaVencimiento: p.fechaVencimiento ?? '-',
        diasRestantes: p.diasRestantes,
      }))
    }

    if (tipoReporte === 'comprasProveedor') {
      return (comprasProveedorQuery.data?.items ?? []).map((c) => ({
        fecha: c.fecha,
        proveedor: c.proveedor,
        comprobante: c.tipoComprobante ?? '-',
        nroComprobante: c.nroComprobante ?? '-',
        nroGuia: c.nroGuia ?? '-',
        tipoPago: c.tipoPago ?? '-',
        monto: c.monto,
      }))
    }

    if (tipoReporte === 'incentivos') {
      return (incentivosQuery.data?.items ?? []).map((i) => ({
        fecha: i.fecha,
        usuario: i.usuario,
        monto: i.monto,
        descripcion: i.descripcion ?? '-',
      }))
    }

    if (tipoReporte === 'cargosDescargos') {
      const movimientos = [
        ...(cargosDescargosQuery.data?.cargos ?? []).map((c) => ({
          tipo: 'CARGO',
          subtipo: c.motivo ?? 'COMPRA',
          fecha: c.fecha,
          usuario: c.usuario,
          producto: c.producto,
          cantidad: c.cantidad,
          cajas: c.cajas ?? 0,
          fracciones: c.fracciones ?? 0,
          stockAntes: formatUF(c.stockAntesCajas, c.stockAntesFracciones),
          stockDespues: formatUF(c.stockDespuesCajas, c.stockDespuesFracciones),
          nroFraccion: c.nroFraccion ?? 1,
        })),
        ...(cargosDescargosQuery.data?.descargos ?? []).map((d) => ({
          tipo: 'DESCARGO',
          subtipo: d.tipoDescargo,
          fecha: d.fecha,
          usuario: d.usuario,
          producto: d.producto,
          cantidad: d.cantidad,
          cajas: d.cajas ?? 0,
          fracciones: d.fracciones ?? 0,
          stockAntes: formatUF(d.stockAntesCajas, d.stockAntesFracciones),
          stockDespues: formatUF(d.stockDespuesCajas, d.stockDespuesFracciones),
          nroFraccion: d.nroFraccion ?? 1,
        })),
      ]

      return movimientos.sort((a, b) => (a.fecha ?? '').localeCompare(b.fecha ?? ''))
    }

    return []
  }, [
    tipoReporte,
    resumenQuery.data,
    ventasQuery.data,
    vendedoresQuery.data,
    inventarioQuery.data,
    porVencerQuery.data,
    comprasProveedorQuery.data,
    incentivosQuery.data,
    cargosDescargosQuery.data,
  ])

  return (
    <main className="p-6 space-y-6">


      <section className="grid gap-4 rounded-md border bg-white p-4 md:grid-cols-4">
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium">Tipo de reporte</label>
          <select className="h-10 rounded-md border border-input bg-background px-3 w-full" value={tipoReporte} onChange={(e) => setTipoReporte(e.target.value as TipoReporte)}>
            <option value="resumen">Resumen diario</option>
            <option value="ventas">Ventas por rango</option>
            <option value="vendedores">Ventas por vendedor</option>
            <option value="inventario">Inventario</option>
            <option value="porVencer">Productos por vencer</option>
            <option value="comprasProveedor">Compras por proveedor</option>
            <option value="incentivos">Incentivos</option>
            <option value="cargosDescargos">Kardex (cargos/descargos)</option>
          </select>
        </div>

        {tipoReporte === 'resumen' && (
          <div className="space-y-1"><label className="text-sm font-medium">Fecha</label><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div>
        )}

        {(tipoReporte === 'ventas' || tipoReporte === 'vendedores' || tipoReporte === 'comprasProveedor' || tipoReporte === 'incentivos' || tipoReporte === 'cargosDescargos') && (
          <>
            <div className="space-y-1"><label className="text-sm font-medium">Fecha inicio</label><Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} /></div>
            <div className="space-y-1"><label className="text-sm font-medium">Fecha fin</label><Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} /></div>
          </>
        )}

        {tipoReporte === 'comprasProveedor' && (
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Proveedor</label>
            <select className="h-10 rounded-md border border-input bg-background px-3 w-full" value={idProveedor} onChange={(e) => setIdProveedor(Number(e.target.value))}>
              <option value={0}>Todos</option>
              {proveedores.map((p) => <option key={p.idProveedor} value={p.idProveedor}>{p.nombreProveedor}</option>)}
            </select>
          </div>
        )}

        {tipoReporte === 'porVencer' && (
          <>
            <div className="space-y-1"><label className="text-sm font-medium">Días a vencer</label><Input type="number" value={diasVencer} onChange={(e) => setDiasVencer(Number(e.target.value) || 0)} /></div>
            <div className="space-y-1"><label className="text-sm font-medium">Límite de filas</label><Input type="number" value={limiteVencer} onChange={(e) => setLimiteVencer(Number(e.target.value) || 1)} /></div>
          </>
        )}

        <div className="flex items-end gap-2 md:col-span-4">
          <Button
            type="button"
            onClick={() => {
              if (tipoReporte === 'resumen') resumenQuery.refetch()
              if (tipoReporte === 'ventas') ventasQuery.refetch()
              if (tipoReporte === 'vendedores') vendedoresQuery.refetch()
              if (tipoReporte === 'inventario') inventarioQuery.refetch()
              if (tipoReporte === 'porVencer') porVencerQuery.refetch()
              if (tipoReporte === 'comprasProveedor') comprasProveedorQuery.refetch()
              if (tipoReporte === 'incentivos') incentivosQuery.refetch()
              if (tipoReporte === 'cargosDescargos') cargosDescargosQuery.refetch()
            }}
          >
            Actualizar reporte
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={!exportRows.length}
            onClick={() => downloadCsv(`reporte-${tipoReporte}-${new Date().toISOString().slice(0, 10)}.csv`, exportRows)}
          >
            Descargar CSV (Excel)
          </Button>
        </div>
      </section>

      {tipoReporte === 'resumen' && (
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>Ventas del día</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-semibold">{resumenQuery.data?.cantidadVentas ?? 0}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Monto vendido</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-semibold">{money(resumenQuery.data?.montoTotal)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Productos bajo stock</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-semibold">{resumenQuery.data?.productosBajoStock ?? 0}</p></CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Detalle de ventas del día</h2>

            {(resumenQuery.data?.ventas ?? []).length === 0 && (
              <div className="rounded-md border bg-white p-4 text-sm text-muted-foreground">
                No hay ventas registradas para la fecha seleccionada.
              </div>
            )}

            {(resumenQuery.data?.ventas ?? []).map((venta) => (
              <div key={venta.idVenta} className="rounded-md border bg-white p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold">Correlativo de venta: {venta.correlativoVenta}</span>
                  <span className="text-muted-foreground">|</span>
                  <span>{venta.fecha?.replace('T', ' ').slice(0, 16)}</span>
                  <span className="text-muted-foreground">|</span>
                  <span>Vendedor: {venta.usuario ?? '-'}</span>
                  <span className="text-muted-foreground">|</span>
                  <span>Pago: {venta.tipoPago === 1 ? 'Efectivo' : 'Tarjeta/Otro'}</span>
                  <span className="text-muted-foreground">|</span>
                  <span>Monto: {money(venta.montoVenta)}</span>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>P. Unitario</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(venta.detalles ?? []).map((d, idx) => (
                      <TableRow key={`${venta.idVenta}-${d.idProducto ?? idx}-${idx}`}>
                        <TableCell>{d.nombreProducto ?? '-'}</TableCell>
                        <TableCell>{d.cantidad ?? 0}</TableCell>
                        <TableCell>{money(d.precioUnitario)}</TableCell>
                        <TableCell>{money(d.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        </section>
      )}

      {tipoReporte === 'ventas' && (
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardHeader><CardTitle>Total ventas</CardTitle></CardHeader><CardContent>{ventasQuery.data?.totalVentas ?? 0}</CardContent></Card>
            <Card><CardHeader><CardTitle>Monto total</CardTitle></CardHeader><CardContent>{money(ventasQuery.data?.montoTotal)}</CardContent></Card>
            <Card><CardHeader><CardTitle>Efectivo</CardTitle></CardHeader><CardContent>{money(ventasQuery.data?.montoEfectivo)}</CardContent></Card>
            <Card><CardHeader><CardTitle>Tarjeta/Otros</CardTitle></CardHeader><CardContent>{money(ventasQuery.data?.montoTarjeta)}</CardContent></Card>
          </div>
          <div className="grid gap-4 md:grid-cols-1">
            <Card><CardHeader><CardTitle>Utilidad total</CardTitle></CardHeader><CardContent>{money(ventasQuery.data?.utilidadTotal)}</CardContent></Card>
          </div>
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader><TableRow><TableHead>Correlativo</TableHead><TableHead>Fecha</TableHead><TableHead>Vendedor</TableHead><TableHead>Tipo pago</TableHead><TableHead>Items</TableHead><TableHead>Unid. vendidas</TableHead><TableHead>Monto</TableHead><TableHead>Utilidad</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
              <TableBody>
                {(ventasQuery.data?.items ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">No hay ventas en el rango seleccionado.</TableCell>
                  </TableRow>
                )}
                {(ventasQuery.data?.items ?? []).map((v) => (
                  <TableRow key={v.idVenta}>
                    <TableCell>{v.idVenta}</TableCell>
                    <TableCell>{v.fecha?.replace('T', ' ').slice(0, 16)}</TableCell>
                    <TableCell>{v.usuario}</TableCell>
                    <TableCell>{v.tipoPago === 1 ? 'Efectivo' : 'Tarjeta/Otro'}</TableCell>
                    <TableCell>{v.cantidadItems ?? 0}</TableCell>
                    <TableCell>{v.unidadesVendidas ?? 0}</TableCell>
                    <TableCell>{money(v.montoVenta)}</TableCell>
                    <TableCell>{money(v.utilidad)}</TableCell>
                    <TableCell>{v.estado === 1 ? 'Activo' : 'Anulado'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {tipoReporte === 'vendedores' && (
        <section className="rounded-md border bg-white">
          <Table>
            <TableHeader><TableRow><TableHead>Vendedor</TableHead><TableHead>Cantidad ventas</TableHead><TableHead>Monto vendido</TableHead><TableHead>Utilidad</TableHead></TableRow></TableHeader>
            <TableBody>
              {(vendedoresQuery.data ?? []).map((v) => (
                <TableRow key={v.idUsuario}>
                  <TableCell>{v.usuario}</TableCell>
                  <TableCell>{v.cantidadVentas}</TableCell>
                  <TableCell>{money(v.montoTotal)}</TableCell>
                  <TableCell>{money(v.utilidadTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}

      {tipoReporte === 'inventario' && (
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardHeader><CardTitle>Total capital</CardTitle></CardHeader><CardContent>{money(inventarioQuery.data?.totalCapital)}</CardContent></Card>
            <Card><CardHeader><CardTitle>Total venta</CardTitle></CardHeader><CardContent>{money(inventarioQuery.data?.totalVenta)}</CardContent></Card>
            <Card><CardHeader><CardTitle>Total utilidad</CardTitle></CardHeader><CardContent>{money(inventarioQuery.data?.totalUtilidad)}</CardContent></Card>
          </div>
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead>Laboratorio</TableHead><TableHead>Stock</TableHead><TableHead>P.C.</TableHead><TableHead>P.V.</TableHead><TableHead>Ubicación</TableHead><TableHead>Vencimiento</TableHead></TableRow></TableHeader>
              <TableBody>
                {(inventarioQuery.data?.items ?? []).map((p) => (
                  <TableRow key={p.idProducto}>
                    <TableCell>{p.nombreProducto}</TableCell>
                    <TableCell>{p.laboratorio ?? '-'}</TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell>{money(p.precioCompra)}</TableCell>
                    <TableCell>{money(p.precioVenta)}</TableCell>
                    <TableCell>{p.ubicacion ?? '-'}</TableCell>
                    <TableCell>{p.fechaVencimiento ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {tipoReporte === 'porVencer' && (
        <section className="rounded-md border bg-white">
          <Table>
            <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead>Stock</TableHead><TableHead>Fracción</TableHead><TableHead>Fecha vencimiento</TableHead><TableHead>Días restantes</TableHead></TableRow></TableHeader>
            <TableBody>
              {(porVencerQuery.data ?? []).map((p) => (
                <TableRow key={p.idProducto}>
                  <TableCell>{p.nombreProducto}</TableCell>
                  <TableCell>{p.stock ?? 0}</TableCell>
                  <TableCell>{p.fraccion ?? 0}</TableCell>
                  <TableCell>{p.fechaVencimiento ?? '-'}</TableCell>
                  <TableCell className={p.diasRestantes < 0 ? 'text-red-600 font-semibold' : ''}>{p.diasRestantes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}

      {tipoReporte === 'comprasProveedor' && (
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card><CardHeader><CardTitle>Cantidad compras</CardTitle></CardHeader><CardContent>{comprasProveedorQuery.data?.cantidadCompras ?? 0}</CardContent></Card>
            <Card><CardHeader><CardTitle>Monto total</CardTitle></CardHeader><CardContent>{money(comprasProveedorQuery.data?.montoTotal)}</CardContent></Card>
          </div>
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Proveedor</TableHead><TableHead>Comprobante</TableHead><TableHead>Nro. comp.</TableHead><TableHead>Nro. guía</TableHead><TableHead>Tipo pago</TableHead><TableHead>Monto</TableHead></TableRow></TableHeader>
              <TableBody>
                {(comprasProveedorQuery.data?.items ?? []).map((c) => (
                  <TableRow key={c.idCompra}>
                    <TableCell>{c.fecha?.replace('T', ' ').slice(0, 16)}</TableCell>
                    <TableCell>{c.proveedor}</TableCell>
                    <TableCell>{c.tipoComprobante ?? '-'}</TableCell>
                    <TableCell>{c.nroComprobante ?? '-'}</TableCell>
                    <TableCell>{c.nroGuia ?? '-'}</TableCell>
                    <TableCell>{c.tipoPago ?? '-'}</TableCell>
                    <TableCell>{money(c.monto)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {tipoReporte === 'incentivos' && (
        <section className="space-y-4">
          <Card><CardHeader><CardTitle>Total incentivos</CardTitle></CardHeader><CardContent>{money(incentivosQuery.data?.montoTotal)}</CardContent></Card>
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Usuario</TableHead><TableHead>Monto</TableHead><TableHead>Descripción</TableHead></TableRow></TableHeader>
              <TableBody>
                {(incentivosQuery.data?.items ?? []).map((i) => (
                  <TableRow key={i.idIncentivo}>
                    <TableCell>{i.fecha?.replace('T', ' ').slice(0, 16)}</TableCell>
                    <TableCell>{i.usuario}</TableCell>
                    <TableCell>{money(i.monto)}</TableCell>
                    <TableCell>{i.descripcion ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {tipoReporte === 'cargosDescargos' && (
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardHeader><CardTitle>Cargos</CardTitle></CardHeader><CardContent>{cargosDescargosQuery.data?.totalCargos ?? 0}</CardContent></Card>
            <Card><CardHeader><CardTitle>Descargos mod. stock</CardTitle></CardHeader><CardContent>{cargosDescargosQuery.data?.totalDescargosModStock ?? 0}</CardContent></Card>
            <Card><CardHeader><CardTitle>Descargos por venta</CardTitle></CardHeader><CardContent>{cargosDescargosQuery.data?.totalDescargosVenta ?? 0}</CardContent></Card>
            <Card><CardHeader><CardTitle>Total descargos</CardTitle></CardHeader><CardContent>{cargosDescargosQuery.data?.totalUnidadesDescargadas ?? 0}</CardContent></Card>
          </div>

          <div className="space-y-3 rounded-md border bg-white p-3">
            <h2 className="text-sm font-semibold">Kardex de movimientos</h2>
            <Table>
              <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Tipo</TableHead><TableHead>Subtipo</TableHead><TableHead>Producto</TableHead><TableHead>Usuario</TableHead><TableHead>Cantidad</TableHead><TableHead>Cajas</TableHead><TableHead>Fracciones</TableHead><TableHead>Stock antes</TableHead><TableHead>Stock después</TableHead></TableRow></TableHeader>
              <TableBody>
                {[
                  ...(cargosDescargosQuery.data?.cargos ?? []).map((c) => ({
                    key: `c-${c.idReferencia}-${c.fecha}-${c.producto}`,
                    fecha: c.fecha,
                    tipo: 'CARGO',
                    subtipo: c.motivo ?? 'COMPRA',
                    producto: c.producto,
                    usuario: c.usuario,
                    cantidad: c.cantidad,
                    cajas: c.cajas ?? 0,
                    fracciones: c.fracciones ?? 0,
                    stockAntes: formatUF(c.stockAntesCajas, c.stockAntesFracciones),
                    stockDespues: formatUF(c.stockDespuesCajas, c.stockDespuesFracciones),
                  })),
                  ...(cargosDescargosQuery.data?.descargos ?? []).map((d) => ({
                    key: `d-${d.idReferencia}-${d.fecha}-${d.producto}`,
                    fecha: d.fecha,
                    tipo: 'DESCARGO',
                    subtipo: d.tipoDescargo,
                    producto: d.producto,
                    usuario: d.usuario,
                    cantidad: d.cantidad,
                    cajas: d.cajas ?? 0,
                    fracciones: d.fracciones ?? 0,
                    stockAntes: formatUF(d.stockAntesCajas, d.stockAntesFracciones),
                    stockDespues: formatUF(d.stockDespuesCajas, d.stockDespuesFracciones),
                  })),
                ]
                  .sort((a, b) => (a.fecha ?? '').localeCompare(b.fecha ?? ''))
                  .map((m) => (
                    <TableRow key={m.key}>
                      <TableCell>{m.fecha?.replace('T', ' ').slice(0, 16)}</TableCell>
                      <TableCell>{m.tipo}</TableCell>
                      <TableCell>{m.subtipo}</TableCell>
                      <TableCell>{m.producto}</TableCell>
                      <TableCell>{m.usuario}</TableCell>
                      <TableCell>{m.cantidad ?? 0}</TableCell>
                      <TableCell>{m.cajas ?? 0}</TableCell>
                      <TableCell>{m.fracciones ?? 0}</TableCell>
                      <TableCell>{m.stockAntes}</TableCell>
                      <TableCell>{m.stockDespues}</TableCell>
                    </TableRow>
                  ))}
                {((cargosDescargosQuery.data?.cargos?.length ?? 0) + (cargosDescargosQuery.data?.descargos?.length ?? 0) === 0) && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">No hay movimientos de kardex en el rango seleccionado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </main>
  )
}
