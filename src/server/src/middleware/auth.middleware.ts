import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        roleId: number;
        roleName: string;
        branchId: number;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Try to get token from different sources
    let token = req.cookies?.accessToken;
    
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido',
      });
    }

    // Verify token
    const payload = await authService.verifyAccessToken(token);
    req.user = payload;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
    });
  }
};

export const authorize = (resources: string[], actions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        console.log('❌ Authorization failed: No user in request');
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      console.log('🔧 Authorization check for:', {
        userId: req.user.userId,
        email: req.user.email,
        roleId: req.user.roleId,
        requiredResources: resources,
        requiredActions: actions
      });

      // Get user role permissions from database
      const { prisma } = await import('../config/database');
      const userRole = await prisma.role.findUnique({
        where: { id: req.user.roleId }
      });

      console.log('🔧 Role from database:', {
        roleId: req.user.roleId,
        roleName: userRole?.name,
        permissions: userRole?.permissions
      });

      if (!userRole || !userRole.permissions) {
        console.log('❌ Authorization failed: No role or permissions found');
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado - Sin permisos configurados',
        });
      }

      const permissions = userRole.permissions as any;

      // Check for admin/all permissions first
      if (permissions.all === true) {
        console.log('✅ Authorization granted: Admin permissions');
        next();
        return;
      }

      // Check if user has permission for at least one resource-action combination
      const hasPermission = resources.some(resource => {
        const resourcePermissions = permissions[resource];
        console.log(`🔧 Checking resource '${resource}':`, {
          resourcePermissions,
          isArray: Array.isArray(resourcePermissions),
          requiredActions: actions
        });

        if (!resourcePermissions || !Array.isArray(resourcePermissions)) {
          return false;
        }

        const hasAction = actions.some(action => {
          const hasIt = resourcePermissions.includes(action);
          console.log(`🔧 Action '${action}' in [${resourcePermissions.join(', ')}]: ${hasIt}`);
          return hasIt;
        });

        return hasAction;
      });

      console.log('🔧 Final permission result:', hasPermission);

      if (!hasPermission) {
        console.log('❌ Authorization failed: Insufficient permissions');
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado - Permisos insuficientes',
        });
      }

      console.log('✅ Authorization granted');
      next();
    } catch (error) {
      console.error('❌ Authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Error en la autorización',
      });
    }
  };
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.accessToken;
    
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      try {
        const payload = await authService.verifyAccessToken(token);
        req.user = payload;
      } catch (error) {
        // Token is invalid but we don't fail the request
        console.log('Optional auth failed:', error);
      }
    }

    next();
  } catch (error) {
    // Don't fail the request
    console.error('Optional authentication error:', error);
    next();
  }
};