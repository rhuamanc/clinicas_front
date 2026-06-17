export interface ResourceDefinition {
  key: string
  label: string
  description: string
  section: string
}

export const RESOURCE_DEFINITIONS: ResourceDefinition[] = [
  { key: 'laboratorios', label: 'Laboratorios', description: 'Gestionar laboratorios.', section: 'Mantenimientos' },
  { key: 'genericos', label: 'Genericos', description: 'Gestionar genericos.', section: 'Mantenimientos' },
  { key: 'productos', label: 'Productos', description: 'Gestionar productos.', section: 'Mantenimientos' },
  { key: 'proveedores', label: 'Proveedores', description: 'Gestionar proveedores.', section: 'Mantenimientos' },
  { key: 'ventas', label: 'Ventas', description: 'Registrar y consultar ventas.', section: 'Mantenimientos' },
  { key: 'compras', label: 'Compras', description: 'Registrar compras.', section: 'Mantenimientos' },
  { key: 'salidas', label: 'Salidas', description: 'Registrar salidas de stock.', section: 'Mantenimientos' },
  { key: 'incentivos', label: 'Incentivos', description: 'Gestionar incentivos.', section: 'Mantenimientos' },
  { key: 'usuarios', label: 'Usuarios', description: 'Administrar usuarios.', section: 'Usuarios' },
  { key: 'roles', label: 'Roles', description: 'Administrar roles y permisos.', section: 'Usuarios' },
  { key: 'digemid_codigos', label: 'Digemid', description: 'Acceder a codigos y enlaces Digemid.', section: 'Digemid' },
  { key: 'cargos', label: 'Cargos y Descargos', description: 'Consultar cargos y descargos.', section: 'Reportes' },
  { key: 'reportes', label: 'Reportes', description: 'Acceder a reportes generales.', section: 'Reportes' },
  { key: 'pedidos', label: 'Pedidos', description: 'Gestionar pedidos.', section: 'Reportes' },
  { key: 'caja', label: 'Cuadre de caja', description: 'Gestionar el cuadre de caja.', section: 'Reportes' },
  { key: 'pacientes', label: 'Pacientes', description: 'Registrar y gestionar pacientes.', section: 'Clinica' },
  { key: 'medicos', label: 'Medicos', description: 'Gestionar medicos y disponibilidad.', section: 'Clinica' },
  { key: 'especialidades', label: 'Especialidades', description: 'Administrar especialidades medicas.', section: 'Clinica' },
  { key: 'citas', label: 'Citas', description: 'Agendar y gestionar citas medicas.', section: 'Clinica' },
  { key: 'admision', label: 'Admision', description: 'Registrar llegada y flujo de paciente.', section: 'Clinica' },
  { key: 'triaje', label: 'Triaje', description: 'Registrar signos vitales del paciente.', section: 'Clinica' },
  { key: 'consulta_medica', label: 'Consulta Medica', description: 'Registrar atencion medica.', section: 'Clinica' },
  { key: 'diagnosticos', label: 'Diagnosticos', description: 'Registrar diagnosticos CIE-10 o manuales.', section: 'Clinica' },
  { key: 'recetas_medicas', label: 'Recetas Medicas', description: 'Emitir recetas desde consulta.', section: 'Clinica' },
  { key: 'farmacia_integrada', label: 'Farmacia Integrada', description: 'Dispensar recetas y descontar stock.', section: 'Clinica' },
  { key: 'laboratorio_clinico', label: 'Laboratorio', description: 'Gestionar ordenes y resultados de laboratorio.', section: 'Clinica' },
  { key: 'procedimientos', label: 'Procedimientos', description: 'Registrar procedimientos clinicos.', section: 'Clinica' },
  { key: 'historia_clinica', label: 'Historia Clinica', description: 'Consultar historia clinica consolidada.', section: 'Clinica' },
  { key: 'configuracion', label: 'Configuracion', description: 'Administrar catalogos y parametros clinicos.', section: 'Clinica' },
]

export const ALL_RESOURCE_KEYS = RESOURCE_DEFINITIONS.map((resource) => resource.key)

export const RESOURCE_LABELS = RESOURCE_DEFINITIONS.reduce<Record<string, string>>((acc, resource) => {
  acc[resource.key] = resource.label
  return acc
}, {})

export const RESOURCE_GROUPS = RESOURCE_DEFINITIONS.reduce<Record<string, ResourceDefinition[]>>((acc, resource) => {
  if (!acc[resource.section]) acc[resource.section] = []
  acc[resource.section].push(resource)
  return acc
}, {})

export function normalizeResources(recursos?: string[] | null): string[] {
  return Array.from(
    new Set(
      (recursos ?? [])
        .map((resource) => resource.trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b))
}

export function hasResource(recursos?: string[] | null, resourceKey?: string): boolean {
  if (!resourceKey) return true
  return normalizeResources(recursos).includes(resourceKey)
}
