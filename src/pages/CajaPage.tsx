import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { abrirCaja, cerrarCaja, listarCajas } from '@/api/operacionesApi'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'

export default function CajaPage() {
  const queryClient = useQueryClient()
  const idZona = useAuthStore((s) => s.idZona) ?? 1
  const [montoInicial, setMontoInicial] = useState(0)

  const { data: cajas = [] } = useQuery({ queryKey: ['cajas', idZona], queryFn: () => listarCajas(idZona) })

  const abrirMutation = useMutation({
    mutationFn: abrirCaja,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cajas', idZona] })
      notifySuccess('Caja guardada correctamente.')
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo abrir la caja.')),
  })

  const cerrarMutation = useMutation({
    mutationFn: ({ id, montoFinal }: { id: number; montoFinal: number }) => cerrarCaja(id, { montoInicial: 0, montoFinal }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cajas', idZona] })
      notifySuccess('Caja modificada correctamente.')
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo cerrar la caja.')),
  })

  return (
    <main className="p-6 space-y-6">


      <section className="flex gap-3 max-w-md">
        <Input type="number" step="0.01" placeholder="Monto inicial" value={montoInicial} onChange={(e) => setMontoInicial(Number(e.target.value))} />
        <Button onClick={() => abrirMutation.mutate({ montoInicial })}>Abrir caja</Button>
      </section>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Apertura</TableHead><TableHead>Cierre</TableHead><TableHead>Inicial</TableHead><TableHead>Final</TableHead><TableHead>Estado</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {cajas.map((c) => (
              <TableRow key={c.idCaja}>
                <TableCell>{c.idCaja}</TableCell>
                <TableCell>{c.fechaApertura?.slice(0, 19).replace('T', ' ')}</TableCell>
                <TableCell>{c.fechaCierre ? c.fechaCierre.slice(0, 19).replace('T', ' ') : '-'}</TableCell>
                <TableCell>S/ {(c.montoInicial ?? 0).toFixed(2)}</TableCell>
                <TableCell>S/ {(c.montoFinal ?? 0).toFixed(2)}</TableCell>
                <TableCell>{c.estado}</TableCell>
                <TableCell>
                  {c.idCaja && c.estado === 'ABIERTA' ? (
                    <Button size="sm" variant="outline" onClick={() => cerrarMutation.mutate({ id: c.idCaja!, montoFinal: c.montoFinal ?? c.montoInicial })}>Cerrar</Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}
