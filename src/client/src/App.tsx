import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { BranchProvider } from './contexts/BranchContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import VehiclesPage from './pages/VehiclesPage';
import MechanicsPage from './pages/MechanicsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import ServicesPage from './pages/ServicesPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import BranchesPage from './pages/BranchesPage';

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
      <BranchProvider>
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
          
          <Route path="/mechanics" element={
            <ProtectedRoute>
              <Layout>
                <MechanicsPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/appointments" element={
            <ProtectedRoute>
              <Layout>
                <AppointmentsPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/services" element={
            <ProtectedRoute>
              <Layout>
                <ServicesPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/opportunities" element={
            <ProtectedRoute>
              <Layout>
                <OpportunitiesPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Ruta solo para administradores */}
          <Route path="/branches" element={
            <AdminRoute>
              <Layout>
                <BranchesPage />
              </Layout>
            </AdminRoute>
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
      </BranchProvider>
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