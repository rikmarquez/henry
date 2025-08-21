import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import VehiclesPage from './pages/VehiclesPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { logout } = useAuthStore();

  // Escuchar eventos de autenticación
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Página de login */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Rutas protegidas */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/clients" element={
            <ProtectedRoute>
              <Layout>
                <ClientsPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/vehicles" element={
            <ProtectedRoute>
              <Layout>
                <VehiclesPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Redirigir raíz al dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Páginas no encontradas */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-gray-600 mb-4">Página no encontrada</p>
                <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
                  Volver al Dashboard
                </a>
              </div>
            </div>
          } />
        </Routes>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'bg-white text-gray-900 border border-gray-200 shadow-lg',
        }}
      />
    </QueryClientProvider>
  );
}

export default App;