import React, { ReactNode } from 'react';
import { AlertCircle, Lock } from 'lucide-react';
import { usePermissions, PermissionCheck } from '../hooks/usePermissions';

interface PermissionGateProps {
  /** Recurso requerido (ej: 'clients', 'mechanics') */
  resource: string;
  /** Acción requerida (ej: 'create', 'read', 'update', 'delete') */
  action: string;
  /** Contenido a mostrar si tiene permisos */
  children: ReactNode;
  /** Modo de visualización cuando no tiene permisos */
  fallbackMode?: 'hide' | 'disable' | 'message';
  /** Mensaje personalizado cuando no tiene permisos */
  fallbackMessage?: string;
  /** Componente personalizado cuando no tiene permisos */
  fallback?: ReactNode;
  /** Clase CSS adicional */
  className?: string;
}

interface MultiPermissionGateProps {
  /** Lista de permisos requeridos */
  permissions: PermissionCheck[];
  /** Lógica de permisos: 'any' (cualquiera) o 'all' (todos) */
  logic?: 'any' | 'all';
  /** Contenido a mostrar si tiene permisos */
  children: ReactNode;
  /** Modo de visualización cuando no tiene permisos */
  fallbackMode?: 'hide' | 'disable' | 'message';
  /** Mensaje personalizado cuando no tiene permisos */
  fallbackMessage?: string;
  /** Componente personalizado cuando no tiene permisos */
  fallback?: ReactNode;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * Componente que controla la visibilidad/estado de elementos basado en permisos
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  resource,
  action,
  children,
  fallbackMode = 'hide',
  fallbackMessage,
  fallback,
  className = '',
}) => {
  const { checkPermission } = usePermissions();
  const permissionResult = checkPermission(resource, action);

  // Si tiene permisos, mostrar el contenido normal
  if (permissionResult.allowed) {
    return <>{children}</>;
  }

  // Si no tiene permisos, manejar según el modo
  switch (fallbackMode) {
    case 'hide':
      return null;

    case 'disable':
      return (
        <div className={`relative ${className}`} title={fallbackMessage || permissionResult.reason}>
          <div className="opacity-50 pointer-events-none cursor-not-allowed">
            {children}
          </div>
          <div className="absolute top-1 right-1 text-gray-400">
            <Lock size={12} />
          </div>
        </div>
      );

    case 'message':
      if (fallback) {
        return <>{fallback}</>;
      }

      return (
        <div className={`border border-gray-200 rounded-lg p-4 bg-gray-50 ${className}`}>
          <div className="flex items-center gap-2 text-gray-600">
            <AlertCircle size={16} />
            <span className="text-sm">
              {fallbackMessage || permissionResult.reason}
            </span>
          </div>
        </div>
      );

    default:
      return null;
  }
};

/**
 * Componente que maneja múltiples permisos con lógica AND/OR
 */
export const MultiPermissionGate: React.FC<MultiPermissionGateProps> = ({
  permissions,
  logic = 'all',
  children,
  fallbackMode = 'hide',
  fallbackMessage,
  fallback,
  className = '',
}) => {
  const { canAny, canAll } = usePermissions();

  const hasPermission = logic === 'any'
    ? canAny(permissions)
    : canAll(permissions);

  // Si tiene permisos, mostrar el contenido normal
  if (hasPermission) {
    return <>{children}</>;
  }

  // Si no tiene permisos, manejar según el modo
  const defaultMessage = logic === 'any'
    ? 'No tienes ninguno de los permisos requeridos'
    : 'No tienes todos los permisos requeridos';

  switch (fallbackMode) {
    case 'hide':
      return null;

    case 'disable':
      return (
        <div className={`relative ${className}`} title={fallbackMessage || defaultMessage}>
          <div className="opacity-50 pointer-events-none cursor-not-allowed">
            {children}
          </div>
          <div className="absolute top-1 right-1 text-gray-400">
            <Lock size={12} />
          </div>
        </div>
      );

    case 'message':
      if (fallback) {
        return <>{fallback}</>;
      }

      return (
        <div className={`border border-gray-200 rounded-lg p-4 bg-gray-50 ${className}`}>
          <div className="flex items-center gap-2 text-gray-600">
            <AlertCircle size={16} />
            <span className="text-sm">
              {fallbackMessage || defaultMessage}
            </span>
          </div>
        </div>
      );

    default:
      return null;
  }
};

/**
 * Hook para wrappear componentes con permisos de forma declarativa
 */
export const usePermissionGate = () => {
  const permissions = usePermissions();

  const withPermission = (
    resource: string,
    action: string,
    component: ReactNode,
    options?: {
      fallbackMode?: 'hide' | 'disable' | 'message';
      fallbackMessage?: string;
      fallback?: ReactNode;
    }
  ) => {
    return (
      <PermissionGate
        resource={resource}
        action={action}
        fallbackMode={options?.fallbackMode}
        fallbackMessage={options?.fallbackMessage}
        fallback={options?.fallback}
      >
        {component}
      </PermissionGate>
    );
  };

  return {
    ...permissions,
    withPermission,
  };
};

export default PermissionGate;