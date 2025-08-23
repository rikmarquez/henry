import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate, validateQuery, validateParams } from '../middleware/validation.middleware';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentFilterSchema,
} from '../../../shared/schemas';
import { z } from 'zod';
import { idParamSchema } from '../../../shared/schemas/common.schema';

const router = Router();
const prisma = new PrismaClient();

// GET /api/appointments - List appointments with pagination and filters
router.get(
  '/',
  authenticate,
  authorize(['appointments'], ['read']),
  validateQuery(appointmentFilterSchema),
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search, 
        clientId, 
        vehicleId, 
        status, 
        dateFrom, 
        dateTo 
      } = req.query;
      const offset = (page - 1) * limit;

      const where: any = {};

      // Search filter (by client name, vehicle plate, or notes)
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

      // Filter by status
      if (status) {
        where.status = status;
      }

      // Date range filter
      if (dateFrom || dateTo) {
        where.scheduledDate = {};
        if (dateFrom) {
          where.scheduledDate.gte = new Date(dateFrom as string);
        }
        if (dateTo) {
          where.scheduledDate.lte = new Date(dateTo as string);
        }
      }

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { scheduledDate: 'asc' },
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
            createdByUser: {
              select: { id: true, name: true },
            },
            _count: {
              select: {
                services: true,
              },
            },
          },
        }),
        prisma.appointment.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          appointments,
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
      console.error('Error fetching appointments:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// GET /api/appointments/:id - Get specific appointment with details
router.get(
  '/:id',
  authenticate,
  authorize(['appointments'], ['read']),
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;

      const appointment = await prisma.appointment.findUnique({
        where: { id: parseInt(id) },
        include: {
          client: {
            select: { id: true, name: true, phone: true, email: true, address: true },
          },
          vehicle: {
            select: { id: true, plate: true, brand: true, model: true, year: true, color: true, notes: true },
          },
          opportunity: {
            select: { id: true, type: true, description: true, status: true },
          },
          createdByUser: {
            select: { id: true, name: true },
          },
          services: {
            include: {
              status: true,
              mechanic: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada',
        });
      }

      res.json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      console.error('Error fetching appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// Schema for phone appointments (minimal data)
const phoneAppointmentSchema = z.object({
  type: z.literal('phone'),
  clientName: z.string().min(1, 'Nombre del cliente es requerido'),
  clientPhone: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos'),
  vehicleDescription: z.string().min(1, 'Descripción del vehículo es requerida'),
  scheduledDate: z.string().min(1, 'Fecha y hora son requeridas'),
  notes: z.string().optional(),
});

// POST /api/appointments/phone - Create phone appointment with minimal data
router.post(
  '/phone',
  authenticate,
  authorize(['appointments'], ['create']),
  validate(phoneAppointmentSchema),
  async (req, res) => {
    try {
      const { clientName, clientPhone, vehicleDescription, scheduledDate, notes } = req.body;
      const userId = (req as any).user.userId;

      // Check if client already exists by phone
      let client = await prisma.client.findFirst({
        where: { phone: clientPhone },
        include: {
          vehicles: true, // Include vehicles to check if this vehicle already exists
        },
      });

      // If client doesn't exist, create new one
      if (!client) {
        client = await prisma.client.create({
          data: {
            name: clientName,
            phone: clientPhone,
            whatsapp: clientPhone, // Unify phone and WhatsApp
          },
          include: {
            vehicles: true,
          },
        });
      } else {
        // Client exists - update name if it's different (in case they gave a more complete name)
        if (client.name !== clientName && clientName.length > client.name.length) {
          client = await prisma.client.update({
            where: { id: client.id },
            data: { name: clientName },
            include: { vehicles: true },
          });
        }
      }

      // Parse vehicle description to extract brand/model if possible
      const vehicleParts = vehicleDescription.trim().split(' ');
      const brand = vehicleParts[0] || 'N/A';
      const model = vehicleParts.slice(1).join(' ') || 'Modelo pendiente';

      // Check if this vehicle already exists for this client
      // We'll match by brand/model combination in the description
      let vehicle = client.vehicles.find(v => {
        const existingDesc = `${v.brand} ${v.model}`.toLowerCase();
        const newDesc = vehicleDescription.toLowerCase();
        return existingDesc.includes(newDesc.split(' ')[0]) || newDesc.includes(v.brand.toLowerCase());
      });

      if (!vehicle) {
        // Create a new vehicle with temporary plate for phone appointments
        const tempPlate = `TEMP-${Date.now()}`;
        
        vehicle = await prisma.vehicle.create({
          data: {
            plate: tempPlate,
            brand: brand,
            model: model,
            clientId: client.id,
            notes: `Cita telefónica - Descripción original: ${vehicleDescription}. Placa pendiente de capturar al llegar.`,
          },
        });
      }

      // Create the appointment
      const appointment = await prisma.appointment.create({
        data: {
          clientId: client.id,
          vehicleId: vehicle.id,
          scheduledDate: new Date(scheduledDate),
          notes: notes || `Cita telefónica - Vehículo: ${vehicleDescription}`,
          isFromOpportunity: false,
          createdBy: userId,
        },
        include: {
          client: {
            select: { id: true, name: true, phone: true, email: true },
          },
          vehicle: {
            select: { id: true, plate: true, brand: true, model: true },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: appointment,
        message: 'Cita telefónica creada exitosamente',
      });
    } catch (error) {
      console.error('Error creating phone appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// POST /api/appointments - Create new appointment
router.post(
  '/',
  authenticate,
  authorize(['appointments'], ['create']),
  validate(createAppointmentSchema),
  async (req, res) => {
    try {
      const { clientId, vehicleId, opportunityId, scheduledDate, notes, isFromOpportunity } = req.body;
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

      // Check for conflicting appointments (same vehicle, same day, not cancelled)
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          vehicleId,
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

      const appointment = await prisma.appointment.create({
        data: {
          clientId,
          vehicleId,
          opportunityId,
          scheduledDate: new Date(scheduledDate),
          notes,
          isFromOpportunity: isFromOpportunity || false,
          createdBy: userId,
        },
        include: {
          client: {
            select: { id: true, name: true, phone: true, email: true },
          },
          vehicle: {
            select: { id: true, plate: true, brand: true, model: true },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: appointment,
        message: 'Cita creada exitosamente',
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// PUT /api/appointments/:id - Update appointment
router.put(
  '/:id',
  authenticate,
  authorize(['appointments'], ['update']),
  validateParams(idParamSchema),
  validate(updateAppointmentSchema.omit({ id: true })),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const existingAppointment = await prisma.appointment.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingAppointment) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada',
        });
      }

      // If updating scheduled date, check for conflicts
      if (updateData.scheduledDate) {
        const conflictingAppointment = await prisma.appointment.findFirst({
          where: {
            id: { not: parseInt(id) },
            vehicleId: updateData.vehicleId || existingAppointment.vehicleId,
            scheduledDate: {
              gte: new Date(new Date(updateData.scheduledDate).setHours(0, 0, 0, 0)),
              lt: new Date(new Date(updateData.scheduledDate).setHours(23, 59, 59, 999)),
            },
            status: { not: 'cancelled' },
          },
        });

        if (conflictingAppointment) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe una cita para este vehículo en la fecha seleccionada',
          });
        }
      }

      // Convert scheduledDate to Date object if provided
      if (updateData.scheduledDate) {
        updateData.scheduledDate = new Date(updateData.scheduledDate);
      }

      const appointment = await prisma.appointment.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          client: {
            select: { id: true, name: true, phone: true, email: true },
          },
          vehicle: {
            select: { id: true, plate: true, brand: true, model: true },
          },
        },
      });

      res.json({
        success: true,
        data: appointment,
        message: 'Cita actualizada exitosamente',
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// DELETE /api/appointments/:id - Cancel appointment
router.delete(
  '/:id',
  authenticate,
  authorize(['appointments'], ['delete']),
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;

      const existingAppointment = await prisma.appointment.findUnique({
        where: { id: parseInt(id) },
        include: {
          services: true,
        },
      });

      if (!existingAppointment) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada',
        });
      }

      if (existingAppointment.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: 'La cita ya está cancelada',
        });
      }

      // Check if appointment has associated services in progress
      const servicesInProgress = existingAppointment.services.some(
        service => service.completedAt === null
      );

      if (servicesInProgress) {
        return res.status(400).json({
          success: false,
          message: 'No se puede cancelar una cita con servicios en progreso',
        });
      }

      const appointment = await prisma.appointment.update({
        where: { id: parseInt(id) },
        data: { status: 'cancelled' },
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
        data: appointment,
        message: 'Cita cancelada exitosamente',
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// POST /api/appointments/:id/confirm - Confirm appointment
router.post(
  '/:id/confirm',
  authenticate,
  authorize(['appointments'], ['update']),
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;

      const existingAppointment = await prisma.appointment.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingAppointment) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada',
        });
      }

      if (existingAppointment.status !== 'scheduled') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden confirmar citas programadas',
        });
      }

      const appointment = await prisma.appointment.update({
        where: { id: parseInt(id) },
        data: { status: 'confirmed' },
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
        data: appointment,
        message: 'Cita confirmada exitosamente',
      });
    } catch (error) {
      console.error('Error confirming appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// POST /api/appointments/:id/complete - Complete appointment
router.post(
  '/:id/complete',
  authenticate,
  authorize(['appointments'], ['update']),
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const { id } = req.params;

      const existingAppointment = await prisma.appointment.findUnique({
        where: { id: parseInt(id) },
        include: {
          services: true,
        },
      });

      if (!existingAppointment) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada',
        });
      }

      if (existingAppointment.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'La cita ya está completada',
        });
      }

      if (existingAppointment.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: 'No se puede completar una cita cancelada',
        });
      }

      const userId = (req as any).user.userId;
      const branchId = (req as any).user.branchId;

      // If no services exist, create one automatically
      if (existingAppointment.services.length === 0) {
        const result = await prisma.$transaction(async (tx) => {
          // Update appointment status
          const appointment = await tx.appointment.update({
            where: { id: parseInt(id) },
            data: { status: 'completed' },
            include: {
              client: {
                select: { id: true, name: true, phone: true },
              },
              vehicle: {
                select: { id: true, plate: true, brand: true, model: true },
              },
            },
          });

          // Create associated service with RECIBIDO status (id: 1)
          const service = await tx.service.create({
            data: {
              appointmentId: parseInt(id),
              clientId: existingAppointment.clientId,
              vehicleId: existingAppointment.vehicleId,
              statusId: 1, // RECIBIDO
              problemDescription: existingAppointment.notes || 'Servicio generado desde cita completada',
              totalAmount: 0,
              mechanicCommission: 0,
              createdBy: userId,
              branchId: branchId,
            },
            include: {
              client: {
                select: { id: true, name: true, phone: true },
              },
              vehicle: {
                select: { id: true, plate: true, brand: true, model: true },
              },
              status: {
                select: { id: true, name: true, color: true },
              },
            },
          });

          return { appointment, service };
        });

        return res.json({
          success: true,
          data: {
            appointment: result.appointment,
            service: result.service,
          },
          message: 'Cita completada y servicio creado exitosamente',
        });
      }

      // If services exist, check if all are completed
      const incompletedServices = existingAppointment.services.some(
        service => service.completedAt === null
      );

      if (incompletedServices) {
        return res.status(400).json({
          success: false,
          message: 'No se puede completar la cita hasta que todos los servicios estén finalizados',
        });
      }

      const appointment = await prisma.appointment.update({
        where: { id: parseInt(id) },
        data: { status: 'completed' },
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
        data: appointment,
        message: 'Cita completada exitosamente',
      });
    } catch (error) {
      console.error('Error completing appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

export default router;