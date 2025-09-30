import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate, validateQuery, validateParams } from '../middleware/validation.middleware';
import {
  createServiceSchema,
  updateServiceSchema,
  serviceStatusUpdateSchema,
  serviceFilterSchema,
} from '../../../shared/schemas';
import { idParamSchema } from '../../../shared/schemas/common.schema';

const router = Router();
const prisma = new PrismaClient();

// Helper function to auto-complete appointment when all services are terminated
async function autoCompleteAppointmentIfAllServicesTerminated(serviceId: number, tx = prisma) {
  try {
    // Get the service with appointment info
    const service = await tx.service.findUnique({
      where: { id: serviceId },
      select: {
        appointmentId: true,
        statusId: true
      }
    });

    // Only proceed if service has an appointment and service is terminated (statusId: 5)
    if (!service?.appointmentId || service.statusId !== 5) {
      return;
    }

    // Check if ALL services for this appointment are terminated
    const appointmentServices = await tx.service.findMany({
      where: { appointmentId: service.appointmentId },
      select: { statusId: true }
    });

    const allServicesTerminated = appointmentServices.every(s => s.statusId === 4 || s.statusId === 5); // TERMINADO or RECHAZADO

    if (allServicesTerminated) {
      // Auto-complete the appointment
      await tx.appointment.update({
        where: { id: service.appointmentId },
        data: { status: 'completed' }
      });

      console.log(`🎯 Auto-completed appointment ${service.appointmentId} - all services terminated`);
    }
  } catch (error) {
    console.error('Error auto-completing appointment:', error);
    // Don't throw - we don't want to break the service update if this fails
  }
}


