import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
  // baseURL: 'http://localhost:8080/api',
  baseURL: 'https://grupofamiliarbackend-production.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar token en cada petición
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores comunes
// IMPORTANTE: Solo redirige al login si NO es la ruta de autenticación,
// para que el catch del Login.jsx pueda mostrar las alertas de error.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/');
    if (error.response?.status === 401 && !isAuthRoute) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
