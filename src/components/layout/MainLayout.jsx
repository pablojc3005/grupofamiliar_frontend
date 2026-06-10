import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import {
  LogOut, Menu, X,
  LayoutDashboard, FileText, BarChart2,
  DollarSign, Users, Settings, ChevronDown,
  Building2, Layers,
} from 'lucide-react';
import Swal from 'sweetalert2';
import logoDefault from '../../assets/logo_asambleas.png';

// Lee logo desde localStorage para permitir cambio dinámico por el admin
const getLogoUrl = () => localStorage.getItem('loginLogo') || logoDefault;

// Menú por rol
const MENU_BY_ROLE = {
  LIDER: [
    { title: 'Mi Dashboard', path: '/lider/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { title: 'Nuevo Reporte', path: '/lider/reporte/nuevo', icon: <FileText className="w-5 h-5" /> },
  ],
  SUP_SECTORIAL: [
    { title: 'Mi Sector', path: '/supervisor/dashboard', icon: <BarChart2 className="w-5 h-5" /> },
    { title: 'Reporte Sectorial', path: '/supervisor/reporte-sectorial', icon: <FileText className="w-5 h-5" /> },
  ],
  SUP_GENERAL: [
    { title: 'Vista General', path: '/general/dashboard', icon: <Layers className="w-5 h-5" /> },
  ],
  TESORERO: [
    { title: 'Finanzas', path: '/finanzas/dashboard', icon: <DollarSign className="w-5 h-5" /> },
  ],
  ADMIN: [
    { title: 'Panel Admin', path: '/admin/dashboard', icon: <Settings className="w-5 h-5" /> },
    { title: 'Supervisor Sec.', path: '/supervisor/dashboard', icon: <BarChart2 className="w-5 h-5" /> },
    { title: 'Reporte Sectorial', path: '/supervisor/reporte-sectorial', icon: <FileText className="w-5 h-5" /> },
    { title: 'Vista General', path: '/general/dashboard', icon: <Layers className="w-5 h-5" /> },
    { title: 'Finanzas', path: '/finanzas/dashboard', icon: <DollarSign className="w-5 h-5" /> },
  ],

};

// Badge de color por rol
const ROLE_BADGE = {
  LIDER: 'bg-blue-100 text-blue-700',
  SUP_SECTORIAL: 'bg-amber-100 text-amber-700',
  SUP_GENERAL: 'bg-emerald-100 text-emerald-700',
  TESORERO: 'bg-violet-100 text-violet-700',
  ADMIN: 'bg-rose-100 text-rose-700',
};

const ROLE_LABEL = {
  LIDER: 'Líder',
  SUP_SECTORIAL: 'Sup. Sectorial',
  SUP_GENERAL: 'Sup. General',
  FINANZAS: 'Tesorero',
  ADMIN: 'Administrador',
};

const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const menuItems = MENU_BY_ROLE[user?.rol] || [];

  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar Sesión?',
      text: 'Estás a punto de salir del sistema.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate('/login');
      }
    });
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-100">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
          {/* <Users className="w-4 h-4 text-white" /> */}
          <img
            src={getLogoUrl()}
            alt="Logo"
            className="h-10 w-auto object-contain"
          />
        </div>
        <span className="text-lg font-bold text-gray-800">Grupo Familiar</span>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {user?.nombreCompleto?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-gray-800 truncate">{user?.nombreCompleto || 'Usuario'}</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[user?.rol] || 'bg-gray-100 text-gray-600'}`}>
              {ROLE_LABEL[user?.rol] || user?.rol}
            </span>
          </div>
        </div>
        {/* Contexto: grupo o sector si aplica */}
        {user?.grupoNombre && (
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> {user.grupoNombre}
          </p>
        )}
        {!user?.grupoNombre && user?.sectorNombre && (
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <Layers className="w-3 h-3" /> {user.sectorNombre}
          </p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-1 px-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {item.icon}
            {item.title}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full">
        <SidebarContent />
      </aside>

      {/* Overlay Mobile */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          {/* Header user info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-700">{user?.nombreCompleto || 'Usuario'}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
              {user?.nombreCompleto?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
