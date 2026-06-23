import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  listarPacientes,
  listarResultadosLaboratorio,
  obtenerDetalleRecetaPendiente,
  obtenerHistoriaClinica,
  type Atencion,
  type LaboratorioOrden,
  type RecetaPendienteDetalle,
} from '@/api/clinicaApi'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError } from '@/store/notificationStore'

type DetalleModal = { tipo: 'EVENTO'; data: any } | null

export default function HistoriaClinicaPage() {
  const [idPaciente, setIdPaciente] = useState(0)
  const [detalleModal, setDetalleModal] = useState<DetalleModal>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [detalleReceta, setDetalleReceta] = useState<RecetaPendienteDetalle | null>(null)
  const [detalleLaboratorio, setDetalleLaboratorio] = useState<{ orden: LaboratorioOrden; resultados: any[] } | null>(null)
  const [detalleAtencion, setDetalleAtencion] = useState<Atencion | null>(null)

  const pacientesQuery = useQuery({ queryKey: ['clinica', 'pacientes'], queryFn: () => listarPacientes() })
  const historiaQuery = useQuery({
    queryKey: ['clinica', 'historia', idPaciente],
    queryFn: () => obtenerHistoriaClinica(idPaciente),
    enabled: idPaciente > 0,
  })

  const pacientes = pacientesQuery.data ?? []
  const historia = historiaQuery.data

  const recetas = historia?.recetas ?? []
  const ordenesLaboratorio = historia?.laboratorio ?? []
  const atenciones = historia?.atenciones ?? []

  function abrirDetalleEvento(evento: any) {
    setDetalleModal({ tipo: 'EVENTO', data: evento })
    setDetalleReceta(null)
    setDetalleLaboratorio(null)
    setDetalleAtencion(null)
  }

  function imprimirDocumento(titulo: string, contenidoHtml: string) {
    const ventana = window.open('', '_blank', 'width=900,height=700')
    if (!ventana) return
    ventana.document.write(`
      <html>
        <head>
          <title>${titulo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { font-size: 20px; margin-bottom: 8px; }
            h2 { font-size: 16px; margin: 18px 0 8px; }
            p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; text-align: left; }
            .muted { color: #475569; }
          </style>
        </head>
        <body>
          ${contenidoHtml}
        </body>
      </html>
    `)
    ventana.document.close()
    ventana.focus()
    ventana.print()
  }

  async function cargarDetalleReceta(idReceta: number) {
    try {
      setCargandoDetalle(true)
      const detalle = await obtenerDetalleRecetaPendiente(idReceta)
      setDetalleReceta(detalle)
    } catch (error) {
      notifyError(getApiErrorMessage(error, 'No se pudo cargar el detalle de receta'))
    } finally {
      setCargandoDetalle(false)
    }
  }

  async function cargarDetalleLaboratorio(orden: LaboratorioOrden) {
    try {
      setCargandoDetalle(true)
      const resultados = await listarResultadosLaboratorio(orden.idOrdenLaboratorio)
      setDetalleLaboratorio({ orden, resultados })
    } catch (error) {
      notifyError(getApiErrorMessage(error, 'No se pudo cargar el detalle de laboratorio'))
    } finally {
      setCargandoDetalle(false)
    }
  }

  function imprimirAtencion(atencion: Atencion) {
    imprimirDocumento(
      `Atencion ${atencion.idAtencion}`,
      `
      <h1>Resumen de Atencion #${atencion.idAtencion}</h1>
      <p class="muted">Fecha: ${new Date(atencion.fechaAtencion).toLocaleString()}</p>
      <p><strong>Paciente:</strong> ${atencion.admision?.paciente?.apellidos ?? ''}, ${atencion.admision?.paciente?.nombres ?? ''}</p>
      <p><strong>Medico:</strong> ${atencion.medico?.apellidos ?? ''}, ${atencion.medico?.nombres ?? ''}</p>
      <h2>Detalle Clinico</h2>
      <p><strong>Sintomas:</strong> ${atencion.sintomas ?? '-'}</p>
      <p><strong>Examen fisico:</strong> ${atencion.examenFisico ?? '-'}</p>
      <p><strong>Tratamiento:</strong> ${atencion.tratamiento ?? '-'}</p>
      <p><strong>Evolucion:</strong> ${atencion.evolucion ?? '-'}</p>
      <p><strong>Observaciones:</strong> ${atencion.observaciones ?? '-'}</p>
      `
    )
  }

  function imprimirReceta(detalle: RecetaPendienteDetalle) {
    const filas = detalle.detalles
      .map(
        (item) => `
          <tr>
            <td>${item.nombreProducto ?? item.medicamento}</td>
            <td>${item.cantidad}</td>
            <td>${item.dosis ?? '-'}</td>
            <td>${item.frecuencia ?? '-'}</td>
            <td>${item.duracion ?? '-'}</td>
            <td>${item.indicaciones ?? '-'}</td>
          </tr>
        `
      )
      .join('')

    imprimirDocumento(
      `Receta ${detalle.idReceta}`,
      `
      <h1>Receta Medica #${detalle.idReceta}</h1>
      <p class="muted">Fecha: ${new Date(detalle.fechaReceta).toLocaleString()}</p>
      <p><strong>Paciente:</strong> ${detalle.paciente.apellidos}, ${detalle.paciente.nombres}</p>
      <p><strong>DNI:</strong> ${detalle.paciente.dni ?? '-'}</p>
      <p><strong>Estado:</strong> ${detalle.estado}</p>
      <h2>Medicamentos</h2>
      <table>
        <thead>
          <tr>
            <th>Medicamento</th>
            <th>Cant.</th>
            <th>Dosis</th>
            <th>Frecuencia</th>
            <th>Duracion</th>
            <th>Indicaciones</th>
          </tr>
        </thead>
        <tbody>
          ${filas}
        </tbody>
      </table>
      `
    )
  }

  function imprimirLaboratorio(orden: LaboratorioOrden, resultados: any[]) {
    const filas = resultados
      .map(
        (r) => `
          <tr>
            <td>${new Date(r.fechaResultado).toLocaleString()}</td>
            <td>${r.resultado}</td>
            <td>${r.archivoAdjunto ?? '-'}</td>
          </tr>
        `
      )
      .join('')

    imprimirDocumento(
      `Orden ${orden.idOrdenLaboratorio}`,
      `
      <h1>Orden de Laboratorio #${orden.idOrdenLaboratorio}</h1>
      <p class="muted">Fecha orden: ${new Date(orden.fechaOrden).toLocaleString()}</p>
      <p><strong>Examen:</strong> ${orden.examen}</p>
      <p><strong>Estado:</strong> ${orden.estado}</p>
      <p><strong>Observaciones:</strong> ${orden.observaciones ?? '-'}</p>
      <h2>Resultados</h2>
      <table>
        <thead><tr><th>Fecha</th><th>Resultado</th><th>Adjunto</th></tr></thead>
        <tbody>${filas || '<tr><td colspan="3">Sin resultados</td></tr>'}</tbody>
      </table>
      `
    )
  }

  return (
    <main className="p-6 space-y-6">
      <section className="rounded-xl border bg-white p-5">
        <h1 className="text-2xl font-semibold text-slate-900">Historia Clinica</h1>
        <p className="text-sm text-slate-600 mt-1">Vista consolidada de eventos clinicos por paciente.</p>
      </section>

      <section className="rounded-xl border bg-white p-5 space-y-4">
        <select className="h-10 rounded-md border px-3 max-w-lg" value={idPaciente} onChange={(e) => setIdPaciente(Number(e.target.value))}>
          <option value={0}>Seleccionar paciente</option>
          {pacientes.map((p) => (
            <option key={p.idPaciente} value={p.idPaciente}>
              {p.apellidos}, {p.nombres}
            </option>
          ))}
        </select>

        {historia && (
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
              <Info title="Paciente" value={`${historia.paciente.apellidos}, ${historia.paciente.nombres}`} />
              <Info title="Atenciones" value={String(historia.atenciones.length)} />
              <Info title="Recetas" value={String(historia.recetas.length)} />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Listado de Eventos</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historia.eventos.map((e) => (
                    <TableRow key={e.idHistoriaEvento}>
                      <TableCell>{new Date(e.fechaEvento).toLocaleString()}</TableCell>
                      <TableCell>{e.tipoEvento}</TableCell>
                      <TableCell>{e.descripcion}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => abrirDetalleEvento(e)}>
                          Ver detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {historia.eventos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-slate-500">
                        Sin eventos clinicos.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </section>

      {detalleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white p-5 shadow-xl max-h-[90vh] overflow-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Detalle de Evento</h3>
              <Button variant="outline" onClick={() => setDetalleModal(null)}>
                Cerrar
              </Button>
            </div>

            <div className="space-y-4 text-sm text-slate-700">
              <p><strong>Fecha:</strong> {new Date(detalleModal.data.fechaEvento).toLocaleString()}</p>
              <p><strong>Tipo:</strong> {detalleModal.data.tipoEvento}</p>
              <p><strong>Descripcion:</strong> {detalleModal.data.descripcion}</p>

              {(detalleModal.data.tipoEvento === 'CONSULTA' || detalleModal.data.tipoEvento === 'DIAGNOSTICO' || detalleModal.data.tipoEvento === 'TRIAJE' || detalleModal.data.tipoEvento === 'PROCEDIMIENTO') && (
                <div className="space-y-2">
                  <p className="font-semibold text-slate-800">Atenciones relacionadas</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Medico</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {atenciones.map((a) => (
                        <TableRow key={a.idAtencion}>
                          <TableCell>{a.idAtencion}</TableCell>
                          <TableCell>{new Date(a.fechaAtencion).toLocaleString()}</TableCell>
                          <TableCell>{a.medico?.apellidos}, {a.medico?.nombres}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => setDetalleAtencion(a)}>
                              Ver detalle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {detalleAtencion && (
                    <div className="rounded-md border bg-slate-50 p-3 space-y-1">
                      <p><strong>Sintomas:</strong> {detalleAtencion.sintomas ?? '-'}</p>
                      <p><strong>Examen fisico:</strong> {detalleAtencion.examenFisico ?? '-'}</p>
                      <p><strong>Tratamiento:</strong> {detalleAtencion.tratamiento ?? '-'}</p>
                      <p><strong>Evolucion:</strong> {detalleAtencion.evolucion ?? '-'}</p>
                      <p><strong>Observaciones:</strong> {detalleAtencion.observaciones ?? '-'}</p>
                      <div className="pt-1 flex justify-end">
                        <Button variant="outline" onClick={() => imprimirAtencion(detalleAtencion)}>
                          Imprimir atencion
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {detalleModal.data.tipoEvento === 'RECETA' && (
                <div className="space-y-2">
                  <p className="font-semibold text-slate-800">Recetas relacionadas</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recetas.map((r) => (
                        <TableRow key={r.idReceta}>
                          <TableCell>{r.idReceta}</TableCell>
                          <TableCell>{new Date(r.fechaReceta).toLocaleString()}</TableCell>
                          <TableCell>{r.estado}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" disabled={cargandoDetalle} onClick={() => void cargarDetalleReceta(r.idReceta)}>
                              Ver detalle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {detalleReceta && (
                    <div className="rounded-md border bg-slate-50 p-3 space-y-2">
                      <p><strong>Paciente:</strong> {detalleReceta.paciente.apellidos}, {detalleReceta.paciente.nombres}</p>
                      <p><strong>DNI:</strong> {detalleReceta.paciente.dni ?? '-'}</p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Medicamento</TableHead>
                            <TableHead>Cant.</TableHead>
                            <TableHead>Dosis</TableHead>
                            <TableHead>Frecuencia</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detalleReceta.detalles.map((item) => (
                            <TableRow key={item.idRecetaDetalle}>
                              <TableCell>{item.nombreProducto ?? item.medicamento}</TableCell>
                              <TableCell>{item.cantidad}</TableCell>
                              <TableCell>{item.dosis ?? '-'}</TableCell>
                              <TableCell>{item.frecuencia ?? '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="pt-1 flex justify-end">
                        <Button variant="outline" onClick={() => imprimirReceta(detalleReceta)}>
                          Imprimir receta
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {detalleModal.data.tipoEvento === 'LABORATORIO' && (
                <div className="space-y-2">
                  <p className="font-semibold text-slate-800">Ordenes de laboratorio relacionadas</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Examen</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordenesLaboratorio.map((o) => (
                        <TableRow key={o.idOrdenLaboratorio}>
                          <TableCell>{o.idOrdenLaboratorio}</TableCell>
                          <TableCell>{new Date(o.fechaOrden).toLocaleString()}</TableCell>
                          <TableCell>{o.examen}</TableCell>
                          <TableCell>{o.estado}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" disabled={cargandoDetalle} onClick={() => void cargarDetalleLaboratorio(o)}>
                              Ver detalle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {detalleLaboratorio && (
                    <div className="rounded-md border bg-slate-50 p-3 space-y-2">
                      <p><strong>Examen:</strong> {detalleLaboratorio.orden.examen}</p>
                      <p><strong>Observaciones:</strong> {detalleLaboratorio.orden.observaciones ?? '-'}</p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Resultado</TableHead>
                            <TableHead>Adjunto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detalleLaboratorio.resultados.map((r) => (
                            <TableRow key={r.idResultadoLaboratorio}>
                              <TableCell>{new Date(r.fechaResultado).toLocaleString()}</TableCell>
                              <TableCell>{r.resultado}</TableCell>
                              <TableCell>{r.archivoAdjunto ?? '-'}</TableCell>
                            </TableRow>
                          ))}
                          {detalleLaboratorio.resultados.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-slate-500">Sin resultados.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      <div className="pt-1 flex justify-end">
                        <Button variant="outline" onClick={() => imprimirLaboratorio(detalleLaboratorio.orden, detalleLaboratorio.resultados)}>
                          Imprimir orden y resultados
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {detalleModal.data.tipoEvento !== 'RECETA' &&
                detalleModal.data.tipoEvento !== 'LABORATORIO' &&
                detalleModal.data.tipoEvento !== 'CONSULTA' &&
                detalleModal.data.tipoEvento !== 'DIAGNOSTICO' &&
                detalleModal.data.tipoEvento !== 'TRIAJE' &&
                detalleModal.data.tipoEvento !== 'PROCEDIMIENTO' && (
                  <div className="pt-2 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() =>
                        imprimirDocumento(
                          `Evento ${detalleModal.data.idHistoriaEvento}`,
                          `
                          <h1>Detalle de Evento Clinico</h1>
                          <p><strong>Fecha:</strong> ${new Date(detalleModal.data.fechaEvento).toLocaleString()}</p>
                          <p><strong>Tipo:</strong> ${detalleModal.data.tipoEvento}</p>
                          <p><strong>Descripcion:</strong> ${detalleModal.data.descripcion}</p>
                          `
                        )
                      }
                    >
                      Imprimir evento
                    </Button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
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
