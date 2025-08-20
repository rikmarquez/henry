import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { 
  createUserSchema, 
  updateUserSchema, 
  userFilterSchema,
  updateUserPasswordSchema
} from '../../../shared/schemas';
import { z } from 'zod';

// Extend createUserSchema to include password
const createUserWithPasswordSchema = createUserSchema.extend({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export class UserController {
  async createUser(req: Request, res: Response) {
    try {
      const validatedData = createUserWithPasswordSchema.parse(req.body);
      const user = await userService.createUser(validatedData);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: { user },
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al crear usuario',
      });
    }
  }

  async getUsers(req: Request, res: Response) {
    try {
      const filters = userFilterSchema.parse(req.query);
      const result = await userService.getUsers(filters);

      res.json({
        success: true,
        message: 'Usuarios obtenidos exitosamente',
        data: result,
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener usuarios',
      });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
      }

      const user = await userService.getUserById(id);

      res.json({
        success: true,
        message: 'Usuario obtenido exitosamente',
        data: { user },
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener usuario',
      });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
      }

      const validatedData = updateUserSchema.parse({ ...req.body, id });
      const user = await userService.updateUser(id, validatedData);

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: { user },
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar usuario',
      });
    }
  }

  async updateUserPassword(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
      }

      const validatedData = updateUserPasswordSchema.parse({ ...req.body, id });
      await userService.updateUserPassword(validatedData);

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente',
      });
    } catch (error) {
      console.error('Update user password error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar contraseña',
      });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario inválido',
        });
      }

      await userService.deleteUser(id);

      res.json({
        success: true,
        message: 'Usuario desactivado exitosamente',
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al desactivar usuario',
      });
    }
  }

  async getRoles(req: Request, res: Response) {
    try {
      const roles = await userService.getRoles();

      res.json({
        success: true,
        message: 'Roles obtenidos exitosamente',
        data: { roles },
      });
    } catch (error) {
      console.error('Get roles error:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener roles',
      });
    }
  }
}

export const userController = new UserController();