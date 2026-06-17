import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { obtenerAtencionesEspecialidad, obtenerProduccionMedica, obtenerRecetasDispensadas, obtenerResumenClinico } from '@/api/clinicaApi'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function ReportesClinicosPage() {
  const [fecha, setFecha] = useState(today())

  const resumenQuery = useQuery({ queryKey: ['clinica', 'reporte-resumen', fecha], queryFn: () => obtenerResumenClinico(fecha) })
  const produccionQuery = useQuery({ queryKey: ['clinica', 'reporte-produccion', fecha], queryFn: () => obtenerProduccionMedica(fecha) })
  const especialidadQuery = useQuery({ queryKey: ['clinica', 'reporte-especialidad', fecha], queryFn: () => obtenerAtencionesEspecialidad(fecha) })
  const recetasQuery = useQuery({ queryKey: ['clinica', 'reporte-recetas', fecha], queryFn: () => obtenerRecetasDispensadas(fecha) })

  const resumen = resumenQuery.data as Record<string, string | number> | undefined
  const produccion = produccionQuery.data ?? []
  const especialidad = especialidadQuery.data ?? []
  const recetas = recetasQuery.data

  return (
    <main className="p-6 space-y-6">
      <section className="rounded-xl border bg-white p-5">
        <h1 className="text-2xl font-semibold text-slate-900">Reportes Clinicos</h1>
        <p className="text-sm text-slate-600 mt-1">Produccion medica, atenciones por especialidad y recetas dispensadas.</p>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <Input type="date" className="max-w-xs" value={fecha} onChange={(e) => setFecha(e.target.value)} />

        <div className="grid gap-3 md:grid-cols-4">
          <Stat title="Citas" value={String(resumen?.citas ?? 0)} />
          <Stat title="Admisiones" value={String(resumen?.admisiones ?? 0)} />
          <Stat title="Atenciones" value={String(resumen?.atenciones ?? 0)} />
          <Stat title="Recetas Pendientes" value={String(resumen?.recetasPendientes ?? 0)} />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Produccion por medico</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medico</TableHead>
                <TableHead>CMP</TableHead>
                <TableHead>Atenciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produccion.map((p) => (
                <TableRow key={p.idMedico}>
                  <TableCell>{p.medico}</TableCell>
                  <TableCell>{p.cmp}</TableCell>
                  <TableCell>{p.atenciones}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold mb-2">Atenciones por especialidad</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Especialidad</TableHead>
                  <TableHead>Atenciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {especialidad.map((e) => (
                  <TableRow key={e.especialidad}>
                    <TableCell>{e.especialidad}</TableCell>
                    <TableCell>{e.atenciones}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Recetas dispensadas</h3>
            <div className="rounded-md border p-4 space-y-2">
              <p className="text-sm text-slate-600">Fecha: {recetas?.fecha ?? fecha}</p>
              <p className="text-xl font-semibold">Recetas: {recetas?.recetasDispensadas ?? 0}</p>
              <p className="text-sm text-slate-700">Pacientes unicos: {recetas?.pacientesUnicos ?? 0}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-md border bg-white p-3">
      <p className="text-xs uppercase text-slate-500">{title}</p>
      <p className="text-xl font-semibold text-slate-900">{value}</p>
    </article>
  )
}
