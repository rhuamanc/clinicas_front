import api from '@/api/axios'

export interface PacientePayload {
  nombres: string
  apellidos: string
  dni: string
  telefono?: string
  direccion?: string
  fechaNacimiento?: string
  sexo?: string
  alergias?: string
  antecedentes?: string
  contactoEmergenciaNombre?: string
  contactoEmergenciaTelefono?: string
}

export interface Paciente {
  idPaciente: number
  nombres: string
  apellidos: string
  dni: string
  telefono?: string
  direccion?: string
  fechaNacimiento?: string
  sexo?: string
  alergias?: string
  antecedentes?: string
  contactoEmergenciaNombre?: string
  contactoEmergenciaTelefono?: string
  estado: number
}

export interface Especialidad {
  idEspecialidad: number
  nombre: string
  descripcion?: string
  activa: boolean
}

export interface Medico {
  idMedico: number
  nombres: string
  apellidos: string
  cmp: string
  telefono?: string
  email?: string
  consultorio?: string
  activo: boolean
  especialidades?: Especialidad[]
}

export interface MedicoPayload {
  nombres: string
  apellidos: string
  cmp: string
  telefono?: string
  email?: string
  consultorio?: string
  horarioInicio?: string
  horarioFin?: string
  activo?: boolean
  idsEspecialidad: number[]
}

export interface CitaPayload {
  idPaciente: number
  idMedico: number
  idEspecialidad: number
  fechaHora: string
  motivo?: string
  observaciones?: string
}

export interface Cita {
  idCita: number
  fechaHora: string
  estado: string
  motivo?: string
  observaciones?: string
  paciente: Paciente
  medico: Medico
  especialidad: Especialidad
}

export interface Admision {
  idAdmision: number
  fechaLlegada: string
  tipoIngreso: string
  estado: string
  derivacion: string
  paciente: Paciente
  cita?: Cita
}

export interface AdmisionPayload {
  idPaciente: number
  idCita?: number
  tipoIngreso?: string
  derivacion?: string
}

export interface Triaje {
  idTriaje: number
  fechaRegistro: string
  pesoKg?: number
  tallaM?: number
  presionArterial?: string
  temperatura?: number
  frecuenciaCardiaca?: number
  saturacionOxigeno?: number
  imc?: number
  motivoConsulta?: string
  admision: Admision
}

export interface TriajePayload {
  idAdmision: number
  pesoKg?: number
  tallaM?: number
  presionArterial?: string
  temperatura?: number
  frecuenciaCardiaca?: number
  saturacionOxigeno?: number
  motivoConsulta?: string
}

export interface Atencion {
  idAtencion: number
  fechaAtencion: string
  sintomas?: string
  examenFisico?: string
  tratamiento?: string
  evolucion?: string
  observaciones?: string
  estado: string
  admision: Admision
  medico: Medico
}

export interface AtencionPayload {
  idAdmision: number
  idMedico: number
  idUsuarioMedico?: number
  sintomas?: string
  examenFisico?: string
  tratamiento?: string
  evolucion?: string
  observaciones?: string
}

export interface Diagnostico {
  idDiagnosticoAtencion: number
  codigoCie10?: string
  descripcion: string
  tipo: string
}

export interface DiagnosticoPayload {
  codigoCie10?: string
  descripcion: string
  tipo?: string
}

export interface RecetaDetallePayload {
  idProducto?: number
  medicamento: string
  cantidad: number
  dosis?: string
  frecuencia?: string
  duracion?: string
  indicaciones?: string
}

export interface RecetaPayload {
  observaciones?: string
  detalles: RecetaDetallePayload[]
}

export interface RecetaPendiente {
  idReceta: number
  estado: string
  fechaReceta: string
  atencion: {
    idAtencion: number
    admision: {
      paciente: {
        idPaciente: number
        nombres: string
        apellidos: string
      }
    }
  }
}

export interface RecetaPendienteDetalle {
  idReceta: number
  estado: string
  fechaReceta: string
  paciente: {
    idPaciente: number
    nombres: string
    apellidos: string
    dni?: string
  }
  detalles: Array<{
    idRecetaDetalle: number
    idProducto: number | null
    nombreProducto: string
    medicamento: string
    cantidad: number
    precioUnitario: number
    dosis?: string
    frecuencia?: string
    duracion?: string
    indicaciones?: string
  }>
}

export interface LaboratorioOrden {
  idOrdenLaboratorio: number
  examen: string
  precioExamen?: number
  estado: string
  fechaOrden: string
  fechaEntrega?: string
  observaciones?: string
  examenCatalogo?: ExamenLaboratorio
  atencion: Atencion
}

export interface LaboratorioOrdenPayload {
  examen?: string
  idExamen?: number
  observaciones?: string
}

export interface ExamenLaboratorio {
  idExamen: number
  codigo: string
  nombre: string
  descripcion?: string
  areaLaboratorio: string
  precio: number
  tiempoEntrega: string
  requiereAyuno: boolean
  requiereMuestraEspecial: boolean
  indicacionesPaciente?: string
  activo: boolean
  fechaRegistro: string
}

