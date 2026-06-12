import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import Sidebar from './Sidebar'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/ventas', label: 'Ventas' },
  { to: '/compras', label: 'Compras' },
  { to: '/productos', label: 'Productos' },
  { to: '/laboratorios', label: 'Laboratorios' },
  { to: '/proveedores', label: 'Proveedores' },
  { to: '/usuarios', label: 'Usuarios' },
  { to: '/reportes', label: 'Reportes' },
  { to: '/cargos', label: 'Cargos' },
  { to: '/incentivos', label: 'Incentivos' },
  { to: '/salidas', label: 'Salidas' },
  { to: '/pedidos', label: 'Pedidos' },
  { to: '/genericos', label: 'Genericos' },
  { to: '/digemid', label: 'Digemid' },
  { to: '/caja', label: 'Caja' },
]

export default function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const nombre = useAuthStore((s) => s.nombre)
  const logout = useAuthStore((s) => s.logout)
  function salir() {
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
