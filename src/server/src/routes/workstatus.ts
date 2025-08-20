import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate, validateQuery, validateParams } from '../middleware/validation.middleware';
import {
  createWorkStatusSchema,
  updateWorkStatusSchema,
  workStatusFilterSchema,
} from '../../../shared/schemas';
import { idParamSchema } from '../../../shared/schemas/common.schema';

const router = Router();
const prisma = new PrismaClient();

// GET /api/workstatus - List work statuses with pagination and filters
router.get(
  '/',
  authenticate,
  authorize(['services'], ['read']), // Using services permission since work status is related to services
  validateQuery(workStatusFilterSchema),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const offset = (page - 1) * limit;

      const where = {
        ...(search && {
          name: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }),
      };

      const [workStatuses, total] = await Promise.all([
        prisma.workStatus.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { orderIndex: 'asc' },
          include: {
            _count: {
              select: {
                services: true,
              },
            },
          },
        }),
        prisma.workStatus.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          workStatuses,
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
      console.error('Error fetching work statuses:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// GET /api/workstatus/:id - Get specific work status
router.get(
  '/:id',
  authenticate,
  authorize(['services'], ['read']),
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;

      const workStatus = await prisma.workStatus.findUnique({
        where: { id: parseInt(id) },
        include: {
          services: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              client: {
                select: { id: true, name: true, phone: true },
              },
              vehicle: {
                select: { id: true, plate: true, brand: true, model: true },
              },
              mechanic: {
                select: { id: true, name: true },
              },
            },
          },
          _count: {
            select: {
              services: true,
              oldStatusLogs: true,
              newStatusLogs: true,
            },
          },
        },
      });

      if (!workStatus) {
        return res.status(404).json({
          success: false,
          message: 'Estado de trabajo no encontrado',
        });
      }

      res.json({
        success: true,
        data: workStatus,
      });
    } catch (error) {
      console.error('Error fetching work status:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// POST /api/workstatus - Create new work status
router.post(
  '/',
  authenticate,
  authorize(['services'], ['create']), // Admin only operation
  validate(createWorkStatusSchema),
  async (req, res) => {
    try {
      const { name, orderIndex, color } = req.body;

      // Check if name already exists
      const existingStatus = await prisma.workStatus.findFirst({
        where: { name },
      });

      if (existingStatus) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un estado de trabajo con este nombre',
        });
      }

      // Check if orderIndex already exists
      const existingOrder = await prisma.workStatus.findFirst({
        where: { orderIndex },
      });

      if (existingOrder) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un estado de trabajo con este índice de orden',
        });
      }

      const workStatus = await prisma.workStatus.create({
        data: {
          name,
          orderIndex,
          color,
        },
      });

      res.status(201).json({
        success: true,
        data: workStatus,
        message: 'Estado de trabajo creado exitosamente',
      });
    } catch (error) {
      console.error('Error creating work status:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// PUT /api/workstatus/:id - Update work status
router.put(
  '/:id',
  authenticate,
  authorize(['services'], ['update']), // Admin only operation
  validateParams(idParamSchema),
  validate(updateWorkStatusSchema.omit({ id: true })),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const existingWorkStatus = await prisma.workStatus.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingWorkStatus) {
        return res.status(404).json({
          success: false,
          message: 'Estado de trabajo no encontrado',
        });
      }

      // Check if new name already exists (if updating name)
      if (updateData.name && updateData.name !== existingWorkStatus.name) {
        const existingName = await prisma.workStatus.findFirst({
          where: { 
            name: updateData.name,
            id: { not: parseInt(id) },
          },
        });

        if (existingName) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un estado de trabajo con este nombre',
          });
        }
      }

      // Check if new orderIndex already exists (if updating orderIndex)
      if (updateData.orderIndex && updateData.orderIndex !== existingWorkStatus.orderIndex) {
        const existingOrder = await prisma.workStatus.findFirst({
          where: { 
            orderIndex: updateData.orderIndex,
            id: { not: parseInt(id) },
          },
        });

        if (existingOrder) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un estado de trabajo con este índice de orden',
          });
        }
      }

      const workStatus = await prisma.workStatus.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      res.json({
        success: true,
        data: workStatus,
        message: 'Estado de trabajo actualizado exitosamente',
      });
    } catch (error) {
      console.error('Error updating work status:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// DELETE /api/workstatus/:id - Delete work status (only if not used)
router.delete(
  '/:id',
  authenticate,
  authorize(['services'], ['delete']), // Admin only operation
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;

      const existingWorkStatus = await prisma.workStatus.findUnique({
        where: { id: parseInt(id) },
        include: {
          _count: {
            select: {
              services: true,
              oldStatusLogs: true,
              newStatusLogs: true,
            },
          },
        },
      });

      if (!existingWorkStatus) {
        return res.status(404).json({
          success: false,
          message: 'Estado de trabajo no encontrado',
        });
      }

      // Check if status is being used
      const totalUsage = existingWorkStatus._count.services + 
                        existingWorkStatus._count.oldStatusLogs + 
                        existingWorkStatus._count.newStatusLogs;

      if (totalUsage > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar un estado de trabajo que está siendo utilizado',
          details: {
            services: existingWorkStatus._count.services,
            statusLogs: existingWorkStatus._count.oldStatusLogs + existingWorkStatus._count.newStatusLogs,
          },
        });
      }

      await prisma.workStatus.delete({
        where: { id: parseInt(id) },
      });

      res.json({
        success: true,
        message: 'Estado de trabajo eliminado exitosamente',
      });
    } catch (error) {
      console.error('Error deleting work status:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// POST /api/workstatus/reorder - Reorder work statuses
router.post(
  '/reorder',
  authenticate,
  authorize(['services'], ['update']), // Admin only operation
  validate(z.object({
    statusOrders: z.array(z.object({
      id: z.number().int().positive(),
      orderIndex: z.number().int().min(1),
    })).min(1),
  })),
  async (req, res) => {
    try {
      const { statusOrders } = req.body;

      // Verify all IDs exist
      const statusIds = statusOrders.map(item => item.id);
      const existingStatuses = await prisma.workStatus.findMany({
        where: { id: { in: statusIds } },
        select: { id: true },
      });

      if (existingStatuses.length !== statusIds.length) {
        return res.status(404).json({
          success: false,
          message: 'Uno o más estados de trabajo no existen',
        });
      }

      // Check for duplicate orderIndex values
      const orderIndexes = statusOrders.map(item => item.orderIndex);
      const uniqueOrderIndexes = new Set(orderIndexes);

      if (orderIndexes.length !== uniqueOrderIndexes.size) {
        return res.status(400).json({
          success: false,
          message: 'Los índices de orden deben ser únicos',
        });
      }

      // Update all statuses in a transaction
      await prisma.$transaction(
        statusOrders.map(({ id, orderIndex }) =>
          prisma.workStatus.update({
            where: { id },
            data: { orderIndex },
          })
        )
      );

      // Return updated statuses
      const updatedStatuses = await prisma.workStatus.findMany({
        where: { id: { in: statusIds } },
        orderBy: { orderIndex: 'asc' },
      });

      res.json({
        success: true,
        data: updatedStatuses,
        message: 'Estados de trabajo reordenados exitosamente',
      });
    } catch (error) {
      console.error('Error reordering work statuses:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

export default router;