import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export interface SidebarMenuItem {
  label: string
  to?: string
  children?: SidebarMenuItem[]
  external?: boolean
}

const menu: SidebarMenuItem[] = [
  {
    label: 'Mantenimientos',
    children: [
      { label: 'Laboratorios', to: '/laboratorios' },
      { label: 'Genericos', to: '/genericos' },
      { label: 'Productos', to: '/productos' },
      { label: 'Proveedores', to: '/proveedores' },
      { label: 'Ventas', to: '/ventas' },
      { label: 'Compras', to: '/compras' },
      { label: 'Salidas', to: '/salidas' },
      { label: 'Incentivo', to: '/incentivos' },
    ],
  },
  {
    label: 'Recargas',
    children: [
      { label: 'Movistar', to: 'https://movistar.pe', external: true },
      { label: 'Claro', to: 'https://claro.pe', external: true },
      { label: 'Nextel/Entel', to: 'https://entel.pe', external: true },
    ],
  },
  {
    label: 'Usuarios',
    children: [
      { label: 'Crear Usuarios', to: '/usuarios' },
      { label: 'Mi Perfil', to: '/perfil' },
    ],
  },
  {
    label: 'Digemid',
    children: [
      { label: 'Envio de Precios', to: 'http://opmcarga.digemid.minsa.gob.pe/Default.aspx', external: true },
      { label: 'Alertas', to: 'http://www.digemid.minsa.gob.pe/Main.asp?Seccion=371', external: true },
      { label: 'Codigos', to: '/digemid' },
    ],
  },
  {
    label: 'Reportes',
    children: [
      { label: 'Cargos/Descargos', to: '/cargos' },
      { label: 'Prox. a Vencer', to: '/reportes' },
      { label: 'Compras por proveedor', to: '/reportes' },
      { label: 'Ventas', to: '/reportes' },
      { label: 'Resumen Por Mes', to: '/reportes' },
      { label: 'Pedidos', to: '/pedidos' },
      { label: 'Inventario', to: '/reportes' },
      { label: 'Incentivos', to: '/reportes' },
      { label: 'Cuadre de caja', to: '/caja' },
    ],
  },
]

export default function Sidebar() {
  const location = useLocation()
  const rol = useAuthStore((s) => s.rol)
  const nombre = useAuthStore((s) => s.nombre)
  const logout = useAuthStore((s) => s.logout)
  const [collapsed, setCollapsed] = useState<{ [key: string]: boolean }>({
    Mantenimientos: false,
    Recargas: true,
    Usuarios: true,
    Digemid: true,
    Reportes: true,
  })
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const isResizing = React.useRef(false)

  // Mouse events for resizing
  React.useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (isResizing.current) {
        setSidebarWidth(Math.max(180, Math.min(e.clientX, 400)))
      }
    }
    function onMouseUp() {
      isResizing.current = false
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // Filtro de items admin
  function isAdminItem(label: string) {
    return [
      'Crear Usuarios',
      'Cargos/Descargos',
      'Prox. a Vencer',
      'Compras por proveedor',
      'Ventas',
      'Resumen Por Mes',
      'Inventario',
      'Cuadre de caja',
    ].includes(label)
  }

  function salir() {
    logout()
    window.location.href = '/login'
  }

  if (sidebarCollapsed) {
    return (
      <aside
        className="bg-white border-r min-h-screen p-2 flex flex-col items-center select-none relative"
        style={{ width: 32 }}
      >
        <button
          className="mt-2 mb-2 p-1 rounded hover:bg-slate-100"
          title="Expandir menú"
          onClick={() => setSidebarCollapsed(false)}
        >
          <span className="text-xl">»</span>
        </button>
      </aside>
    )
  }

  return (
    <aside
      className="bg-white border-r min-h-screen p-4 relative select-none flex flex-col"
      style={{ width: sidebarWidth, transition: 'width 0.1s' }}
    >
      <div
        className="absolute top-0 right-0 h-full w-2 cursor-col-resize z-50"
        onMouseDown={() => { isResizing.current = true }}
        style={{ userSelect: 'none' }}
      />
      <button
        className="absolute -right-4 top-4 bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center shadow hover:bg-slate-300 z-50"
        title="Contraer menú"
        onClick={() => setSidebarCollapsed(true)}
        style={{ border: '1px solid #e2e8f0' }}
      >
        <span className="text-xl">«</span>
      </button>
      <nav className="flex-1">
        <ul className="space-y-2">
          {menu.map((section) => (
            <li key={section.label}>
              <button
                className="w-full flex justify-between items-center font-bold text-slate-700 mb-1 mt-4 px-1 py-1 hover:bg-slate-100 rounded"
                onClick={() => setCollapsed((c) => ({ ...c, [section.label]: !c[section.label] }))}
                aria-expanded={!collapsed[section.label]}
              >
                <span>{section.label}</span>
                <span className="ml-2">{collapsed[section.label] ? '+' : '-'}</span>
              </button>
              {!collapsed[section.label] && (
                <ul className="space-y-1">
                  {section.children?.map((item) => {
                    if (isAdminItem(item.label) && rol !== 'ADMIN') return null
                    return item.external ? (
                      <li key={item.label}>
                        <a
                          href={item.to}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-3 py-2 rounded text-slate-600 hover:bg-slate-100 text-sm"
                        >
                          {item.label}
                        </a>
                      </li>
                    ) : (
                      <li key={item.label}>
                        <Link
                          to={item.to!}
                          className={`block px-3 py-2 rounded text-sm ${
                            location.pathname === item.to
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto pt-6 border-t flex flex-col items-center">
        <span className="text-xs text-slate-500 mb-2">{nombre}</span>
        <button
          className="w-full px-3 py-2 rounded bg-red-50 text-red-700 hover:bg-red-100 text-sm font-semibold"
          onClick={salir}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
