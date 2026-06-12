import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '@/router/ProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import VentasPage from '@/pages/VentasPage'
import ComprasPage from '@/pages/ComprasPage'
import ProductosPage from '@/pages/ProductosPage'
import LaboratoriosPage from '@/pages/LaboratoriosPage'
import ProveedoresPage from '@/pages/ProveedoresPage'
import UsuariosPage from '@/pages/UsuariosPage'
import ReportesPage from '@/pages/ReportesPage'
import CargosPage from '@/pages/CargosPage'
import IncentivosPage from '@/pages/IncentivosPage'
import SalidasPage from '@/pages/SalidasPage'
import PedidosPage from '@/pages/PedidosPage'
import GenericosPage from '@/pages/GenericosPage'
import DigemidPage from '@/pages/DigemidPage'
import CajaPage from '@/pages/CajaPage'
import AppShell from '@/components/AppShell'
import Toaster from '@/components/ui/toaster'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/ventas" element={<VentasPage />} />
            <Route path="/compras" element={<ComprasPage />} />
            <Route path="/productos" element={<ProductosPage />} />
            <Route path="/laboratorios" element={<LaboratoriosPage />} />
            <Route path="/proveedores" element={<ProveedoresPage />} />
            <Route path="/usuarios" element={<UsuariosPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
            <Route path="/cargos" element={<CargosPage />} />
            <Route path="/incentivos" element={<IncentivosPage />} />
            <Route path="/salidas" element={<SalidasPage />} />
            <Route path="/pedidos" element={<PedidosPage />} />
            <Route path="/genericos" element={<GenericosPage />} />
            <Route path="/digemid" element={<DigemidPage />} />
            <Route path="/caja" element={<CajaPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  )
}
