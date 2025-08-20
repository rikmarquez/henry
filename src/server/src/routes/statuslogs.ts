import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateQuery, validateParams } from '../middleware/validation.middleware';
import { statusLogFilterSchema } from '../../../shared/schemas';
import { idParamSchema } from '../../../shared/schemas/common.schema';

const router = Router();
const prisma = new PrismaClient();

// GET /api/statuslogs - List status logs with pagination and filters
router.get(
  '/',
  authenticate,
  authorize(['services'], ['read']), // Using services permission since status logs are related to services
  validateQuery(statusLogFilterSchema),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        serviceId,
        oldStatusId,
        newStatusId,
        changedBy,
        dateFrom,
        dateTo,
      } = req.query;
      const offset = (page - 1) * limit;

      const where: any = {};

      // Filter by service
      if (serviceId) {
        where.serviceId = parseInt(serviceId as string);
      }

      // Filter by old status
      if (oldStatusId) {
        where.oldStatusId = parseInt(oldStatusId as string);
      }

      // Filter by new status
      if (newStatusId) {
        where.newStatusId = parseInt(newStatusId as string);
      }

      // Filter by user who made the change
      if (changedBy) {
        where.changedBy = parseInt(changedBy as string);
      }

      // Date range filter
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom as string);
        }
        if (dateTo) {
          where.createdAt.lte = new Date(dateTo as string);
        }
      }

      const [statusLogs, total] = await Promise.all([
        prisma.statusLog.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            service: {
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
            oldStatus: {
              select: { id: true, name: true, color: true, orderIndex: true },
            },
            newStatus: {
              select: { id: true, name: true, color: true, orderIndex: true },
            },
            changedByUser: {
              select: { id: true, name: true },
            },
          },
        }),
        prisma.statusLog.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          statusLogs,
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
      console.error('Error fetching status logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// GET /api/statuslogs/stats - Get status log statistics (must be before /:id route)
router.get(
  '/stats',
  authenticate,
  authorize(['reports'], ['read']),
  async (req, res) => {
    try {
      const { dateFrom, dateTo } = req.query;

      const where: any = {};

      // Date range filter
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom as string);
        }
        if (dateTo) {
          where.createdAt.lte = new Date(dateTo as string);
        }
      }

      const [
        totalLogs,
        statusChangesByStatus,
        statusChangesByUser,
        recentActivity,
      ] = await Promise.all([
        // Total status logs
        prisma.statusLog.count({ where }),

        // Status changes grouped by new status
        prisma.statusLog.groupBy({
          by: ['newStatusId'],
          where,
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),

        // Status changes grouped by user
        prisma.statusLog.groupBy({
          by: ['changedBy'],
          where,
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),

        // Recent activity (last 10 status changes)
        prisma.statusLog.findMany({
          where,
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            service: {
              select: {
                id: true,
                client: { select: { name: true } },
                vehicle: { select: { plate: true } },
              },
            },
            oldStatus: { select: { name: true, color: true } },
            newStatus: { select: { name: true, color: true } },
            changedByUser: { select: { name: true } },
          },
        }),
      ]);

      // Enhance grouped data with status and user names
      const statusesMap = await prisma.workStatus.findMany({
        select: { id: true, name: true, color: true },
      });

      const usersMap = await prisma.user.findMany({
        select: { id: true, name: true },
      });

      const enhancedStatusChanges = statusChangesByStatus.map(item => ({
        ...item,
        status: statusesMap.find(s => s.id === item.newStatusId),
      }));

      const enhancedUserChanges = statusChangesByUser.map(item => ({
        ...item,
        user: usersMap.find(u => u.id === item.changedBy),
      }));

      res.json({
        success: true,
        data: {
          totalLogs,
          statusChangesByStatus: enhancedStatusChanges,
          statusChangesByUser: enhancedUserChanges,
          recentActivity,
        },
      });
    } catch (error) {
      console.error('Error fetching status log stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// GET /api/statuslogs/:id - Get specific status log
router.get(
  '/:id',
  authenticate,
  authorize(['services'], ['read']),
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;

      const statusLog = await prisma.statusLog.findUnique({
        where: { id: parseInt(id) },
        include: {
          service: {
            include: {
              client: {
                select: { id: true, name: true, phone: true, email: true },
              },
              vehicle: {
                select: { 
                  id: true, 
                  plate: true, 
                  brand: true, 
                  model: true, 
                  year: true, 
                  color: true,
                },
              },
              mechanic: {
                select: { id: true, name: true },
              },
              appointment: {
                select: { id: true, scheduledDate: true },
              },
            },
          },
          oldStatus: {
            select: { id: true, name: true, color: true, orderIndex: true },
          },
          newStatus: {
            select: { id: true, name: true, color: true, orderIndex: true },
          },
          changedByUser: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!statusLog) {
        return res.status(404).json({
          success: false,
          message: 'Log de estado no encontrado',
        });
      }

      res.json({
        success: true,
        data: statusLog,
      });
    } catch (error) {
      console.error('Error fetching status log:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// GET /api/statuslogs/by-service/:serviceId - Get status logs for a specific service
router.get(
  '/by-service/:serviceId',
  authenticate,
  authorize(['services'], ['read']),
  validateParams(z.object({ serviceId: z.string().transform(val => parseInt(val)) })),
  async (req, res) => {
    try {
      const { serviceId } = req.params;

      // Verify service exists
      const service = await prisma.service.findUnique({
        where: { id: parseInt(serviceId as string) },
        select: { id: true },
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado',
        });
      }

      const statusLogs = await prisma.statusLog.findMany({
        where: { serviceId: parseInt(serviceId as string) },
        orderBy: { createdAt: 'asc' },
        include: {
          oldStatus: {
            select: { id: true, name: true, color: true, orderIndex: true },
          },
          newStatus: {
            select: { id: true, name: true, color: true, orderIndex: true },
          },
          changedByUser: {
            select: { id: true, name: true },
          },
        },
      });

      res.json({
        success: true,
        data: statusLogs,
      });
    } catch (error) {
      console.error('Error fetching status logs by service:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// GET /api/statuslogs/by-user/:userId - Get status logs by user who made the changes
router.get(
  '/by-user/:userId',
  authenticate,
  authorize(['services'], ['read']),
  validateParams(z.object({ userId: z.string().transform(val => parseInt(val)) })),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * Number(limit);

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId as string) },
        select: { id: true, name: true },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      const [statusLogs, total] = await Promise.all([
        prisma.statusLog.findMany({
          where: { changedBy: parseInt(userId as string) },
          skip: offset,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            service: {
              include: {
                client: {
                  select: { id: true, name: true, phone: true },
                },
                vehicle: {
                  select: { id: true, plate: true, brand: true, model: true },
                },
              },
            },
            oldStatus: {
              select: { id: true, name: true, color: true },
            },
            newStatus: {
              select: { id: true, name: true, color: true },
            },
          },
        }),
        prisma.statusLog.count({ 
          where: { changedBy: parseInt(userId as string) },
        }),
      ]);

      const totalPages = Math.ceil(total / Number(limit));

      res.json({
        success: true,
        data: {
          user,
          statusLogs,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages,
            hasNext: Number(page) < totalPages,
            hasPrev: Number(page) > 1,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching status logs by user:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

export default router;