import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';

/**
 * Componente para proteger las rutas privadas.
 * @param {Array} allowedRoles - Arreglo con los roles permitidos (ej. ['LIDER', 'ADMIN'])
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    // Si no está autenticado, redirigir al Login
    return <Navigate to="/login" replace />;
  }

  // Si se definen roles permitidos, verificamos con el rol del usuario actual
  if (allowedRoles && user?.rol) {
    const userRole = user.rol.toUpperCase();
    const hasRole = allowedRoles.map(r => r.toUpperCase()).includes(userRole);
    
    if (!hasRole) {
      // Si el usuario no tiene los permisos suficientes, lo mandamos al home o a una vista de 'No Autorizado'
      // Por ahora a la raíz.
      return <Navigate to="/" replace />;
    }
  }

  // Outlet renderiza el componente hijo de las rutas en react-router-dom
  return <Outlet />;
};

export default ProtectedRoute;
