import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { vehicleReceptionSchema } from '../../../shared/schemas/service.schema';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/reception/receive-vehicle
 * Recibir un vehículo y crear el servicio automáticamente
 */
router.post(
  '/receive-vehicle',
  authenticate,
  authorize('reception', 'create'),
  validate(vehicleReceptionSchema),
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const branchId = req.user?.branchId;

      if (!userId || !branchId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const {
        appointmentId,
        clientId,
        vehicleId,
        kilometraje,
        nivelCombustible,
        lucesOk,
        llantasOk,
        cristalesOk,
        carroceriaOk,
        observacionesRecepcion,
        firmaCliente,
        fotosRecepcion,
      } = req.body;

      // Crear el servicio con los datos de recepción
      const service = await prisma.service.create({
        data: {
          // Datos básicos del servicio
          clientId,
          vehicleId,
          appointmentId: appointmentId || null,
          statusId: 1, // Estado "Recibido"
          branchId,
          createdBy: userId,

          // Datos de recepción
          receivedBy: userId,
          receivedAt: new Date(),
          kilometraje,
          nivelCombustible,
          lucesOk,
          llantasOk,
          cristalesOk,
          carroceriaOk,
          observacionesRecepcion,
          firmaCliente,
          fotosRecepcion: fotosRecepcion || [],

          // Valores iniciales para campos de servicio
          mechanicId: null,
          laborPrice: 0,
          partsPrice: 0,
          partsCost: 0,
          totalAmount: 0,
          truput: 0,
          mechanicCommission: 0,
        },
        include: {
          client: true,
          vehicle: true,
          receptionist: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          status: true,
          appointment: true,
        },
      });

      // Si hay una cita asociada, marcarla como "received"
      if (appointmentId) {
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: 'received' },
        });
      }

      // Serializar BigInt para JSON
      const serializedService = JSON.parse(
        JSON.stringify(service, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      );

      res.status(201).json({
        message: 'Vehículo recibido exitosamente',
        service: serializedService,
      });
    } catch (error) {
      console.error('Error al recibir vehículo:', error);
      res.status(500).json({ message: 'Error al recibir vehículo' });
    }
  }
);

/**
 * GET /api/reception/today
 * Obtener las citas del día de hoy
 */
router.get(
  '/today',
  authenticate,
  authorize('reception', 'read'),
  async (req, res) => {
    try {
      const branchId = req.user?.branchId;

      if (!branchId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      // Obtener fecha de inicio y fin del día de hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointments = await prisma.appointment.findMany({
        where: {
          branchId,
          scheduledDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          client: true,
          vehicle: true,
          services: {
            include: {
              status: true,
            },
          },
        },
        orderBy: {
          scheduledDate: 'asc',
        },
      });

      // Serializar BigInt para JSON
      const serializedAppointments = JSON.parse(
        JSON.stringify(appointments, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      );

      res.json(serializedAppointments);
    } catch (error) {
      console.error('Error al obtener citas del día:', error);
      res.status(500).json({ message: 'Error al obtener citas del día' });
    }
  }
);

/**
 * GET /api/reception/service/:id
 * Obtener detalles completos de un servicio incluyendo datos de recepción
 */
router.get(
  '/service/:id',
  authenticate,
  authorize('reception', 'read'),
  async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);

      if (isNaN(serviceId)) {
        return res.status(400).json({ message: 'ID de servicio inválido' });
      }

      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          client: true,
          vehicle: true,
          receptionist: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          mechanic: true,
          status: true,
          appointment: true,
        },
      });

      if (!service) {
        return res.status(404).json({ message: 'Servicio no encontrado' });
      }

      // Serializar BigInt para JSON
      const serializedService = JSON.parse(
        JSON.stringify(service, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      );

      res.json(serializedService);
    } catch (error) {
      console.error('Error al obtener servicio:', error);
      res.status(500).json({ message: 'Error al obtener servicio' });
    }
  }
);

export default router;
