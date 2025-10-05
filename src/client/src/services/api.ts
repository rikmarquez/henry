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
    // Intentar obtener el token de localStorage
    const authData = localStorage.getItem('henry-auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        const token = parsed.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error('Error parsing auth data:', e);
      }
    }
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