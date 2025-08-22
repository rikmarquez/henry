import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate, validateQuery, validateParams } from '../middleware/validation.middleware';
import {
  createMechanicSchema,
  updateMechanicSchema,
  mechanicFilterSchema,
} from '../../../shared/schemas';
import { idParamSchema } from '../../../shared/schemas/common.schema';

const router = Router();
const prisma = new PrismaClient();

// GET /api/mechanics - List mechanics with pagination and filters
router.get(
  '/',
  authenticate,
  authorize(['clients'], ['read']),
  validateQuery(mechanicFilterSchema),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search, isActive } = req.query;
      const offset = (page - 1) * limit;

      const where = {
        ...(search && {
          name: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }),
        ...(isActive !== undefined && { isActive }),
      };

      const [mechanics, total] = await Promise.all([
        prisma.mechanic.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: {
                services: true,
              },
            },
          },
        }),
        prisma.mechanic.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          mechanics,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching mechanics:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// GET /api/mechanics/:id - Get specific mechanic with services count
router.get(
  '/:id',
  authenticate,
  authorize(['clients'], ['read']),
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;

      const mechanic = await prisma.mechanic.findUnique({
        where: { id: parseInt(id) },
        include: {
          services: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              vehicle: {
                include: {
                  client: {
                    select: { id: true, name: true, phone: true },
                  },
                },
              },
              status: true,
            },
          },
          _count: {
            select: {
              services: true,
            },
          },
        },
      });

      if (!mechanic) {
        return res.status(404).json({
          success: false,
          message: 'Mecánico no encontrado',
        });
      }

      res.json({
        success: true,
        data: mechanic,
      });
    } catch (error) {
      console.error('Error fetching mechanic:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// POST /api/mechanics - Create new mechanic
router.post(
  '/',
  authenticate,
  authorize(['clients'], ['create']),
  validate(createMechanicSchema),
  async (req, res) => {
    try {
      const { name, phone, commissionPercentage, isActive } = req.body;

      const mechanic = await prisma.mechanic.create({
        data: {
          name,
          phone,
          commissionPercentage,
          isActive,
        },
      });

      res.status(201).json({
        success: true,
        data: mechanic,
        message: 'Mecánico creado exitosamente',
      });
    } catch (error) {
      console.error('Error creating mechanic:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// PUT /api/mechanics/:id - Update mechanic
router.put(
  '/:id',
  authenticate,
  authorize(['clients'], ['update']),
  validateParams(idParamSchema),
  validate(updateMechanicSchema.omit({ id: true })),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const existingMechanic = await prisma.mechanic.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingMechanic) {
        return res.status(404).json({
          success: false,
          message: 'Mecánico no encontrado',
        });
      }

      const mechanic = await prisma.mechanic.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      res.json({
        success: true,
        data: mechanic,
        message: 'Mecánico actualizado exitosamente',
      });
    } catch (error) {
      console.error('Error updating mechanic:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// DELETE /api/mechanics/:id - Soft delete mechanic (set isActive to false)
router.delete(
  '/:id',
  authenticate,
  authorize(['clients'], ['delete']),
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;

      const existingMechanic = await prisma.mechanic.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingMechanic) {
        return res.status(404).json({
          success: false,
          message: 'Mecánico no encontrado',
        });
      }

      // Check if mechanic has active services
      const activeServices = await prisma.service.count({
        where: {
          mechanicId: parseInt(id),
          status: {
            name: {
              not: 'Completado',
            },
          },
        },
      });

      if (activeServices > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar un mecánico con servicios activos',
        });
      }

      const mechanic = await prisma.mechanic.update({
        where: { id: parseInt(id) },
        data: { isActive: false },
      });

      res.json({
        success: true,
        data: mechanic,
        message: 'Mecánico desactivado exitosamente',
      });
    } catch (error) {
      console.error('Error deleting mechanic:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// POST /api/mechanics/:id/activate - Reactivate mechanic
router.post(
  '/:id/activate',
  authenticate,
  authorize(['clients'], ['update']),
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;

      const existingMechanic = await prisma.mechanic.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingMechanic) {
        return res.status(404).json({
          success: false,
          message: 'Mecánico no encontrado',
        });
      }

      if (existingMechanic.isActive) {
        return res.status(400).json({
          success: false,
          message: 'El mecánico ya está activo',
        });
      }

      const mechanic = await prisma.mechanic.update({
        where: { id: parseInt(id) },
        data: { isActive: true },
      });

      res.json({
        success: true,
        data: mechanic,
        message: 'Mecánico reactivado exitosamente',
      });
    } catch (error) {
      console.error('Error activating mechanic:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

export default router;