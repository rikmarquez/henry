import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredResource?: string;
  requiredAction?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredResource, 
  requiredAction 
}: ProtectedRouteProps) {
  const { isAuthenticated, user, hasPermission } = useAuthStore();
  const location = useLocation();

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si se requieren permisos específicos, verificarlos
  if (requiredResource && requiredAction) {
    if (!hasPermission(requiredResource, requiredAction)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-red-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="mt-2 text-lg font-medium text-gray-900">Acceso Denegado</h2>
            <p className="mt-1 text-sm text-gray-500">
              No tienes permisos para acceder a esta página.
            </p>
            <div className="mt-6">
              <button
                onClick={() => window.history.back()}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                ← Volver atrás
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}