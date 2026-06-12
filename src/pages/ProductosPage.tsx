import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarProductos } from '@/api/ventasApi'
import { crearProducto, actualizarProducto, eliminarProducto, listarLaboratorios } from '@/api/catalogosApi'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { type Producto } from '@/types'

const emptyForm: Producto = {
  nombreProducto: '',
  nroFraccion: 1,
  unidades: 0,
  fraccion: 0,
  lote: '',
  precio: 0,
  precioCompra: 0,
  porcentajeGanancia: 0,
  precioVentaCaja: 0,
  stock: 0,
  stockMinimo: 0,
  unidad: 'Unidad',
  presentacion: '',
  nroBlister: '',
  precioBlister: 0,
  ubicacion: '',
  codigoBarras: '',
  codigoDigemid: '',
  fechaAdquisicion: '',
  fechaVencimiento: '',
  descripcion: '',
  idLaboratorio: undefined,
  idZona: 1,
  idProducto: 0,
}

export default function ProductosPage() {
  const queryClient = useQueryClient()
  const idZona = useAuthStore((s) => s.idZona) ?? 1
  const [busqueda, setBusqueda] = useState('')
  const [filtroLab, setFiltroLab] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<Producto>({ ...emptyForm, idZona })

  const { data: productos = [] } = useQuery({ 
    queryKey: ['productos', idZona], 
    queryFn: () => listarProductos(idZona),
    refetchOnWindowFocus: true,
  })
  const { data: laboratorios = [] } = useQuery({ queryKey: ['laboratorios'], queryFn: listarLaboratorios })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, idZona }
      if (editingId) return actualizarProducto(editingId, idZona, payload)
      return crearProducto(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos', idZona] })
      setForm({ ...emptyForm, idZona })
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => eliminarProducto(id, idZona),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos', idZona] }),
  })

  const filtrados = useMemo(
    () => productos.filter((p) => p.nombreProducto.toLowerCase().includes(busqueda.toLowerCase())),
    [productos, busqueda]
  )

  function setField<K extends keyof Producto>(k: K, v: Producto[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  function editar(p: Producto) {
    setEditingId(p.idProducto)
    setForm({ ...p, idZona })
  }

  function actualizarPrecioCompra(value: number) {
    const porcentaje = form.precio && value > 0 ? Number((((form.precio / value) - 1) * 100).toFixed(2)) : 0
    setForm((prev) => ({ ...prev, precioCompra: value, porcentajeGanancia: porcentaje }))
  }

  function actualizarPrecioVenta(value: number) {
    const porcentaje = form.precioCompra && form.precioCompra > 0 ? Number((((value / form.precioCompra) - 1) * 100).toFixed(2)) : 0
    setForm((prev) => ({ ...prev, precio: value, porcentajeGanancia: porcentaje }))
  }

  return (
    <main className="pt-2 px-6 pb-6 space-y-4">
      <section>
        {/* <h1 className="text-3xl font-bold tracking-tight">Mantenimiento de Productos</h1> */}
        {/* <p className="text-muted-foreground">Catálogo, precios, stock y laboratorio</p> */}
      </section>


      <section className="rounded-md border bg-white p-3">
        <form onSubmit={e => { e.preventDefault(); if (saveMutation.isPending) return; saveMutation.mutate(); }}>
          <div className="grid grid-cols-4 md:grid-cols-8 items-end gap-x-1 gap-y-0.5">
            {/* Primera fila */}
            <div className="space-y-0.5 col-span-4 md:col-span-4"><label className="text-sm font-medium">Nombre del producto</label><Input value={form.nombreProducto} onChange={(e) => setField('nombreProducto', e.target.value)} /></div>
            <div className="space-y-0.5"><label className="text-sm font-medium">Nro. fracción</label><Input type="number" value={form.nroFraccion ?? 0} onChange={(e) => setField('nroFraccion', Number(e.target.value))} /></div>
            <div className="space-y-0.5"><label className="text-sm font-medium">Lote</label><Input value={form.lote ?? ''} onChange={(e) => setField('lote', e.target.value)} /></div>
            <div className="space-y-0.5 col-span-2"><label className="text-sm font-medium">Laboratorio</label><select className="h-10 rounded-md border border-input bg-background px-3 w-full" value={form.idLaboratorio ?? ''} onChange={(e) => setField('idLaboratorio', e.target.value ? Number(e.target.value) : undefined)}><option value="">Sin laboratorio</option>{laboratorios.map((l) => (<option key={l.idLaboratorio} value={l.idLaboratorio}>{l.nombreLaboratorio}</option>))}</select></div>
            {/* Segunda fila */}
            <div className="space-y-0.5"><label className="text-sm font-medium">Unidades</label><Input type="number" value={form.unidades ?? 0} onChange={(e) => setField('unidades', Number(e.target.value))} /></div>
            <div className="space-y-0.5"><label className="text-sm font-medium">Fracción</label><Input type="number" value={form.fraccion ?? 0} onChange={(e) => setField('fraccion', Number(e.target.value))} /></div>
            <div className="space-y-0.5"><label className="text-sm font-medium">Precio costo</label><Input type="number" step="0.01" value={form.precioCompra ?? 0} onChange={(e) => actualizarPrecioCompra(Number(e.target.value))} /></div>
            <div className="space-y-0.5"><label className="text-sm font-medium">% ganancia</label><Input type="number" step="0.01" value={form.porcentajeGanancia ?? 0} onChange={(e) => setField('porcentajeGanancia', Number(e.target.value))} /></div>
            {/* Tercera fila */}
            <div className="space-y-0.5"><label className="text-sm font-medium">Precio venta</label><Input type="number" step="0.01" value={form.precio} onChange={(e) => actualizarPrecioVenta(Number(e.target.value))} /></div>
            <div className="space-y-0.5"><label className="text-sm font-medium">Stock actual</label><Input type="number" value={form.stock} disabled className="bg-gray-100 cursor-not-allowed" /></div>
            <div className="space-y-0.5"><label className="text-sm font-medium">Precio venta caja</label><Input type="number" step="0.01" value={form.precioVentaCaja ?? 0} onChange={(e) => setField('precioVentaCaja', Number(e.target.value))} /></div>
            <div className="space-y-0.5"><label className="text-sm font-medium">Nro. blister</label><Input value={form.nroBlister ?? ''} onChange={(e) => setField('nroBlister', e.target.value)} /></div>
            {/* Resto de campos en el orden que estaban */}
            <div className="space-y-0.5"><label className="text-sm font-medium">Precio blister</label><Input type="number" step="0.01" value={form.precioBlister ?? 0} onChange={(e) => setField('precioBlister', Number(e.target.value))} /></div>
            <div className="space-y-0.5"><label className="text-sm font-medium">Ubicación</label><Input value={form.ubicacion ?? ''} onChange={(e) => setField('ubicacion', e.target.value)} /></div>
            <div className="space-y-0.5"><label className="text-sm font-medium">Código barras</label><Input value={form.codigoBarras ?? ''} onChange={(e) => setField('codigoBarras', e.target.value)} /></div>
            <div className="space-y-0.5"><label className="text-sm font-medium">Código Digemid</label><Input value={form.codigoDigemid ?? ''} onChange={(e) => setField('codigoDigemid', e.target.value)} /></div>
            <div className="space-y-0.5"><label className="text-sm font-medium">Stock mínimo</label><Input type="number" value={form.stockMinimo} onChange={(e) => setField('stockMinimo', Number(e.target.value))} /></div>
            <div className="space-y-0.5"><label className="text-sm font-medium">Fecha adquisición</label><Input type="date" value={form.fechaAdquisicion ?? ''} onChange={(e) => setField('fechaAdquisicion', e.target.value)} /></div>
            <div className="space-y-0.5"><label className="text-sm font-medium">Fecha vencimiento</label><Input type="date" value={form.fechaVencimiento ?? ''} onChange={(e) => setField('fechaVencimiento', e.target.value)} /></div>
            {/* Botón Crear producto al final de la última fila */}
            <div className="space-y-0.5 flex gap-2 col-span-1 md:col-span-1 justify-end mt-1">
              <Button type="submit" disabled={saveMutation.isPending}>
                {editingId ? 'Actualizar' : 'Crear'} producto
              </Button>
              {editingId && (
                <Button variant="outline" type="button" onClick={() => { setEditingId(null); setForm({ ...emptyForm, idZona }) }}>
                  Cancelar edición
                </Button>
              )}
            </div>
          </div>
        </form>
      </section>

      <section className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex flex-col gap-1">
                  <span>Producto</span>
                  <Input placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="h-7 px-2 py-1 text-xs" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex flex-col gap-1">
                  <span>Lab.</span>
                  <select value={filtroLab} onChange={e => setFiltroLab(e.target.value)} className="h-7 px-2 py-1 text-xs rounded-md border">
                    <option value="">Todos</option>
                    {laboratorios.map((l) => <option key={l.idLaboratorio} value={l.idLaboratorio}>{l.nombreLaboratorio}</option>)}
                  </select>
                </div>
              </TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Mín.</TableHead>
              <TableHead>U</TableHead>
              <TableHead>F</TableHead>
              <TableHead>Lote</TableHead>
              <TableHead>Ubic.</TableHead>
              <TableHead>P.C.</TableHead>
              <TableHead>P.V.</TableHead>
              <TableHead>Cód. barras</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados
              .filter(p => !filtroLab || String(p.idLaboratorio) === filtroLab)
              .map((p) => (
              <TableRow key={p.idProducto}>
                <TableCell>{p.nombreProducto}</TableCell>
                <TableCell>{p.nombreLaboratorio ?? '-'}</TableCell>
                <TableCell className={p.stock < p.stockMinimo ? 'font-bold text-red-600' : ''}>{p.stock}</TableCell>
                <TableCell>{p.stockMinimo}</TableCell>
                <TableCell>{Math.floor((p.stock ?? 0) / Math.max(1, p.nroFraccion ?? 1))}</TableCell>
                <TableCell>{(p.stock ?? 0) % Math.max(1, p.nroFraccion ?? 1)}</TableCell>
                <TableCell>{p.lote ?? '-'}</TableCell>
                <TableCell>{p.ubicacion ?? '-'}</TableCell>
                <TableCell>S/ {(p.precioCompra ?? 0).toFixed(2)}</TableCell>
                <TableCell>S/ {p.precio.toFixed(2)}</TableCell>
                <TableCell>{p.codigoBarras ?? '-'}</TableCell>
                <TableCell className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => editar(p)}>Editar</Button>
                  <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(p.idProducto)}>Eliminar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </main>
  )
}
