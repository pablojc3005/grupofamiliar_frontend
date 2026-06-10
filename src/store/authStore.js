import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // Modificar para recibir un solo objeto con todos los datos
      login: (authResponse) => {
        //console.log('📝 Store login - Datos recibidos:', authResponse);

        // Extraer el token y los datos del usuario
        const { accessToken, refreshToken, tipo, ...userData } = authResponse;

        // Estructurar el objeto usuario correctamente
        const user = {
          id: userData.usuarioId,
          email: userData.email,
          nombreCompleto: userData.nombreCompleto,
          rol: userData.rol,  // ← Esto debería ser "TESORERO"
          sectorId: userData.sectorId,
          sectorNombre: userData.sectorNombre,
          grupoFamiliarId: userData.grupoFamiliarId,
          grupoFamiliarNombre: userData.grupoFamiliarNombre,
          supervisorId: userData.supervisorId,
          supervisorNombre: userData.supervisorNombre
        };

        //console.log('👤 Usuario guardado en store:', user);
        //console.log('🔑 Token guardado:', accessToken);

        set({
          user: user,
          token: accessToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        //console.log('🚪 Cerrando sesión');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      // Opcional: solo persistir ciertos campos
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

{/*
const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (userData, accessToken) =>
        set({
          user: userData,
          token: accessToken,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

*/}

export default useAuthStore;
