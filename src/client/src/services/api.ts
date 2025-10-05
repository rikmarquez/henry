import axios from 'axios';

// Configuración base del cliente HTTP
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3002/api'),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json; charset=utf-8',
  },
});

// Interceptor para requests - agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    console.log('[API Interceptor] Procesando request a:', config.url);

    // Intentar obtener el token de localStorage
    const authData = localStorage.getItem('henry-auth');
    console.log('[API Interceptor] authData existe?:', !!authData);

    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        const token = parsed.state?.token;
        console.log('[API Interceptor] Token parseado:', token ? '✓ Existe' : '✗ NO existe');

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('[API Interceptor] Header Authorization configurado:', config.headers.Authorization?.substring(0, 30) + '...');
        }
      } catch (e) {
        console.error('[API Interceptor] Error parsing auth data:', e);
      }
    }

    console.log('[API Interceptor] Headers finales:', config.headers);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses - manejo de errores globales
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Si recibimos un 401, significa que el token expiró
    if (error.response?.status === 401) {
      // El authStore manejará el logout
      const event = new CustomEvent('auth:unauthorized');
      window.dispatchEvent(event);
    }

    return Promise.reject(error);
  }
);

export default api;