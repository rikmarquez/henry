import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  generalSettingsSchema,
  updateGeneralSettingsSchema,
} from '../../../shared/schemas/settings.schema';

const router = Router();
const prisma = new PrismaClient();


// GET /api/settings/general - Get general settings
router.get(
  '/general',
  authenticate,
  async (req, res) => {
    try {
      const branchId = req.user.branchId;

      // Try to find existing settings for this branch
      let settings = await prisma.setting.findFirst({
        where: {
          branchId,
          type: 'GENERAL'
        }
      });

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: 'No settings found'
        });
      }

      res.json({
        success: true,
        data: settings.data
      });

    } catch (error: any) {
      console.error('Error fetching general settings:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

// POST /api/settings/general - Create or update general settings
router.post(
  '/general',
  authenticate,
  validate(generalSettingsSchema),
  async (req, res) => {
    try {
      const branchId = req.user.branchId;
      const settingsData = req.body;

      // Check if settings already exist for this branch
      let settings = await prisma.setting.findFirst({
        where: {
          branchId,
          type: 'GENERAL'
        }
      });

      if (settings) {
        // Update existing settings
        settings = await prisma.setting.update({
          where: { id: settings.id },
          data: {
            data: settingsData,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new settings
        settings = await prisma.setting.create({
          data: {
            branchId,
            type: 'GENERAL',
            data: settingsData
          }
        });
      }

      res.json({
        success: true,
        message: 'Configuración guardada correctamente',
        data: settings.data
      });

    } catch (error: any) {
      console.error('Error saving general settings:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

// PUT /api/settings/general - Update general settings
router.put(
  '/general',
  authenticate,
  validate(updateGeneralSettingsSchema),
  async (req, res) => {
    try {
      const branchId = req.user.branchId;
      const settingsData = req.body;

      // Find existing settings
      const settings = await prisma.setting.findFirst({
        where: {
          branchId,
          type: 'GENERAL'
        }
      });

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: 'Configuración no encontrada'
        });
      }

      // Merge existing data with new data
      const updatedData = {
        ...settings.data,
        ...settingsData
      };

      const updatedSettings = await prisma.setting.update({
        where: { id: settings.id },
        data: {
          data: updatedData,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Configuración actualizada correctamente',
        data: updatedSettings.data
      });

    } catch (error: any) {
      console.error('Error updating general settings:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

export default router;