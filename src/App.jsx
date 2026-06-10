import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Auth
import Login from './pages/auth/Login';

// Layout
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Dashboards
import DashboardLider from './pages/dashboard/DashboardLider';
import DashboardSupervisorSectorial from './pages/dashboard/DashboardSupervisorSectorial';
import PanelConsolidadoAdmin from './pages/dashboard/PanelConsolidadoAdmin';
import DashboardGeneral from './pages/dashboard/DashboardGeneral';
//import DashboardTesorero from './pages/dashboard/DashboardTesorero';
import DashboardAdmin from './pages/dashboard/DashboardAdmin';
import PanelFinanzasAdmin from './pages/dashboard/PanelFinanzasAdmin';

// Formularios
import ReporteForm from './pages/reportes/ReporteForm';
import ReporteEditForm from './pages/reportes/ReporteEditForm';
import ReporteSectorialList from './pages/reportes/ReporteSectorialList';
import ReporteSectorialForm from './pages/reportes/ReporteSectorialForm';
import ReporteSectorialDetail from './pages/reportes/ReporteSectorialDetail';

const RoleBasedDashboard = () => {
  const { user } = useAuthStore(); // obtén el rol del usuario
  const role = user?.rol;

  if (role === 'ADMIN') return <PanelConsolidadoAdmin />;
  if (role === 'SUP_SECTORIAL') return <DashboardSupervisorSectorial />;
  return <div>No autorizado</div>;
}

// Componente que redirige al dashboard según el rol
const RoleRedirect = () => {
  const { user, isAuthenticated } = useAuthStore();
  const roleRoutes = {
    LIDER: '/lider/dashboard',
    SUP_SECTORIAL: '/supervisor/dashboard',
    SUP_GENERAL: '/general/dashboard',
    FINANZAS: '/finanzas/dashboard',
    ADMIN: '/admin/dashboard',
  };
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const destino = roleRoutes[user?.rol?.toUpperCase()] || '/login';
  return <Navigate to={destino} replace />;
};

function App() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />

      {/* Redirección inteligente según rol */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RoleRedirect />} />
        <Route path="/dashboard" element={<RoleRedirect />} />
      </Route>

      {/* ── LÍDER ── */}
      <Route element={<ProtectedRoute allowedRoles={['LIDER', 'ADMIN']} />}>
        <Route element={<MainLayout />}>
          <Route path="/lider/dashboard" element={<DashboardLider />} />
          <Route path="/lider/reporte/nuevo" element={<ReporteForm />} />
          <Route path="/lider/reporte/editar/:id" element={<ReporteEditForm />} />
        </Route>
      </Route>

      {/* ── SUPERVISOR SECTORIAL ── */}

      <Route element={<ProtectedRoute allowedRoles={['SUP_SECTORIAL', 'ADMIN']} />}>
        <Route element={<MainLayout />}>
          <Route path="/supervisor/dashboard" element={<RoleBasedDashboard />} />
          <Route path="/supervisor/reporte-sectorial" element={<ReporteSectorialList />} />
          <Route path="/supervisor/reporte-sectorial/nuevo" element={<ReporteSectorialForm />} />
          <Route path="/supervisor/reporte-sectorial/editar/:id" element={<ReporteSectorialForm />} />
          <Route path="/supervisor/reporte-sectorial/ver/:id" element={<ReporteSectorialDetail />} />
        </Route>
      </Route>

      {/* ── SUPERVISOR GENERAL ── */}
      <Route element={<ProtectedRoute allowedRoles={['SUP_GENERAL', 'ADMIN']} />}>
        <Route element={<MainLayout />}>
          <Route path="/general/dashboard" element={<DashboardGeneral />} />
        </Route>
      </Route>

      {/* ── TESORERO ── */}
      <Route element={<ProtectedRoute allowedRoles={['FINANZAS', 'TESORERO', 'ADMIN']} />}>
        <Route element={<MainLayout />}>
          <Route path="/finanzas/dashboard" element={<PanelFinanzasAdmin />} />{/*DashboardTesorero*/}
        </Route>
      </Route>

      {/* ── ADMIN ── */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<MainLayout />}>
          <Route path="/admin/dashboard" element={<DashboardAdmin />} />
        </Route>
      </Route>

      {/* 404 → redirige */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes >
  );
}

export default App;
