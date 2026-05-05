import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../utils/axios';
import Swal from 'sweetalert2';
import { Mail, Lock, Loader2, User, Phone } from 'lucide-react';
import logoDefault from '../../assets/logo_asambleas.png';

// Lee logo desde localStorage para permitir cambio dinámico por el admin
const getLogoUrl = () => localStorage.getItem('loginLogo') || logoDefault;

// Mapa de roles a rutas de dashboard
const ROLE_DASHBOARD = {
  LIDER: '/lider/dashboard',
  SUP_SECTORIAL: '/supervisor/dashboard',
  SUP_GENERAL: '/general/dashboard',
  TESORERO: '/tesorero/dashboard',
  ADMIN: '/admin/dashboard',
};

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!nombres || !apellidos || !email || !telefono) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Incompletos',
        text: 'Por favor, complete todos los campos requeridos.',
        confirmButtonColor: '#4f46e5',
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = { nombres, apellidos, email, telefono };
      const response = await api.post('/auth/register', payload);

      if (response.data?.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Registro Exitoso!',
          text: response.data.mensaje || 'Se ha enviado la contraseña a tu correo electrónico.',
          confirmButtonColor: '#4f46e5',
        });
        setIsRegistering(false);
        setPassword('');
      }
    } catch (error) {
      console.error('Error al registrar:', error);
      let errorMessage = 'Ocurrió un error inesperado al registrarse. Intente más tarde.';

      if (error.response?.data?.mensaje) {
        errorMessage = error.response.data.mensaje;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error de Registro',
        text: errorMessage,
        confirmButtonColor: '#4f46e5',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Incompletos',
        text: 'Por favor, ingrese su correo y contraseña.',
        confirmButtonColor: '#4f46e5',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });

      console.log('🔐 Respuesta completa del login:', response.data);

      const apiData = response.data?.data;

      if (!apiData || !response.data?.success) {
        throw new Error(response.data?.mensaje || 'Error en el inicio de sesión');
      }

      // ✅ CORRECTO: Pasar el objeto completo al store
      login(apiData);

      // Alerta de bienvenida
      await Swal.fire({
        icon: 'success',
        title: `¡Bienvenido, ${apiData.nombreCompleto}!`,
        text: `Has iniciado sesión como ${apiData.rol}.`,
        confirmButtonColor: '#4f46e5',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      // Verificar que el store tiene los datos antes de redirigir
      const storeState = useAuthStore.getState();
      console.log('✅ Store después del login:', storeState.user);
      console.log('✅ Rol en store:', storeState.user?.rol);

      // Redirigir al dashboard según el rol
      const destino = ROLE_DASHBOARD[apiData.rol?.toUpperCase()] || '/dashboard';
      console.log('🚀 Redirigiendo a:', destino);
      navigate(destino);

    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      let errorMessage = 'Ocurrió un error inesperado. Intente más tarde.';

      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          errorMessage = 'Credenciales inválidas. Verifique su correo y contraseña.';
        } else if (error.response.data?.mensaje) {
          errorMessage = error.response.data.mensaje;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error de Autenticación',
        text: errorMessage,
        confirmButtonColor: '#4f46e5',
      });
    } finally {
      setIsLoading(false);
    }
  };
  {/*
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Incompletos',
        text: 'Por favor, ingrese su correo y contraseña.',
        confirmButtonColor: '#4f46e5',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });

      const apiData = response.data?.data;

      if (!apiData || !response.data?.success) {
        throw new Error(response.data?.mensaje || 'Error en el inicio de sesión');
      }

      const {
        accessToken,
        usuarioId,
        email: userEmail,
        nombreCompleto,
        rol,
        grupoFamiliarId,
        grupoFamiliarNombre,
        sectorId,
        sectorNombre,
        supervisorId,
        supervisorNombre,
      } = apiData;

      const userData = {
        id: usuarioId,
        email: userEmail,
        nombreCompleto,
        rol,
        grupoFamiliarId: grupoFamiliarId || null,
        grupoFamiliarNombre: grupoFamiliarNombre || null,
        sectorId: sectorId || null,
        sectorNombre: sectorNombre || null,
        supervisorId: supervisorId || null,
        supervisorNombre: supervisorNombre || null,
      };

      login(userData, accessToken);

      // Alerta de bienvenida
      await Swal.fire({
        icon: 'success',
        title: `¡Bienvenido, ${nombreCompleto}!`,
        text: `Has iniciado sesión como ${rol}.`,
        confirmButtonColor: '#4f46e5',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      // Redirigir al dashboard según el rol
      const destino = ROLE_DASHBOARD[rol?.toUpperCase()] || '/dashboard';
      navigate(destino);

    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      let errorMessage = 'Ocurrió un error inesperado. Intente más tarde.';

      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          errorMessage = 'Credenciales inválidas. Verifique su correo y contraseña.';
        } else if (error.response.data?.mensaje) {
          errorMessage = error.response.data.mensaje;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error de Autenticación',
        text: errorMessage,
        confirmButtonColor: '#4f46e5',
      });
    } finally {
      setIsLoading(false);
    }
  };
  */}

  const handleForgotPassword = async () => {
    const { value: emailToReset } = await Swal.fire({
      title: 'Recuperar Contraseña',
      input: 'email',
      inputLabel: 'Ingresa tu correo electrónico',
      inputPlaceholder: 'usuario@grupofamiliar.com',
      showCancelButton: true,
      confirmButtonText: 'Enviar Nueva Contraseña',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#ef4444',
      inputValidator: (value) => {
        if (!value) {
          return '¡Necesitas ingresar un correo!';
        }
      }
    });

    if (emailToReset) {
      setIsLoading(true);
      try {
        const response = await api.post('/auth/forgot-password', { email: emailToReset });
        Swal.fire({
          icon: 'success',
          title: '¡Correo Enviado!',
          text: response.data?.mensaje || 'Se ha enviado una nueva contraseña a tu correo.',
          confirmButtonColor: '#4f46e5',
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.mensaje || 'No se pudo restablecer la contraseña.',
          confirmButtonColor: '#4f46e5',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md border border-white/20 overflow-hidden">
        <div className="p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src={getLogoUrl()}
                alt="Logo Asambleas de Dios"
                className="h-28 w-auto drop-shadow-2xl"
                onError={(e) => { e.target.src = logoDefault; }}
              />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Grupo Familiar</h1>
            <p className="text-indigo-200 mt-1 text-sm">Sistema de Gestión Comunitaria</p>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-indigo-100 mb-2" htmlFor="nombres">Nombres</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-5 h-5 text-indigo-300" />
                      </div>
                      <input
                        id="nombres"
                        type="text"
                        value={nombres}
                        onChange={(e) => setNombres(e.target.value)}
                        className="pl-10 w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all backdrop-blur-sm text-sm"
                        placeholder="Juan"
                        required={isRegistering}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-indigo-100 mb-2" htmlFor="apellidos">Apellidos</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-5 h-5 text-indigo-300" />
                      </div>
                      <input
                        id="apellidos"
                        type="text"
                        value={apellidos}
                        onChange={(e) => setApellidos(e.target.value)}
                        className="pl-10 w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all backdrop-blur-sm text-sm"
                        placeholder="Pérez"
                        required={isRegistering}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-indigo-100 mb-2" htmlFor="telefono">Teléfono</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="w-5 h-5 text-indigo-300" />
                    </div>
                    <input
                      id="telefono"
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="pl-10 w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all backdrop-blur-sm text-sm"
                      placeholder="Ej: +12345678"
                      required={isRegistering}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-indigo-100 mb-2" htmlFor="email">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-indigo-300" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all backdrop-blur-sm text-sm"
                  placeholder="usuario@grupofamiliar.com"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            {!isRegistering && (
              <div>
                <label className="block text-sm font-semibold text-indigo-100 mb-2" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-indigo-300" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all backdrop-blur-sm text-sm"
                    placeholder="••••••••"
                    autoComplete={isRegistering ? "new-password" : "current-password"}
                    required={!isRegistering}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 px-4 rounded-xl hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-400/50 transition-all flex justify-center items-center shadow-lg hover:shadow-indigo-500/50 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                  {isRegistering ? 'Registrando...' : 'Iniciando sesión...'}
                </>
              ) : (
                isRegistering ? 'Crear Cuenta' : 'Ingresar al Sistema'
              )}
            </button>

            <div className="text-center mt-4 space-y-2 flex flex-col">
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm text-indigo-200 hover:text-white transition-colors"
                disabled={isLoading}
              >
                {isRegistering ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿Eres nuevo? Regístrate aquí'}
              </button>

              {!isRegistering && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-indigo-300 hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white/5 px-8 py-4 border-t border-white/10 text-center">
          <p className="text-xs text-indigo-300">
            &copy; {new Date().getFullYear()} Grupo Familiar. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
