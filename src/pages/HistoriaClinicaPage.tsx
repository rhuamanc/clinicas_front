import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listarPacientes, obtenerHistoriaClinica } from '@/api/clinicaApi'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function HistoriaClinicaPage() {
  const [idPaciente, setIdPaciente] = useState(0)

  const pacientesQuery = useQuery({ queryKey: ['clinica', 'pacientes'], queryFn: () => listarPacientes() })
  const historiaQuery = useQuery({
    queryKey: ['clinica', 'historia', idPaciente],
    queryFn: () => obtenerHistoriaClinica(idPaciente),
    enabled: idPaciente > 0,
  })

  const pacientes = pacientesQuery.data ?? []
  const historia = historiaQuery.data

  return (
    <main className="p-6 space-y-6">
      <section className="rounded-xl border bg-white p-5">
        <h1 className="text-2xl font-semibold text-slate-900">Historia Clinica</h1>
        <p className="text-sm text-slate-600 mt-1">Vista consolidada de eventos clinicos por paciente.</p>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <select className="h-10 rounded-md border px-3 max-w-lg" value={idPaciente} onChange={(e) => setIdPaciente(Number(e.target.value))}>
          <option value={0}>Seleccionar paciente</option>
          {pacientes.map((p) => <option key={p.idPaciente} value={p.idPaciente}>{p.apellidos}, {p.nombres}</option>)}
        </select>

        {historia && (
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
              <Info title="Paciente" value={`${historia.paciente.apellidos}, ${historia.paciente.nombres}`} />
              <Info title="Atenciones" value={String(historia.atenciones.length)} />
              <Info title="Recetas" value={String(historia.recetas.length)} />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Eventos</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripcion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historia.eventos.map((e) => (
                    <TableRow key={e.idHistoriaEvento}>
                      <TableCell>{new Date(e.fechaEvento).toLocaleString()}</TableCell>
                      <TableCell>{e.tipoEvento}</TableCell>
                      <TableCell>{e.descripcion}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Laboratorio</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Examen</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historia.laboratorio.map((l) => (
                    <TableRow key={l.idOrdenLaboratorio}>
                      <TableCell>{new Date(l.fechaOrden).toLocaleString()}</TableCell>
                      <TableCell>{l.examen}</TableCell>
                      <TableCell>{l.estado}</TableCell>
                    </TableRow>
                  ))}
                  {historia.laboratorio.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-slate-500">Sin ordenes.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-md border bg-white p-3">
      <p className="text-xs uppercase text-slate-500">{title}</p>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
    </article>
  )
}
