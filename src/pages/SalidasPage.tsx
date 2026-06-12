import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarProductos } from '@/api/ventasApi'
import { crearSalida, listarSalidasRango } from '@/api/operacionesApi'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'
import { type ItemCantidad, type Producto } from '@/types'

export default function SalidasPage() {
  const queryClient = useQueryClient()
  const idZona = useAuthStore((s) => s.idZona) ?? 1
  const today = new Date().toISOString().slice(0, 10)
  const [fechaIni, setFechaIni] = useState(today)
  const [fechaFin, setFechaFin] = useState(today)
  const [busqueda, setBusqueda] = useState('')
  const [motivo, setMotivo] = useState('MERMA')
  const [items, setItems] = useState<ItemCantidad[]>([])

  const { data: productos = [] } = useQuery({ queryKey: ['productos', idZona], queryFn: () => listarProductos(idZona) })
  const { data: salidas = [] } = useQuery({ queryKey: ['salidas', idZona, fechaIni, fechaFin], queryFn: () => listarSalidasRango(idZona, fechaIni, fechaFin) })

  const createMutation = useMutation({
    mutationFn: crearSalida,
    onSuccess: () => {
      setItems([])
      queryClient.invalidateQueries({ queryKey: ['salidas', idZona, fechaIni, fechaFin] })
      queryClient.invalidateQueries({ queryKey: ['productos', idZona] })
      notifySuccess('Salida guardada correctamente.')
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo guardar la salida.')),
  })

  const filtrados = useMemo(() => productos.filter((p) => p.nombreProducto.toLowerCase().includes(busqueda.toLowerCase())).slice(0, 20), [productos, busqueda])

  function agregar(p: Producto) {
    const idx = items.findIndex((i) => i.idProducto === p.idProducto)
    if (idx >= 0) {
      const c = [...items]
      c[idx].cantidad += 1
      setItems(c)
      return
    }
    setItems((prev) => [...prev, { idProducto: p.idProducto, nombreProducto: p.nombreProducto, cantidad: 1 }])
  }

  function cambiarCantidad(idProducto: number, cantidad: number) {
    setItems((prev) => prev.map((i) => i.idProducto === idProducto ? { ...i, cantidad } : i))
  }

  return (
    <main className="p-6 space-y-6">


      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <Input placeholder="Buscar producto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          <div className="max-h-[320px] overflow-y-auto rounded-md border bg-white">
            {filtrados.map((p) => (
              <button key={p.idProducto} className="w-full text-left px-4 py-3 border-b hover:bg-slate-50" onClick={() => agregar(p)}>
                <p className="font-medium">{p.nombreProducto}</p>
                <p className="text-sm text-muted-foreground">Stock: {p.stock}</p>
              </button>
            ))}
          </div>
          <Input placeholder="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          <Button onClick={() => createMutation.mutate({ motivo, items })} disabled={items.length === 0}>Registrar salida</Button>
        </div>

        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead>Cantidad</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.idProducto}>
                  <TableCell>{i.nombreProducto}</TableCell>
                  <TableCell><Input type="number" min={1} value={i.cantidad} onChange={(e) => cambiarCantidad(i.idProducto, Number(e.target.value || 1))} className="w-24" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="grid gap-2 md:grid-cols-2">
        <Input type="date" value={fechaIni} onChange={(e) => setFechaIni(e.target.value)} />
        <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
      </section>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Fecha</TableHead><TableHead>Motivo</TableHead><TableHead>Items</TableHead></TableRow></TableHeader>
          <TableBody>
            {salidas.map((s) => (
              <TableRow key={s.idSalida}>
                <TableCell>{s.idSalida}</TableCell>
                <TableCell>{s.fechaSalida?.slice(0, 19).replace('T', ' ')}</TableCell>
                <TableCell>{s.motivo}</TableCell>
                <TableCell>{s.items?.length ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}
