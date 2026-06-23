import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  crearOrdenLaboratorio,
  listarAtenciones,
  listarExamenesLaboratorio,
  listarOrdenesLaboratorio,
  listarPacientes,
  listarResultadosLaboratorio,
  registrarResultadoLaboratorio,
} from '@/api/clinicaApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'

export default function LaboratorioClinicoPage() {
  const queryClient = useQueryClient()
  const [idPaciente, setIdPaciente] = useState(0)
  const [idAtencion, setIdAtencion] = useState(0)
  const [idExamen, setIdExamen] = useState(0)
  const [obs, setObs] = useState('')
  const [idOrdenResultado, setIdOrdenResultado] = useState(0)
  const [resultado, setResultado] = useState('')
  const [archivoAdjunto, setArchivoAdjunto] = useState('')

  const pacientesQuery = useQuery({ queryKey: ['clinica', 'pacientes'], queryFn: () => listarPacientes() })
  const atencionesQuery = useQuery({
    queryKey: ['clinica', 'atenciones-paciente', idPaciente],
    queryFn: () => listarAtenciones(idPaciente),
    enabled: idPaciente > 0,
  })
  const ordenesQuery = useQuery({
    queryKey: ['clinica', 'lab-ordenes-paciente', idPaciente],
    queryFn: () => listarOrdenesLaboratorio(undefined, idPaciente),
    enabled: idPaciente > 0,
  })
  const examenesQuery = useQuery({
    queryKey: ['clinica', 'examenes-laboratorio-activos'],
    queryFn: () => listarExamenesLaboratorio({ activo: true, page: 0, size: 100 }),
  })
  const resultadosQuery = useQuery({
    queryKey: ['clinica', 'lab-resultados', idOrdenResultado],
    queryFn: () => listarResultadosLaboratorio(idOrdenResultado),
    enabled: idOrdenResultado > 0,
  })

  const ordenMutation = useMutation({
    mutationFn: () => crearOrdenLaboratorio(idAtencion, { idExamen, observaciones: obs || undefined }),
    onSuccess: () => {
      notifySuccess('Orden de laboratorio registrada')
      setIdExamen(0)
      setObs('')
      queryClient.invalidateQueries({ queryKey: ['clinica', 'lab-ordenes-paciente', idPaciente] })
    },
    onError: (e) => notifyError(getApiErrorMessage(e, 'No se pudo registrar orden')),
  })

  const resultadoMutation = useMutation({
    mutationFn: () => registrarResultadoLaboratorio(idOrdenResultado, { resultado, archivoAdjunto: archivoAdjunto || undefined }),
    onSuccess: () => {
      notifySuccess('Resultado registrado')
      setResultado('')
      setArchivoAdjunto('')
      queryClient.invalidateQueries({ queryKey: ['clinica', 'lab-ordenes-paciente', idPaciente] })
      queryClient.invalidateQueries({ queryKey: ['clinica', 'lab-resultados', idOrdenResultado] })
    },
    onError: (e) => notifyError(getApiErrorMessage(e, 'No se pudo registrar resultado')),
  })

  const pacientes = pacientesQuery.data ?? []
  const atenciones = atencionesQuery.data ?? []
  const ordenes = ordenesQuery.data ?? []
  const examenes = examenesQuery.data?.content ?? []
  const resultados = resultadosQuery.data ?? []
  const ordenSeleccionada = ordenes.find((o) => o.idOrdenLaboratorio === idOrdenResultado) ?? null

  function onCambiarPaciente(nuevoIdPaciente: number) {
    setIdPaciente(nuevoIdPaciente)
    setIdAtencion(0)
    setIdExamen(0)
    setObs('')
    setIdOrdenResultado(0)
    setResultado('')
    setArchivoAdjunto('')
  }

  return (
    <main className="p-6 space-y-6">
      <section className="rounded-xl border bg-white p-5">
        <h1 className="text-2xl font-semibold text-slate-900">Laboratorio Clinico</h1>
        <p className="text-sm text-slate-600 mt-1">Selecciona un paciente para ver sus ordenes, registrar nuevas ordenes y cargar resultados.</p>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold">Paciente</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <select className="h-10 rounded-md border px-3" value={idPaciente} onChange={(e) => onCambiarPaciente(Number(e.target.value))}>
            <option value={0}>Seleccionar paciente</option>
            {pacientes.map((p) => (
              <option key={p.idPaciente} value={p.idPaciente}>
                {p.apellidos}, {p.nombres}
              </option>
            ))}
          </select>
          <Input value={idPaciente ? `Total de ordenes del paciente: ${ordenes.length}` : ''} placeholder="Selecciona un paciente para continuar" readOnly />
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold">Agregar orden de laboratorio</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <select className="h-10 rounded-md border px-3" value={idAtencion} onChange={(e) => setIdAtencion(Number(e.target.value))} disabled={!idPaciente}>
            <option value={0}>Atencion del paciente</option>
            {atenciones.map((a) => (
              <option key={a.idAtencion} value={a.idAtencion}>
                Atencion #{a.idAtencion} - {new Date(a.fechaAtencion).toLocaleString()}
              </option>
            ))}
          </select>
          <select className="h-10 rounded-md border px-3" value={idExamen} onChange={(e) => setIdExamen(Number(e.target.value))} disabled={!idPaciente}>
            <option value={0}>Examen del catalogo</option>
            {examenes.map((ex) => (
              <option key={ex.idExamen} value={ex.idExamen}>
                {ex.codigo} - {ex.nombre}
              </option>
            ))}
          </select>
          <Input placeholder="Observaciones" value={obs} onChange={(e) => setObs(e.target.value)} disabled={!idPaciente} />
        </div>
        <div className="flex justify-end">
          <Button disabled={ordenMutation.isPending || !idPaciente || !idAtencion || !idExamen} onClick={() => ordenMutation.mutate()}>
            {ordenMutation.isPending ? 'Guardando...' : 'Registrar orden'}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold">Ordenes del paciente</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Orden</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Examen</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Accion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordenes.map((o) => (
              <TableRow key={o.idOrdenLaboratorio}>
                <TableCell>{o.idOrdenLaboratorio}</TableCell>
                <TableCell>{new Date(o.fechaOrden).toLocaleString()}</TableCell>
                <TableCell>{o.examen}</TableCell>
                <TableCell>{o.estado}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => setIdOrdenResultado(o.idOrdenLaboratorio)}>
                    Cargar/Ver resultados
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {ordenes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500">
                  {idPaciente ? 'Este paciente no tiene ordenes de laboratorio.' : 'Selecciona un paciente para ver sus ordenes.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {idOrdenResultado > 0 && ordenSeleccionada && (
          <div className="rounded-lg border bg-slate-50 p-4 space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Resultados de la orden #{ordenSeleccionada.idOrdenLaboratorio}</p>
              <p className="text-xs text-slate-600">Examen: {ordenSeleccionada.examen}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Input placeholder="Resultado" value={resultado} onChange={(e) => setResultado(e.target.value)} />
              <Input placeholder="Adjunto (url/ruta)" value={archivoAdjunto} onChange={(e) => setArchivoAdjunto(e.target.value)} className="md:col-span-2" />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIdOrdenResultado(0); setResultado(''); setArchivoAdjunto('') }}>
                Cerrar detalle
              </Button>
              <Button disabled={resultadoMutation.isPending || !resultado.trim()} onClick={() => resultadoMutation.mutate()}>
                {resultadoMutation.isPending ? 'Guardando...' : 'Registrar resultado'}
              </Button>
            </div>

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
                {resultados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-slate-500">Sin resultados para esta orden.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </main>
  )
}
