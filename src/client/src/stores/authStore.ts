import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  branchId: number;
  role: {
    id: number;
    name: string;
    permissions: {
      [resource: string]: string[];
    };
  };
  branch: {
    id: number;
    name: string;
    code: string;
    city: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  refreshUser: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Acciones
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, tokens } = response.data.data;
          const accessToken = tokens.accessToken;

          // Configurar el token para futuras peticiones
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          set({
            user,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(
            error.response?.data?.message || 'Error al iniciar sesión'
          );
        }
      },

      logout: () => {
        // Limpiar el token de las peticiones
        delete api.defaults.headers.common['Authorization'];
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      refreshUser: async () => {
        const { token } = get();
        if (!token) {
          throw new Error('No hay token disponible');
        }

        try {
          // Configurar el token si no está configurado
          if (!api.defaults.headers.common['Authorization']) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          }

          const response = await api.get('/auth/me');
          const user = response.data.data;

          set({ user });
        } catch (error: any) {
          // Si el token no es válido, cerrar sesión
          get().logout();
          throw new Error(
            error.response?.data?.message || 'Error al obtener información del usuario'
          );
        }
      },

      hasPermission: (resource: string, action: string): boolean => {
        const { user } = get();
        if (!user || !user.role || !user.role.permissions) return false;

        const resourcePermissions = user.role.permissions[resource];
        return resourcePermissions ? resourcePermissions.includes(action) : false;
      },
    }),
    {
      name: 'henry-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          // Configurar el token al rehidratar
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      },
    }
  )
);