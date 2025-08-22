import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate, validateQuery, validateParams } from '../middleware/validation.middleware';
import {
  createOpportunitySchema,
  updateOpportunitySchema,
  opportunityFilterSchema,
} from '../../../shared/schemas';
import { idParamSchema } from '../../../shared/schemas/common.schema';

const router = Router();
const prisma = new PrismaClient();

// GET /api/opportunities - List opportunities with pagination and filters
router.get(
  '/',
  authenticate,
  authorize(['opportunities'], ['read']),
  validateQuery(opportunityFilterSchema),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        clientId,
        vehicleId,
        serviceId,
        type,
        status,
        dateFrom,
        dateTo,
      } = req.query;
      const offset = (page - 1) * limit;

      const where: any = {};

      // Search filter (by client name, vehicle plate, type, description, or notes)
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
            type: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            notes: {
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

      // Filter by service
      if (serviceId) {
        where.serviceId = parseInt(serviceId as string);
      }

      // Filter by type
      if (type) {
        where.type = {
          contains: type,
          mode: 'insensitive',
        };
      }

      // Filter by status
      if (status) {
        where.status = status;
      }

      // Date range filter
      if (dateFrom || dateTo) {
        where.followUpDate = {};
        if (dateFrom) {
          where.followUpDate.gte = new Date(dateFrom as string);
        }
        if (dateTo) {
          where.followUpDate.lte = new Date(dateTo as string);
        }
      }

      const [opportunities, total] = await Promise.all([
        prisma.opportunity.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { followUpDate: 'asc' },
          include: {
            client: {
              select: { id: true, name: true, phone: true, email: true },
            },
            vehicle: {
              select: { id: true, plate: true, brand: true, model: true, year: true },
            },
            service: {
              select: { 
                id: true, 
                problemDescription: true, 
                diagnosis: true, 
                totalAmount: true,
                status: { select: { id: true, name: true, color: true } },
              },
            },
            createdByUser: {
              select: { id: true, name: true },
            },
          },
        }),
        prisma.opportunity.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          opportunities,
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
      console.error('Error fetching opportunities:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// GET /api/opportunities/:id - Get specific opportunity with full details
router.get(
  '/:id',
  authenticate,
  authorize(['opportunities'], ['read']),
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;

      const opportunity = await prisma.opportunity.findUnique({
        where: { id: parseInt(id) },
        include: {
          client: {
            select: { 
              id: true, 
              name: true, 
              phone: true, 
              email: true, 
              address: true,
            },
          },
          vehicle: {
            select: { 
              id: true, 
              plate: true, 
              brand: true, 
              model: true, 
              year: true, 
              color: true, 
              notes: true,
            },
          },
          service: {
            include: {
              status: { select: { id: true, name: true, color: true } },
              mechanic: { select: { id: true, name: true } },
            },
          },
          createdByUser: {
            select: { id: true, name: true },
          },
        },
      });

      if (!opportunity) {
        return res.status(404).json({
          success: false,
          message: 'Oportunidad no encontrada',
        });
      }

      res.json({
        success: true,
        data: opportunity,
      });
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// POST /api/opportunities - Create new opportunity
router.post(
  '/',
  authenticate,
  authorize(['opportunities'], ['create']),
  validate(createOpportunitySchema),
  async (req, res) => {
    try {
      const {
        clientId,
        vehicleId,
        serviceId,
        type,
        description,
        followUpDate,
        status = 'pending',
        notes,
      } = req.body;
      const userId = (req as any).user.userId;

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

      // Verify vehicle exists and belongs to client
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle || vehicle.clientId !== clientId) {
        return res.status(404).json({
          success: false,
          message: 'Vehículo no encontrado o no pertenece al cliente',
        });
      }

      // Verify service if provided
      if (serviceId) {
        const service = await prisma.service.findUnique({
          where: { id: serviceId },
        });

        if (!service || service.clientId !== clientId || service.vehicleId !== vehicleId) {
          return res.status(404).json({
            success: false,
            message: 'Servicio no encontrado o no coincide con el cliente/vehículo',
          });
        }
      }

      const opportunity = await prisma.opportunity.create({
        data: {
          clientId,
          vehicleId,
          serviceId,
          type,
          description,
          followUpDate: new Date(followUpDate),
          status,
          notes,
          createdBy: userId,
        },
        include: {
          client: {
            select: { id: true, name: true, phone: true, email: true },
          },
          vehicle: {
            select: { id: true, plate: true, brand: true, model: true },
          },
          service: {
            select: { id: true, problemDescription: true, totalAmount: true },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: opportunity,
        message: 'Oportunidad creada exitosamente',
      });
    } catch (error) {
      console.error('Error creating opportunity:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// PUT /api/opportunities/:id - Update opportunity
router.put(
  '/:id',
  authenticate,
  authorize(['opportunities'], ['update']),
  validateParams(idParamSchema),
  validate(updateOpportunitySchema.omit({ id: true })),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const existingOpportunity = await prisma.opportunity.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingOpportunity) {
        return res.status(404).json({
          success: false,
          message: 'Oportunidad no encontrada',
        });
      }

      // Convert followUpDate to Date object if provided
      if (updateData.followUpDate) {
        updateData.followUpDate = new Date(updateData.followUpDate);
      }

      const opportunity = await prisma.opportunity.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          client: {
            select: { id: true, name: true, phone: true, email: true },
          },
          vehicle: {
            select: { id: true, plate: true, brand: true, model: true },
          },
          service: {
            select: { id: true, problemDescription: true, totalAmount: true },
          },
        },
      });

      res.json({
        success: true,
        data: opportunity,
        message: 'Oportunidad actualizada exitosamente',
      });
    } catch (error) {
      console.error('Error updating opportunity:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// DELETE /api/opportunities/:id - Delete opportunity
router.delete(
  '/:id',
  authenticate,
  authorize(['opportunities'], ['delete']),
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;

      const existingOpportunity = await prisma.opportunity.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingOpportunity) {
        return res.status(404).json({
          success: false,
          message: 'Oportunidad no encontrada',
        });
      }

      if (existingOpportunity.status === 'converted') {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar una oportunidad que ya ha sido convertida',
        });
      }

      await prisma.opportunity.delete({
        where: { id: parseInt(id) },
      });

      res.json({
        success: true,
        message: 'Oportunidad eliminada exitosamente',
      });
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// POST /api/opportunities/:id/convert - Convert opportunity to appointment/service
router.post(
  '/:id/convert',
  authenticate,
  authorize(['opportunities'], ['update']),
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;

      const existingOpportunity = await prisma.opportunity.findUnique({
        where: { id: parseInt(id) },
        include: {
          client: true,
          vehicle: true,
        },
      });

      if (!existingOpportunity) {
        return res.status(404).json({
          success: false,
          message: 'Oportunidad no encontrada',
        });
      }

      if (existingOpportunity.status === 'converted') {
        return res.status(400).json({
          success: false,
          message: 'La oportunidad ya ha sido convertida',
        });
      }

      if (existingOpportunity.status === 'declined') {
        return res.status(400).json({
          success: false,
          message: 'No se puede convertir una oportunidad rechazada',
        });
      }

      const opportunity = await prisma.opportunity.update({
        where: { id: parseInt(id) },
        data: { status: 'converted' },
        include: {
          client: {
            select: { id: true, name: true, phone: true },
          },
          vehicle: {
            select: { id: true, plate: true, brand: true, model: true },
          },
        },
      });

      res.json({
        success: true,
        data: opportunity,
        message: 'Oportunidad convertida exitosamente. Puede proceder a crear una cita o servicio.',
      });
    } catch (error) {
      console.error('Error converting opportunity:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// POST /api/opportunities/:id/convert-to-appointment - Convert opportunity directly to appointment
router.post(
  '/:id/convert-to-appointment',
  authenticate,
  authorize(['opportunities'], ['update']),
  validateParams(idParamSchema),
  validate(z.object({
    scheduledDate: z.string().min(1, 'Fecha y hora son requeridas'),
    notes: z.string().optional(),
  })),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { scheduledDate, notes } = req.body;
      const userId = (req as any).user.userId;

      const existingOpportunity = await prisma.opportunity.findUnique({
        where: { id: parseInt(id) },
        include: {
          client: true,
          vehicle: true,
        },
      });

      if (!existingOpportunity) {
        return res.status(404).json({
          success: false,
          message: 'Oportunidad no encontrada',
        });
      }

      if (existingOpportunity.status === 'converted') {
        return res.status(400).json({
          success: false,
          message: 'La oportunidad ya ha sido convertida',
        });
      }

      if (existingOpportunity.status === 'declined') {
        return res.status(400).json({
          success: false,
          message: 'No se puede convertir una oportunidad rechazada',
        });
      }

      // Check for conflicting appointments (same vehicle, same day, not cancelled)
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          vehicleId: existingOpportunity.vehicleId,
          scheduledDate: {
            gte: new Date(new Date(scheduledDate).setHours(0, 0, 0, 0)),
            lt: new Date(new Date(scheduledDate).setHours(23, 59, 59, 999)),
          },
          status: {
            not: 'cancelled',
          },
        },
      });

      if (conflictingAppointment) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una cita para este vehículo en la fecha seleccionada',
        });
      }

      // Use transaction to ensure both operations succeed or both fail
      const result = await prisma.$transaction(async (tx) => {
        // Update opportunity status to converted
        const updatedOpportunity = await tx.opportunity.update({
          where: { id: parseInt(id) },
          data: { status: 'converted' },
        });

        // Create appointment with pre-loaded data from opportunity
        const appointment = await tx.appointment.create({
          data: {
            clientId: existingOpportunity.clientId,
            vehicleId: existingOpportunity.vehicleId,
            opportunityId: parseInt(id),
            scheduledDate: new Date(scheduledDate),
            notes: notes || `Cita generada desde oportunidad: ${existingOpportunity.description}`,
            isFromOpportunity: true,
            createdBy: userId,
          },
          include: {
            client: {
              select: { id: true, name: true, phone: true, email: true },
            },
            vehicle: {
              select: { id: true, plate: true, brand: true, model: true, year: true },
            },
            opportunity: {
              select: { id: true, type: true, description: true },
            },
          },
        });

        return { opportunity: updatedOpportunity, appointment };
      });

      res.status(201).json({
        success: true,
        data: result.appointment,
        message: 'Oportunidad convertida en cita exitosamente',
      });
    } catch (error) {
      console.error('Error converting opportunity to appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// GET /api/opportunities/by-client/:clientId - Get opportunities by client
router.get(
  '/by-client/:clientId',
  authenticate,
  authorize(['opportunities'], ['read']),
  validateParams(z.object({ clientId: z.string().transform(val => parseInt(val)) })),
  async (req, res) => {
    try {
      const { clientId } = req.params;

      const opportunities = await prisma.opportunity.findMany({
        where: { clientId: parseInt(clientId as string) },
        orderBy: { followUpDate: 'asc' },
        include: {
          vehicle: {
            select: { id: true, plate: true, brand: true, model: true },
          },
          service: {
            select: { 
              id: true, 
              problemDescription: true, 
              status: { select: { name: true, color: true } },
            },
          },
          createdByUser: {
            select: { id: true, name: true },
          },
        },
      });

      res.json({
        success: true,
        data: opportunities,
      });
    } catch (error) {
      console.error('Error fetching opportunities by client:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

export default router;