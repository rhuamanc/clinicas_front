import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { crearIncentivo, eliminarIncentivo, listarIncentivos } from '@/api/operacionesApi'
import { listarProductos } from '@/api/ventasApi'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { FieldError, OptionalLabel, RequiredLabel, fieldClass } from '@/components/ui/form-feedback'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'

export default function IncentivosPage() {
  const queryClient = useQueryClient()
  const idZona = useAuthStore((s) => s.idZona) ?? 1
  const [idProducto, setIdProducto] = useState(0)
  const [monto, setMonto] = useState(0)
  const [descripcion, setDescripcion] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: productos = [] } = useQuery({ queryKey: ['productos', idZona], queryFn: () => listarProductos(idZona) })
  const { data: incentivos = [] } = useQuery({ queryKey: ['incentivos', idZona], queryFn: () => listarIncentivos(idZona) })

  const createMutation = useMutation({
    mutationFn: crearIncentivo,
    onSuccess: () => {
      setIdProducto(0)
      setMonto(0)
      setDescripcion('')
      queryClient.invalidateQueries({ queryKey: ['incentivos', idZona] })
      notifySuccess('Incentivo guardado correctamente.')
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo guardar el incentivo.')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => eliminarIncentivo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incentivos', idZona] })
      notifySuccess('Incentivo eliminado correctamente.')
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo eliminar el incentivo.')),
  })

  return (
    <main className="p-6 space-y-6">


      <section className="grid gap-4 md:grid-cols-4">
        <div className="space-y-1"><RequiredLabel>Producto</RequiredLabel><select className={fieldClass(Boolean(errors.idProducto)) + ' h-10 rounded-md bg-background px-3 w-full'} value={idProducto} onChange={(e) => { setIdProducto(Number(e.target.value)); setErrors((prev) => ({ ...prev, idProducto: '' })) }}>
          <option value={0}>Seleccionar producto</option>
          {productos.map((p) => <option key={p.idProducto} value={p.idProducto}>{p.nombreProducto}</option>)}
        </select><FieldError message={errors.idProducto} /></div>
        <div className="space-y-1"><RequiredLabel>Monto</RequiredLabel><Input className={fieldClass(Boolean(errors.monto))} type="number" step="0.01" value={monto} onChange={(e) => { setMonto(Number(e.target.value)); setErrors((prev) => ({ ...prev, monto: '' })) }} /><FieldError message={errors.monto} /></div>
        <div className="space-y-1"><OptionalLabel>Descripcion</OptionalLabel><Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} /></div>
        <Button className="self-end" onClick={() => {
          const nextErrors: Record<string, string> = {}
          if (!idProducto) nextErrors.idProducto = 'Selecciona un producto.'
          if (!monto || monto <= 0) nextErrors.monto = 'El monto debe ser mayor a 0.'
          setErrors(nextErrors)
          if (Object.keys(nextErrors).length > 0) {
            notifyError('Completa los campos obligatorios del incentivo.')
            return
          }
          createMutation.mutate({ idProducto, monto, descripcion })
        }}>Registrar</Button>
      </section>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Producto</TableHead><TableHead>Monto</TableHead><TableHead>Descripcion</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {incentivos.map((i) => (
              <TableRow key={i.idIncentivo}>
                <TableCell>{i.fecha?.slice(0, 19).replace('T', ' ')}</TableCell>
                <TableCell>{i.nombreProducto}</TableCell>
                <TableCell>S/ {i.monto.toFixed(2)}</TableCell>
                <TableCell>{i.descripcion ?? '-'}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => i.idIncentivo && deleteMutation.mutate(i.idIncentivo)}>
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}
