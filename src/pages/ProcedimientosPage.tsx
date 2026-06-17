import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarAtenciones, listarProcedimientosPorAtencion, registrarProcedimiento } from '@/api/clinicaApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'

export default function ProcedimientosPage() {
  const queryClient = useQueryClient()
  const [idAtencion, setIdAtencion] = useState(0)
  const [procedimiento, setProcedimiento] = useState('')
  const [detalle, setDetalle] = useState('')
  const [tarifa, setTarifa] = useState('')

  const atencionesQuery = useQuery({ queryKey: ['clinica', 'atenciones'], queryFn: () => listarAtenciones() })
  const procedimientosQuery = useQuery({
    queryKey: ['clinica', 'procedimientos', idAtencion],
    queryFn: () => listarProcedimientosPorAtencion(idAtencion),
    enabled: idAtencion > 0,
  })

  const createMutation = useMutation({
    mutationFn: () => registrarProcedimiento(idAtencion, {
      procedimiento,
      detalle,
      tarifa: tarifa ? Number(tarifa) : undefined,
      estado: 'REALIZADO',
    }),
    onSuccess: () => {
      notifySuccess('Procedimiento registrado')
      setProcedimiento('')
      setDetalle('')
      setTarifa('')
      queryClient.invalidateQueries({ queryKey: ['clinica', 'procedimientos', idAtencion] })
    },
    onError: (e) => notifyError(getApiErrorMessage(e, 'No se pudo registrar procedimiento')),
  })

  const atenciones = atencionesQuery.data ?? []
  const procedimientos = procedimientosQuery.data ?? []

  return (
    <main className="p-6 space-y-6">
      <section className="rounded-xl border bg-white p-5">
        <h1 className="text-2xl font-semibold text-slate-900">Procedimientos</h1>
        <p className="text-sm text-slate-600 mt-1">Registro de procedimientos medicos y servicios clinicos.</p>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <select className="h-10 rounded-md border px-3" value={idAtencion} onChange={(e) => setIdAtencion(Number(e.target.value))}>
            <option value={0}>Atencion</option>
            {atenciones.map((a) => <option key={a.idAtencion} value={a.idAtencion}>{a.idAtencion} - {a.admision.paciente.apellidos}, {a.admision.paciente.nombres}</option>)}
          </select>
          <Input placeholder="Procedimiento" value={procedimiento} onChange={(e) => setProcedimiento(e.target.value)} />
          <Input placeholder="Detalle" value={detalle} onChange={(e) => setDetalle(e.target.value)} />
          <Input placeholder="Tarifa" type="number" step="0.01" value={tarifa} onChange={(e) => setTarifa(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <Button disabled={createMutation.isPending || !idAtencion || !procedimiento.trim()} onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? 'Guardando...' : 'Registrar procedimiento'}
          </Button>
        </div>
      </section>

      {idAtencion > 0 && (
        <section className="rounded-xl border bg-white p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Procedimiento</TableHead>
                <TableHead>Detalle</TableHead>
                <TableHead>Tarifa</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {procedimientos.map((p) => (
                <TableRow key={p.idProcedimientoAtencion}>
                  <TableCell>{new Date(p.fechaRegistro).toLocaleString()}</TableCell>
                  <TableCell>{p.procedimiento}</TableCell>
                  <TableCell>{p.detalle ?? '-'}</TableCell>
                  <TableCell>{p.tarifa ?? '-'}</TableCell>
                  <TableCell>{p.estado}</TableCell>
                </TableRow>
              ))}
              {procedimientos.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-slate-500">Sin procedimientos.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </section>
      )}
    </main>
  )
}
