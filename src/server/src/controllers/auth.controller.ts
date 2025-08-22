import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { loginSchema, registerSchema, changePasswordSchema } from '../../../shared/schemas';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await authService.login(validatedData);

      // Set HTTP-only cookies for tokens
      res.cookie('accessToken', result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
          user: result.user,
          // Also send tokens in response for client-side storage if needed
          tokens: result.tokens,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error en el inicio de sesión',
      });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const createdBy = req.user?.userId || 1; // Default to admin if no user in context
      
      const result = await authService.register(validatedData, createdBy);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: result.user,
          tokens: result.tokens,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error en el registro',
      });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Token de actualización requerido',
        });
      }

      const tokens = await authService.refreshToken(refreshToken);

      // Update cookies
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.json({
        success: true,
        message: 'Token actualizado exitosamente',
        data: { tokens },
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar token',
      });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Sesión cerrada exitosamente',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cerrar sesión',
      });
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const validatedData = changePasswordSchema.parse(req.body);
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      await authService.changePassword(
        userId,
        validatedData.currentPassword,
        validatedData.newPassword
      );

      res.json({
        success: true,
        message: 'Contraseña cambiada exitosamente',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al cambiar contraseña',
      });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      // Get fresh user data from database including branch info
      const user = await authService.getUserProfile(userId);

      res.json({
        success: true,
        message: 'Perfil obtenido exitosamente',
        data: user,
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener perfil',
      });
    }
  }
}

export const authController = new AuthController();