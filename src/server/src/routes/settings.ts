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

// Debug endpoint to test database connection and table existence
router.get('/debug', authenticate, async (req, res) => {
  try {
    console.log('🔧 Settings Debug - Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('🔧 Settings Debug - Database connected');
    
    // Test if settings table exists by trying to count
    const count = await prisma.setting.count();
    console.log('🔧 Settings Debug - Settings table exists, count:', count);
    
    // Test branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: req.user.branchId }
    });
    console.log('🔧 Settings Debug - Branch found:', branch?.name);
    
    res.json({
      success: true,
      message: 'Settings debug successful',
      data: {
        settingsCount: count,
        branchId: req.user.branchId,
        branchName: branch?.name
      }
    });
  } catch (error) {
    console.error('🔧 Settings Debug - Error:', error);
    res.status(500).json({
      success: false,
      message: 'Settings debug failed',
      error: error.message
    });
  }
});

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
  // validate(generalSettingsSchema), // Temporarily disabled for debugging
  async (req, res) => {
    try {
      console.log('🔧 Settings POST - User:', req.user);
      console.log('🔧 Settings POST - Body:', req.body);
      
      const branchId = req.user.branchId;
      const settingsData = req.body;
      
      console.log('🔧 Settings POST - branchId:', branchId);
      console.log('🔧 Settings POST - settingsData:', settingsData);

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