import { useAuthStore } from '../stores/authStore';

export interface PermissionCheck {
  resource: string;
  action: string;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

export interface PermissionMessages {
  [key: string]: {
    [action: string]: string;
  };
}

// Mensajes contextuales por recurso y acción
const PERMISSION_MESSAGES: PermissionMessages = {
  clients: {
    create: 'Solo administradores y encargados pueden crear nuevos clientes',
    update: 'Solo administradores y encargados pueden modificar clientes',
    delete: 'Solo administradores pueden eliminar clientes',
  },
  vehicles: {
    create: 'Solo administradores y encargados pueden registrar nuevos vehículos',
    update: 'Solo administradores y encargados pueden modificar información de vehículos',
    delete: 'Solo administradores pueden eliminar vehículos',
  },
  appointments: {
    create: 'Necesitas permisos para crear citas',
    update: 'Necesitas permisos para modificar citas',
    delete: 'Solo administradores y encargados pueden cancelar citas',
  },
  services: {
    create: 'Necesitas permisos para crear servicios',
    update: 'Necesitas permisos para modificar servicios',
    delete: 'Solo administradores y encargados pueden eliminar servicios',
  },
  mechanics: {
    create: 'Solo administradores y encargados pueden registrar nuevos mecánicos',
    update: 'Solo administradores y encargados pueden modificar información de mecánicos',
    delete: 'Solo administradores pueden eliminar mecánicos',
    read: 'Necesitas permisos para ver información de mecánicos',
  },
  opportunities: {
    create: 'Necesitas permisos para crear oportunidades de negocio',
    update: 'Necesitas permisos para modificar oportunidades',
    delete: 'Solo administradores y encargados pueden eliminar oportunidades',
  },
  reports: {
    read: 'Solo usuarios con permisos de reportes pueden ver esta información',
  },
  branches: {
    create: 'Solo administradores pueden crear nuevas sucursales',
    update: 'Solo administradores pueden modificar sucursales',
    delete: 'Solo administradores pueden eliminar sucursales',
    read: 'Solo administradores pueden gestionar sucursales',
  },
  users: {
    create: 'Solo administradores pueden crear nuevos usuarios',
    update: 'Solo administradores pueden modificar usuarios',
    delete: 'Solo administradores pueden eliminar usuarios',
    read: 'Solo administradores pueden gestionar usuarios',
  },
};

export const usePermissions = () => {
  const { user, hasPermission } = useAuthStore();

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  const can = (resource: string, action: string): boolean => {
    return hasPermission(resource, action);
  };

  /**
   * Verifica permisos y devuelve resultado con mensaje explicativo
   */
  const checkPermission = (resource: string, action: string): PermissionResult => {
    const allowed = hasPermission(resource, action);

    if (allowed) {
      return { allowed: true };
    }

    const message = PERMISSION_MESSAGES[resource]?.[action] ||
      `No tienes permisos para realizar esta acción (${resource}:${action})`;

    return {
      allowed: false,
      reason: message,
    };
  };

  /**
   * Verifica múltiples permisos a la vez
   */
  const checkMultiple = (permissions: PermissionCheck[]): PermissionResult[] => {
    return permissions.map(({ resource, action }) =>
      checkPermission(resource, action)
    );
  };

  /**
   * Verifica si el usuario tiene AL MENOS UNO de los permisos especificados
   */
  const canAny = (permissions: PermissionCheck[]): boolean => {
    return permissions.some(({ resource, action }) =>
      hasPermission(resource, action)
    );
  };

  /**
   * Verifica si el usuario tiene TODOS los permisos especificados
   */
  const canAll = (permissions: PermissionCheck[]): boolean => {
    return permissions.every(({ resource, action }) =>
      hasPermission(resource, action)
    );
  };

  /**
   * Obtiene información del rol actual
   */
  const getRoleInfo = () => {
    if (!user || !user.role) {
      return {
        roleName: 'Sin rol',
        isAdmin: false,
        isManager: false,
        isReceptionist: false,
      };
    }

    const roleName = user.role.name;
    return {
      roleName,
      isAdmin: roleName === 'ADMIN',
      isManager: roleName === 'ENCARGADO',
      isReceptionist: roleName === 'RECEPCIONISTA',
    };
  };

  /**
   * Obtiene todos los permisos del usuario actual
   */
  const getAllPermissions = () => {
    return user?.role?.permissions || {};
  };

  return {
    // Métodos principales
    can,
    checkPermission,
    checkMultiple,
    canAny,
    canAll,

    // Información del usuario
    user,
    roleInfo: getRoleInfo(),
    permissions: getAllPermissions(),

    // Utilidades
    isAuthenticated: !!user,
    hasAnyPermissions: Object.keys(getAllPermissions()).length > 0,
  };
};

export default usePermissions;