export interface ExamenLaboratorioPayload {
  codigo: string
  nombre: string
  descripcion?: string
  areaLaboratorio: string
  precio: number
  tiempoEntrega: string
  requiereAyuno?: boolean
  requiereMuestraEspecial?: boolean
  indicacionesPaciente?: string
  activo?: boolean
}

export interface ExamenLaboratorioPage {
  content: ExamenLaboratorio[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface AtencionResumen {
  atencion: Atencion
  triaje: Triaje | null
  ordenesLaboratorio: LaboratorioOrden[]
}

export interface LaboratorioResultado {
  idResultadoLaboratorio: number
  resultado: string
  archivoAdjunto?: string
  fechaResultado: string
}

export interface LaboratorioResultadoPayload {
  resultado: string
  archivoAdjunto?: string
}

export interface Procedimiento {
  idProcedimientoAtencion: number
  procedimiento: string
  detalle?: string
  tarifa?: number
  estado: string
  fechaRegistro: string
}

export interface ProcedimientoPayload {
  procedimiento: string
  detalle?: string
  tarifa?: number
  estado?: string
}

export interface HistoriaClinica {
  paciente: Paciente
  atenciones: Atencion[]
  recetas: Array<{ idReceta: number; estado: string; fechaReceta: string }>
  laboratorio: LaboratorioOrden[]
  eventos: Array<{ idHistoriaEvento: number; tipoEvento: string; descripcion: string; fechaEvento: string }>
}

export async function listarPacientes(q?: string) {
  const { data } = await api.get<Paciente[]>('/clinica/pacientes', { params: q ? { q } : undefined })
  return data
}

export async function crearPaciente(payload: PacientePayload) {
  const { data } = await api.post<Paciente>('/clinica/pacientes', payload)
  return data
}

export async function actualizarPaciente(idPaciente: number, payload: PacientePayload) {
  const { data } = await api.put<Paciente>(`/clinica/pacientes/${idPaciente}`, payload)
  return data
}

export async function listarEspecialidades() {
  const { data } = await api.get<Especialidad[]>('/clinica/especialidades')
  return data
}

export async function crearEspecialidad(payload: Pick<Especialidad, 'nombre' | 'descripcion'>) {
  const { data } = await api.post<Especialidad>('/clinica/especialidades', payload)
  return data
}

export async function listarMedicos() {
  const { data } = await api.get<Medico[]>('/clinica/medicos')
  return data
}

export async function crearMedico(payload: MedicoPayload) {
  const { data } = await api.post<Medico>('/clinica/medicos', payload)
  return data
}

export async function actualizarMedico(idMedico: number, payload: MedicoPayload) {
  const { data } = await api.put<Medico>(`/clinica/medicos/${idMedico}`, payload)
  return data
}

export async function crearCita(payload: CitaPayload) {
  const { data } = await api.post<Cita>('/clinica/citas', payload)
  return data
}

export async function listarCitasDia(fecha: string) {
  const { data } = await api.get<Cita[]>('/clinica/citas', { params: { fecha } })
  return data
}

export async function cambiarEstadoCita(idCita: number, estado: string, fechaHora?: string) {
  const { data } = await api.put<Cita>(`/clinica/citas/${idCita}/estado`, { estado, fechaHora })
  return data
}

export async function reprogramarCita(idCita: number, fechaHora: string) {
  const { data } = await api.put<Cita>(`/clinica/citas/${idCita}/estado`, { estado: 'REPROGRAMADA', fechaHora })
  return data
}

export async function listarAdmisiones(estado?: string) {
  const { data } = await api.get<Admision[]>('/clinica/admisiones', { params: estado ? { estado } : undefined })
  return data
}

export async function registrarAdmision(payload: AdmisionPayload) {
  const { data } = await api.post<Admision>('/clinica/admisiones', payload)
  return data
}

export async function listarTriajes(idAdmision?: number) {
  const { data } = await api.get<Triaje[]>('/clinica/triajes', { params: idAdmision ? { idAdmision } : undefined })
  return data
}

export async function registrarTriaje(payload: TriajePayload) {
  const { data } = await api.post<Triaje>('/clinica/triajes', payload)
  return data
}

export async function listarAtenciones(idPaciente?: number) {
  const { data } = await api.get<Atencion[]>('/clinica/atenciones', { params: idPaciente ? { idPaciente } : undefined })
  return data
}

export async function obtenerResumenAtencion(idAtencion: number) {
  const { data } = await api.get<AtencionResumen>(`/clinica/atenciones/${idAtencion}/resumen`)
  return data
}

export async function iniciarAtencion(payload: AtencionPayload) {
  const { data } = await api.post<Atencion>('/clinica/atenciones', payload)
  return data
}

export async function listarDiagnosticosPorAtencion(idAtencion: number) {
  const { data } = await api.get<Diagnostico[]>(`/clinica/atenciones/${idAtencion}/diagnosticos`)
  return data
}

export async function registrarDiagnostico(idAtencion: number, payload: DiagnosticoPayload) {
  const { data } = await api.post<Diagnostico>(`/clinica/atenciones/${idAtencion}/diagnosticos`, payload)
  return data
}

export async function crearReceta(idAtencion: number, payload: RecetaPayload) {
  const { data } = await api.post(`/clinica/atenciones/${idAtencion}/recetas`, payload)
  return data
}

export async function listarRecetasPendientes(idPaciente?: number) {
  const params: Record<string, number> = {}
  if (idPaciente) params.idPaciente = idPaciente
  const { data } = await api.get<RecetaPendiente[]>('/clinica/recetas/pendientes', { params })
  return data
}

export async function obtenerDetalleRecetaPendiente(idReceta: number) {
  const { data } = await api.get<RecetaPendienteDetalle>(`/clinica/recetas/${idReceta}/detalle`)
  return data
}

export async function dispensarReceta(idReceta: number) {
  const { data } = await api.post(`/clinica/recetas/${idReceta}/dispensar`)
  return data
}

export async function marcarRecetaDispensadaDesdeVenta(idReceta: number, idVenta?: number) {
  const params: Record<string, number> = {}
  if (idVenta) params.idVenta = idVenta
  const { data } = await api.post(`/clinica/recetas/${idReceta}/marcar-dispensada`, undefined, { params })
  return data
}

export async function crearOrdenLaboratorio(idAtencion: number, payload: LaboratorioOrdenPayload) {
  const { data } = await api.post<LaboratorioOrden>(`/clinica/atenciones/${idAtencion}/laboratorio-ordenes`, payload)
  return data
}

export async function listarExamenesLaboratorio(params?: {
  activo?: boolean
  area?: string
  q?: string
  page?: number
  size?: number
}) {
  const { data } = await api.get<ExamenLaboratorioPage>('/clinica/examenes-laboratorio', { params })
  return data
}

export async function obtenerExamenLaboratorio(idExamen: number) {
  const { data } = await api.get<ExamenLaboratorio>(`/clinica/examenes-laboratorio/${idExamen}`)
  return data
}

export async function crearExamenLaboratorio(payload: ExamenLaboratorioPayload) {
  const { data } = await api.post<ExamenLaboratorio>('/clinica/examenes-laboratorio', payload)
  return data
}

export async function actualizarExamenLaboratorio(idExamen: number, payload: ExamenLaboratorioPayload) {
  const { data } = await api.put<ExamenLaboratorio>(`/clinica/examenes-laboratorio/${idExamen}`, payload)
  return data
}

export async function activarExamenLaboratorio(idExamen: number) {
  const { data } = await api.put<ExamenLaboratorio>(`/clinica/examenes-laboratorio/${idExamen}/activar`)
  return data
}

export async function inactivarExamenLaboratorio(idExamen: number) {
  const { data } = await api.put<ExamenLaboratorio>(`/clinica/examenes-laboratorio/${idExamen}/inactivar`)
  return data
}

export async function listarOrdenesLaboratorio(estado?: string, idPaciente?: number) {
  const params: Record<string, string | number> = {}
  if (estado) params.estado = estado
  if (idPaciente) params.idPaciente = idPaciente
  const { data } = await api.get<LaboratorioOrden[]>('/clinica/laboratorio-ordenes', { params })
  return data
}

export async function registrarResultadoLaboratorio(idOrden: number, payload: LaboratorioResultadoPayload) {
  const { data } = await api.post<LaboratorioResultado>(`/clinica/laboratorio-ordenes/${idOrden}/resultados`, payload)
  return data
}

export async function listarResultadosLaboratorio(idOrden: number) {
  const { data } = await api.get<LaboratorioResultado[]>(`/clinica/laboratorio-ordenes/${idOrden}/resultados`)
  return data
}

export async function registrarProcedimiento(idAtencion: number, payload: ProcedimientoPayload) {
  const { data } = await api.post<Procedimiento>(`/clinica/atenciones/${idAtencion}/procedimientos`, payload)
  return data
}

export async function listarProcedimientosPorAtencion(idAtencion: number) {
  const { data } = await api.get<Procedimiento[]>(`/clinica/atenciones/${idAtencion}/procedimientos`)
  return data
}

export async function obtenerHistoriaClinica(idPaciente: number) {
  const { data } = await api.get<HistoriaClinica>(`/clinica/pacientes/${idPaciente}/historia`)
  return data
}

export async function obtenerResumenClinico(fecha: string) {
  const { data } = await api.get('/clinica/reportes/resumen', { params: { fecha } })
  return data
}

export async function obtenerProduccionMedica(fecha: string) {
  const { data } = await api.get<Array<{ idMedico: number; medico: string; cmp: string; atenciones: number }>>('/clinica/reportes/produccion-medica', { params: { fecha } })
  return data
}

export async function obtenerAtencionesEspecialidad(fecha: string) {
  const { data } = await api.get<Array<{ especialidad: string; atenciones: number }>>('/clinica/reportes/atenciones-especialidad', { params: { fecha } })
  return data
}

export async function obtenerRecetasDispensadas(fecha: string) {
  const { data } = await api.get<{ fecha: string; recetasDispensadas: number; pacientesUnicos: number }>('/clinica/reportes/recetas-dispensadas', { params: { fecha } })
  return data
}