// GET /api/services - List services with pagination and filters
router.get(
  '/',
  authenticate,
  authorize(['services'], ['read']),
  // validateQuery(serviceFilterSchema), // Temporarily disabled due to production issues
  async (req, res) => {
    try {
      // Manual conversion to bypass Zod issues in production
      const query = req.query;
      const page = parseInt(query.page as string) || 1;
      const limit = parseInt(query.limit as string) || 10;
      const search = query.search as string;
      const clientId = query.clientId ? parseInt(query.clientId as string) : undefined;
      const vehicleId = query.vehicleId ? parseInt(query.vehicleId as string) : undefined;
      const mechanicId = query.mechanicId ? parseInt(query.mechanicId as string) : undefined;
      const statusId = query.statusId ? parseInt(query.statusId as string) : undefined;
      const dateFrom = query.dateFrom as string;
      const dateTo = query.dateTo as string;
      const offset = (page - 1) * limit;

      const where: any = {};

      // Search filter (by client name, vehicle plate, problem description, or diagnosis)
      if (search) {
        where.OR = [
          {
            client: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            vehicle: {
              plate: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            problemDescription: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            diagnosis: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      // Filter by client
      if (clientId) {
        where.clientId = parseInt(clientId as string);
      }

      // Filter by vehicle
      if (vehicleId) {
        where.vehicleId = parseInt(vehicleId as string);
      }

      // Filter by mechanic
      if (mechanicId) {
        where.mechanicId = parseInt(mechanicId as string);
      }

      // Filter by status
      if (statusId) {
        where.statusId = parseInt(statusId as string);
      }

      // Date range filter - FIXED: Use createdAt for basic filtering
      if (dateFrom || dateTo) {
        // DEBUG: Logging temporal para verificar filtros recibidos
        console.log('📅 DEBUG BACKEND FILTROS:');
        console.log('- dateFrom:', dateFrom);
        console.log('- dateTo:', dateTo);
        console.log('- dateFrom parsed:', dateFrom ? new Date(dateFrom as string).toISOString() : 'null');
        console.log('- dateTo parsed:', dateTo ? new Date(dateTo as string).toISOString() : 'null');
        
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom as string);
        }
        if (dateTo) {
          where.createdAt.lte = new Date(dateTo as string);
        }
      }

      // SIMPLIFIED LOGIC: Only apply special filtering for "current work" periods (no date filters)
      // This allows historical views to show all services without complex logic
      const hasDateFilters = dateFrom || dateTo;
      
      if (!hasDateFilters) {
        // Only for "current work" view (no period selected or "today" without explicit dates)
        // Show all active services + today's completed services
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        const originalOR = where.OR || [];
        where.OR = [
          ...originalOR,
          // Show all non-completed services (not Terminado or Rechazado)
          { statusId: { notIn: [4, 5] } }, // Not TERMINADO (4) or RECHAZADO (5)
          // Show only today's TERMINADO services
          {
            AND: [
              { statusId: 4 }, // TERMINADO
              {
                OR: [
                  { completedAt: { gte: startOfToday, lte: endOfToday } },
                  { createdAt: { gte: startOfToday, lte: endOfToday } },
                ],
              },
            ],
          },
          // Show only today's RECHAZADO services
          {
            AND: [
              { statusId: 5 }, // RECHAZADO
              {
                OR: [
                  { completedAt: { gte: startOfToday, lte: endOfToday } },
                  { createdAt: { gte: startOfToday, lte: endOfToday } },
                ],
              },
            ],
          },
        ];
      }

      const [services, total] = await Promise.all([
        prisma.service.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            client: {
              select: { id: true, name: true, phone: true, email: true },
            },
            vehicle: {
              select: { id: true, plate: true, brand: true, model: true, year: true },
            },
            mechanic: {
              select: { id: true, name: true, commissionPercentage: true },
            },
            status: {
              select: { id: true, name: true, color: true, orderIndex: true },
            },
            appointment: {
              select: { id: true, scheduledDate: true, status: true },
            },
            createdByUser: {
              select: { id: true, name: true },
            },
            _count: {
              select: {
                opportunities: true,
                statusLogs: true,
              },
            },
          },
        }),
        prisma.service.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          services,
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
      console.error('Error fetching services:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// GET /api/services/:id - Get specific service with full details
router.get(
  '/:id',
  authenticate,
  authorize(['services'], ['read']),
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;

      const service = await prisma.service.findUnique({
        where: { id: parseInt(id) },
        include: {
          client: {
            select: { id: true, name: true, phone: true, email: true, address: true },
          },
          vehicle: {
            select: { id: true, plate: true, brand: true, model: true, year: true, color: true, notes: true },
          },
          mechanic: {
            select: { id: true, name: true, commissionPercentage: true, isActive: true },
          },
          status: {
            select: { id: true, name: true, color: true, orderIndex: true },
          },
          appointment: {
            select: { id: true, scheduledDate: true, status: true, notes: true },
          },
          createdByUser: {
            select: { id: true, name: true },
          },
          opportunities: {
            include: {
              createdByUser: {
                select: { id: true, name: true },
              },
            },
          },
          statusLogs: {
            include: {
              oldStatus: {
                select: { id: true, name: true, color: true },
              },
              newStatus: {
                select: { id: true, name: true, color: true },
              },
              changedByUser: {
                select: { id: true, name: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado',
        });
      }

      res.json({
        success: true,
        data: service,
      });
    } catch (error) {
      console.error('Error fetching service:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// POST /api/services - Create new service
router.post(
  '/',
  authenticate,
  authorize(['services'], ['create']),
  validate(createServiceSchema),
  async (req, res) => {
    try {
      const {
        appointmentId,
        clientId,
        vehicleId,
        mechanicId,
        statusId = 1,
        problemDescription,
        diagnosis,
        quotationDetails,
        laborPrice = 0,
        partsPrice = 0,
        partsCost = 0,
        mechanicCommission = 0,
      } = req.body;

      // Calcular campos automáticamente
      const totalAmount = Number(laborPrice) + Number(partsPrice);
      const truput = totalAmount - Number(partsCost);
      const userId = (req as any).user.userId;
      const userBranchId = (req as any).user.branchId;

      // Verify client exists (global - no branchId filter)
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado',
        });
      }

      // Verify vehicle exists and belongs to client (global - no branchId filter)
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle || vehicle.clientId !== clientId) {
        return res.status(404).json({
          success: false,
          message: 'Vehículo no encontrado o no pertenece al cliente',
        });
      }

      // Verify mechanic if provided
      if (mechanicId) {
        const mechanic = await prisma.mechanic.findUnique({
          where: { 
            id: mechanicId,
            branchId: userBranchId 
          },
        });

        if (!mechanic || !mechanic.isActive) {
          return res.status(404).json({
            success: false,
            message: 'Mecánico no encontrado o inactivo',
          });
        }
      }

      // Verify appointment if provided
      if (appointmentId) {
        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId },
        });

        if (!appointment || appointment.clientId !== clientId || appointment.vehicleId !== vehicleId) {
          return res.status(404).json({
            success: false,
            message: 'Cita no encontrada o no coincide con el cliente/vehículo',
          });
        }
      }

      // Verify status exists
      const workStatus = await prisma.workStatus.findUnique({
        where: { id: statusId },
      });

      if (!workStatus) {
        return res.status(404).json({
          success: false,
          message: 'Estado de trabajo no encontrado',
        });
      }

      const service = await prisma.service.create({
        data: {
          appointmentId,
          clientId,
          vehicleId,
          mechanicId,
          statusId,
          problemDescription,
          diagnosis,
          quotationDetails,
          laborPrice,
          partsPrice,
          partsCost,
          totalAmount,
          truput,
          mechanicCommission,
          createdBy: userId,
          branchId: userBranchId,
        },
        include: {
          client: {
            select: { id: true, name: true, phone: true, email: true },
          },
          vehicle: {
            select: { id: true, plate: true, brand: true, model: true },
          },
          mechanic: {
            select: { id: true, name: true },
          },
          status: {
            select: { id: true, name: true, color: true },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: service,
        message: 'Servicio creado exitosamente',
      });
    } catch (error) {
      console.error('Error creating service:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// PUT /api/services/:id - Update service
router.put(
  '/:id',
  authenticate,
  authorize(['services'], ['update']),
  validateParams(idParamSchema),
  validate(updateServiceSchema.omit({ id: true })),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const existingService = await prisma.service.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingService) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado',
        });
      }

      // Calcular campos automáticamente si se actualizan los precios
      if (updateData.laborPrice !== undefined || updateData.partsPrice !== undefined || updateData.partsCost !== undefined) {
        const laborPrice = updateData.laborPrice !== undefined ? Number(updateData.laborPrice) : Number(existingService.laborPrice);
        const partsPrice = updateData.partsPrice !== undefined ? Number(updateData.partsPrice) : Number(existingService.partsPrice);
        const partsCost = updateData.partsCost !== undefined ? Number(updateData.partsCost) : Number(existingService.partsCost);
        
        updateData.totalAmount = laborPrice + partsPrice;
        updateData.truput = updateData.totalAmount - partsCost;
      }

      // Verify mechanic if being updated
      if (updateData.mechanicId) {
        const mechanic = await prisma.mechanic.findUnique({
          where: { id: updateData.mechanicId },
        });

        if (!mechanic || !mechanic.isActive) {
          return res.status(404).json({
            success: false,
            message: 'Mecánico no encontrado o inactivo',
          });
        }
      }

      // Convert date strings to Date objects
      if (updateData.startedAt) {
        updateData.startedAt = new Date(updateData.startedAt);
      }
      if (updateData.completedAt) {
        updateData.completedAt = new Date(updateData.completedAt);
      }

      const service = await prisma.service.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          client: {
            select: { id: true, name: true, phone: true, email: true },
          },
          vehicle: {
            select: { id: true, plate: true, brand: true, model: true },
          },
          mechanic: {
            select: { id: true, name: true },
          },
          status: {
            select: { id: true, name: true, color: true },
          },
        },
      });

      res.json({
        success: true,
        data: service,
        message: 'Servicio actualizado exitosamente',
      });
    } catch (error) {
      console.error('Error updating service:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// PUT /api/services/:id/status - Update service status with logging
router.put(
  '/:id/status',
  authenticate,
  authorize(['services'], ['update']),
  validateParams(idParamSchema),
  validate(serviceStatusUpdateSchema.omit({ id: true })),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newStatusId, notes } = req.body;
      const userId = (req as any).user.userId;

      const existingService = await prisma.service.findUnique({
        where: { id: parseInt(id) },
        include: {
          status: true,
        },
      });

      if (!existingService) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado',
        });
      }

      // Verify new status exists
      const newStatus = await prisma.workStatus.findUnique({
        where: { id: newStatusId },
      });

      if (!newStatus) {
        return res.status(404).json({
          success: false,
          message: 'Estado de trabajo no encontrado',
        });
      }

      // Don't update if status is the same
      if (existingService.statusId === newStatusId) {
        return res.status(400).json({
          success: false,
          message: 'El servicio ya tiene este estado',
        });
      }

      // Update service and create status log in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update service status
        const updatedService = await tx.service.update({
          where: { id: parseInt(id) },
          data: {
            statusId: newStatusId,
            // Set startedAt if moving to "En Progreso"
            ...(newStatus.name === 'En Progreso' && !existingService.startedAt && {
              startedAt: new Date(),
            }),
            // Set completedAt if moving to "Completado" or "Terminado"
            ...((newStatus.name === 'Completado' || newStatus.name === 'Terminado') && {
              completedAt: new Date(),
            }),
          },
          include: {
            client: { select: { id: true, name: true, phone: true, email: true } },
            vehicle: { select: { id: true, plate: true, brand: true, model: true } },
            mechanic: { select: { id: true, name: true } },
            status: { select: { id: true, name: true, color: true } },
          },
        });

        // Create status log
        await tx.statusLog.create({
          data: {
            serviceId: parseInt(id),
            oldStatusId: existingService.statusId,
            newStatusId,
            notes,
            changedBy: userId,
          },
        });

        // Auto-complete appointment if service is terminated
        if (newStatus.name === 'Terminado') {
          await autoCompleteAppointmentIfAllServicesTerminated(parseInt(id), tx);
        }

        return updatedService;
      });

      res.json({
        success: true,
        data: result,
        message: 'Estado del servicio actualizado exitosamente',
      });
    } catch (error) {
      console.error('Error updating service status:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// DELETE /api/services/:id - Soft delete service (only if not started)
router.delete(
  '/:id',
  authenticate,
  authorize(['services'], ['delete']),
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;

      const existingService = await prisma.service.findUnique({
        where: { id: parseInt(id) },
        include: {
          status: true,
        },
      });

      if (!existingService) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado',
        });
      }

      // Check if service has been started
      if (existingService.startedAt) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar un servicio que ya ha sido iniciado',
        });
      }

      // Check if service is not in initial status
      if (existingService.status.orderIndex > 1) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar un servicio que ha progresado más allá del estado inicial',
        });
      }

      // Delete service and related logs
      await prisma.$transaction(async (tx) => {
        // Delete status logs
        await tx.statusLog.deleteMany({
          where: { serviceId: parseInt(id) },
        });

        // Delete opportunities
        await tx.opportunity.deleteMany({
          where: { serviceId: parseInt(id) },
        });

        // Delete service
        await tx.service.delete({
          where: { id: parseInt(id) },
        });
      });

      res.json({
        success: true,
        message: 'Servicio eliminado exitosamente',
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// POST /api/services/:id/start - Start service (set startedAt)
router.post(
  '/:id/start',
  authenticate,
  authorize(['services'], ['update']),
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;

      const existingService = await prisma.service.findUnique({
        where: { id: parseInt(id) },
        include: {
          status: true,
        },
      });

      if (!existingService) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado',
        });
      }

      if (existingService.startedAt) {
        return res.status(400).json({
          success: false,
          message: 'El servicio ya ha sido iniciado',
        });
      }

      if (existingService.completedAt) {
        return res.status(400).json({
          success: false,
          message: 'No se puede iniciar un servicio completado',
        });
      }

      const service = await prisma.service.update({
        where: { id: parseInt(id) },
        data: { startedAt: new Date() },
        include: {
          client: { select: { id: true, name: true, phone: true } },
          vehicle: { select: { id: true, plate: true, brand: true, model: true } },
          mechanic: { select: { id: true, name: true } },
          status: { select: { id: true, name: true, color: true } },
        },
      });

      res.json({
        success: true,
        data: service,
        message: 'Servicio iniciado exitosamente',
      });
    } catch (error) {
      console.error('Error starting service:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// POST /api/services/:id/complete - Complete service (set completedAt)
router.post(
  '/:id/complete',
  authenticate,
  authorize(['services'], ['update']),
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;

      const existingService = await prisma.service.findUnique({
        where: { id: parseInt(id) },
        include: {
          status: true,
        },
      });

      if (!existingService) {
        return res.status(404).json({
          success: false,
          message: 'Servicio no encontrado',
        });
      }

      if (existingService.completedAt) {
        return res.status(400).json({
          success: false,
          message: 'El servicio ya está completado',
        });
      }

      if (!existingService.startedAt) {
        return res.status(400).json({
          success: false,
          message: 'No se puede completar un servicio que no ha sido iniciado',
        });
      }

      // Find the "Completado" or "Terminado" status
      const completedStatus = await prisma.workStatus.findFirst({
        where: { 
          name: { in: ['Completado', 'Terminado'] }
        },
      });

      if (!completedStatus) {
        return res.status(500).json({
          success: false,
          message: 'Estado "Completado" o "Terminado" no encontrado en el sistema',
        });
      }

      const service = await prisma.service.update({
        where: { id: parseInt(id) },
        data: { 
          completedAt: new Date(),
          statusId: completedStatus.id,
        },
        include: {
          client: { select: { id: true, name: true, phone: true } },
          vehicle: { select: { id: true, plate: true, brand: true, model: true } },
          mechanic: { select: { id: true, name: true } },
          status: { select: { id: true, name: true, color: true } },
        },
      });

      // Auto-complete appointment if all services are terminated
      await autoCompleteAppointmentIfAllServicesTerminated(parseInt(id));

      res.json({
        success: true,
        data: service,
        message: 'Servicio completado exitosamente',
      });
    } catch (error) {
      console.error('Error completing service:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// GET /api/services/history/client/:id - Service history for a specific client
router.get(
  '/history/client/:id',
  authenticate,
  authorize(['services'], ['read']),
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { limit = 10, page = 1 } = req.query;
      
      const clientId = parseInt(id);
      const limitNum = parseInt(limit as string);
      const pageNum = parseInt(page as string);
      const skip = (pageNum - 1) * limitNum;

      // Verify client exists
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado',
        });
      }

      // Get services with full details
      const services = await prisma.service.findMany({
        where: {
          clientId: clientId,
          branchId: (req as any).user.branchId,
        },
        include: {
          vehicle: {
            select: { id: true, plate: true, brand: true, model: true, year: true }
          },
          mechanic: {
            select: { id: true, name: true }
          },
          status: {
            select: { id: true, name: true, color: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip: skip,
      });

      // Get totals for summary
      const totalServices = await prisma.service.count({
        where: {
          clientId: clientId,
          branchId: (req as any).user.branchId,
        }
      });

      const totalAmount = await prisma.service.aggregate({
        where: {
          clientId: clientId,
          branchId: (req as any).user.branchId,
        },
        _sum: {
          totalAmount: true,
        }
      });

      res.json({
        success: true,
        data: {
          services,
          summary: {
            totalServices,
            totalAmount: totalAmount._sum.totalAmount || 0,
            totalPages: Math.ceil(totalServices / limitNum),
            currentPage: pageNum,
          }
        }
      });

    } catch (error) {
      console.error('Error getting client service history:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// GET /api/services/history/vehicle/:id - Service history for a specific vehicle
router.get(
  '/history/vehicle/:id',
  authenticate,
  authorize(['services'], ['read']),
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { limit = 10, page = 1 } = req.query;
      
      const vehicleId = parseInt(id);
      const limitNum = parseInt(limit as string);
      const pageNum = parseInt(page as string);
      const skip = (pageNum - 1) * limitNum;

      // Verify vehicle exists
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: {
          client: {
            select: { id: true, name: true, phone: true }
          }
        }
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehículo no encontrado',
        });
      }

      // Get services with full details
      const services = await prisma.service.findMany({
        where: {
          vehicleId: vehicleId,
          branchId: (req as any).user.branchId,
        },
        include: {
          client: {
            select: { id: true, name: true, phone: true }
          },
          mechanic: {
            select: { id: true, name: true }
          },
          status: {
            select: { id: true, name: true, color: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip: skip,
      });

      // Get totals for summary
      const totalServices = await prisma.service.count({
        where: {
          vehicleId: vehicleId,
          branchId: (req as any).user.branchId,
        }
      });

      const totalAmount = await prisma.service.aggregate({
        where: {
          vehicleId: vehicleId,
          branchId: (req as any).user.branchId,
        },
        _sum: {
          totalAmount: true,
        }
      });

      res.json({
        success: true,
        data: {
          vehicle,
          services,
          summary: {
            totalServices,
            totalAmount: totalAmount._sum.totalAmount || 0,
            totalPages: Math.ceil(totalServices / limitNum),
            currentPage: pageNum,
          }
        }
      });

    } catch (error) {
      console.error('Error getting vehicle service history:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

export default router;