import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { crearOrdenLaboratorio, listarAtenciones, listarOrdenesLaboratorio, listarResultadosLaboratorio, registrarResultadoLaboratorio } from '@/api/clinicaApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'

export default function LaboratorioClinicoPage() {
  const queryClient = useQueryClient()
  const [idAtencion, setIdAtencion] = useState(0)
  const [examen, setExamen] = useState('')
  const [obs, setObs] = useState('')
  const [idOrdenResultado, setIdOrdenResultado] = useState(0)
  const [resultado, setResultado] = useState('')
  const [archivoAdjunto, setArchivoAdjunto] = useState('')

  const atencionesQuery = useQuery({ queryKey: ['clinica', 'atenciones'], queryFn: () => listarAtenciones() })
  const ordenesQuery = useQuery({ queryKey: ['clinica', 'lab-ordenes'], queryFn: () => listarOrdenesLaboratorio() })
  const resultadosQuery = useQuery({
    queryKey: ['clinica', 'lab-resultados', idOrdenResultado],
    queryFn: () => listarResultadosLaboratorio(idOrdenResultado),
    enabled: idOrdenResultado > 0,
  })

  const ordenMutation = useMutation({
    mutationFn: () => crearOrdenLaboratorio(idAtencion, { examen, observaciones: obs }),
    onSuccess: () => {
      notifySuccess('Orden de laboratorio registrada')
      setExamen('')
      setObs('')
      queryClient.invalidateQueries({ queryKey: ['clinica', 'lab-ordenes'] })
    },
    onError: (e) => notifyError(getApiErrorMessage(e, 'No se pudo registrar orden')),
  })

  const resultadoMutation = useMutation({
    mutationFn: () => registrarResultadoLaboratorio(idOrdenResultado, { resultado, archivoAdjunto }),
    onSuccess: () => {
      notifySuccess('Resultado registrado')
      setResultado('')
      setArchivoAdjunto('')
      queryClient.invalidateQueries({ queryKey: ['clinica', 'lab-ordenes'] })
      queryClient.invalidateQueries({ queryKey: ['clinica', 'lab-resultados', idOrdenResultado] })
    },
    onError: (e) => notifyError(getApiErrorMessage(e, 'No se pudo registrar resultado')),
  })

  const atenciones = atencionesQuery.data ?? []
  const ordenes = ordenesQuery.data ?? []
  const resultados = resultadosQuery.data ?? []

  return (
    <main className="p-6 space-y-6">
      <section className="rounded-xl border bg-white p-5">
        <h1 className="text-2xl font-semibold text-slate-900">Laboratorio Clinico</h1>
        <p className="text-sm text-slate-600 mt-1">Gestion de ordenes, resultados y trazabilidad por paciente.</p>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold">Nueva orden</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <select className="h-10 rounded-md border px-3" value={idAtencion} onChange={(e) => setIdAtencion(Number(e.target.value))}>
            <option value={0}>Atencion</option>
            {atenciones.map((a) => <option key={a.idAtencion} value={a.idAtencion}>{a.idAtencion} - {a.admision.paciente.apellidos}, {a.admision.paciente.nombres}</option>)}
          </select>
          <Input placeholder="Examen" value={examen} onChange={(e) => setExamen(e.target.value)} />
          <Input placeholder="Observaciones" value={obs} onChange={(e) => setObs(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <Button disabled={ordenMutation.isPending || !idAtencion || !examen.trim()} onClick={() => ordenMutation.mutate()}>
            {ordenMutation.isPending ? 'Guardando...' : 'Registrar orden'}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold">Registrar resultado</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <select className="h-10 rounded-md border px-3" value={idOrdenResultado} onChange={(e) => setIdOrdenResultado(Number(e.target.value))}>
            <option value={0}>Orden</option>
            {ordenes.map((o) => <option key={o.idOrdenLaboratorio} value={o.idOrdenLaboratorio}>{o.idOrdenLaboratorio} - {o.examen}</option>)}
          </select>
          <Input placeholder="Resultado" value={resultado} onChange={(e) => setResultado(e.target.value)} />
          <Input placeholder="Adjunto (url/ruta)" value={archivoAdjunto} onChange={(e) => setArchivoAdjunto(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <Button disabled={resultadoMutation.isPending || !idOrdenResultado || !resultado.trim()} onClick={() => resultadoMutation.mutate()}>
            {resultadoMutation.isPending ? 'Guardando...' : 'Registrar resultado'}
          </Button>
        </div>

        {idOrdenResultado > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Adjunto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultados.map((r) => (
                <TableRow key={r.idResultadoLaboratorio}>
                  <TableCell>{new Date(r.fechaResultado).toLocaleString()}</TableCell>
                  <TableCell>{r.resultado}</TableCell>
                  <TableCell>{r.archivoAdjunto ?? '-'}</TableCell>
                </TableRow>
              ))}
              {resultados.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-slate-500">Sin resultados.</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </section>
    </main>
  )
}
