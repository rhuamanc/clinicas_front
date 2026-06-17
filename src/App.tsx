import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '@/router/ProtectedRoute'
import RequireResource from '@/router/RequireResource'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import VentasPage from '@/pages/VentasPage'
import ComprasPage from '@/pages/ComprasPage'
import ProductosPage from '@/pages/ProductosPage'
import LaboratoriosPage from '@/pages/LaboratoriosPage'
import ProveedoresPage from '@/pages/ProveedoresPage'
import UsuariosPage from '@/pages/UsuariosPage'
import RolesPage from '@/pages/RolesPage'
import ReportesPage from '@/pages/ReportesPage'
import CargosPage from '@/pages/CargosPage'
import IncentivosPage from '@/pages/IncentivosPage'
import SalidasPage from '@/pages/SalidasPage'
import PedidosPage from '@/pages/PedidosPage'
import GenericosPage from '@/pages/GenericosPage'
import DigemidPage from '@/pages/DigemidPage'
import CajaPage from '@/pages/CajaPage'
import ClinicaPage from '@/pages/ClinicaPage'
import PacientesPage from '@/pages/PacientesPage'
import MedicosPage from '@/pages/MedicosPage'
import EspecialidadesPage from '@/pages/EspecialidadesPage'
import CitasPage from '@/pages/CitasPage'
import AdmisionPage from '@/pages/AdmisionPage'
import TriajePage from '@/pages/TriajePage'
import ConsultaMedicaPage from '@/pages/ConsultaMedicaPage'
import FarmaciaIntegradaPage from '@/pages/FarmaciaIntegradaPage'
import LaboratorioClinicoPage from '@/pages/LaboratorioClinicoPage'
import ProcedimientosPage from '@/pages/ProcedimientosPage'
import HistoriaClinicaPage from '@/pages/HistoriaClinicaPage'
import ReportesClinicosPage from '@/pages/ReportesClinicosPage'
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
            <Route path="/ventas" element={<RequireResource resourceKey="ventas"><VentasPage /></RequireResource>} />
            <Route path="/compras" element={<RequireResource resourceKey="compras"><ComprasPage /></RequireResource>} />
            <Route path="/productos" element={<RequireResource resourceKey="productos"><ProductosPage /></RequireResource>} />
            <Route path="/laboratorios" element={<RequireResource resourceKey="laboratorios"><LaboratoriosPage /></RequireResource>} />
            <Route path="/proveedores" element={<RequireResource resourceKey="proveedores"><ProveedoresPage /></RequireResource>} />
            <Route path="/usuarios" element={<RequireResource resourceKey="usuarios"><UsuariosPage /></RequireResource>} />
            <Route path="/roles" element={<RequireResource resourceKey="roles"><RolesPage /></RequireResource>} />
            <Route path="/reportes" element={<RequireResource resourceKey="reportes"><ReportesPage /></RequireResource>} />
            <Route path="/cargos" element={<RequireResource resourceKey="cargos"><CargosPage /></RequireResource>} />
            <Route path="/incentivos" element={<RequireResource resourceKey="incentivos"><IncentivosPage /></RequireResource>} />
            <Route path="/salidas" element={<RequireResource resourceKey="salidas"><SalidasPage /></RequireResource>} />
            <Route path="/pedidos" element={<RequireResource resourceKey="pedidos"><PedidosPage /></RequireResource>} />
            <Route path="/genericos" element={<RequireResource resourceKey="genericos"><GenericosPage /></RequireResource>} />
            <Route path="/digemid" element={<RequireResource resourceKey="digemid_codigos"><DigemidPage /></RequireResource>} />
            <Route path="/caja" element={<RequireResource resourceKey="caja"><CajaPage /></RequireResource>} />
            <Route path="/clinica" element={<RequireResource resourceKey="pacientes"><ClinicaPage /></RequireResource>} />
            <Route path="/clinica/pacientes" element={<RequireResource resourceKey="pacientes"><PacientesPage /></RequireResource>} />
            <Route path="/clinica/medicos" element={<RequireResource resourceKey="medicos"><MedicosPage /></RequireResource>} />
            <Route path="/clinica/especialidades" element={<RequireResource resourceKey="especialidades"><EspecialidadesPage /></RequireResource>} />
            <Route path="/clinica/citas" element={<RequireResource resourceKey="citas"><CitasPage /></RequireResource>} />
            <Route path="/clinica/admision" element={<RequireResource resourceKey="admision"><AdmisionPage /></RequireResource>} />
            <Route path="/clinica/triaje" element={<RequireResource resourceKey="triaje"><TriajePage /></RequireResource>} />
            <Route path="/clinica/consulta" element={<RequireResource resourceKey="consulta_medica"><ConsultaMedicaPage /></RequireResource>} />
            <Route path="/clinica/farmacia" element={<RequireResource resourceKey="farmacia_integrada"><FarmaciaIntegradaPage /></RequireResource>} />
            <Route path="/clinica/laboratorio" element={<RequireResource resourceKey="laboratorio_clinico"><LaboratorioClinicoPage /></RequireResource>} />
            <Route path="/clinica/procedimientos" element={<RequireResource resourceKey="procedimientos"><ProcedimientosPage /></RequireResource>} />
            <Route path="/clinica/historia" element={<RequireResource resourceKey="historia_clinica"><HistoriaClinicaPage /></RequireResource>} />
            <Route path="/clinica/reportes" element={<RequireResource resourceKey="reportes"><ReportesClinicosPage /></RequireResource>} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  )
}
