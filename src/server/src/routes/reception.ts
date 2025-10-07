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
  authorize(['reception'], ['create']),
  validate(vehicleReceptionSchema),
  async (req, res) => {
    try {
      const userId = req.user?.userId;
      const branchId = req.user?.branchId;

      console.log('[Reception] req.user:', req.user);
      console.log('[Reception] userId:', userId);
      console.log('[Reception] branchId:', branchId);

      if (!userId || !branchId) {
        console.log('[Reception] ERROR: userId o branchId faltante');
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const {
        appointmentId,
        clientId,
        vehicleId,
        kilometraje,
        nivelCombustible,
        aireAcondicionadoOk,
        cristalesOk,
        candadoLlantaOk,
        pertenenciasCajuelaOk,
        manijasOk,
        observacionesRecepcion,
        firmaCliente,
        fotosRecepcion,
        vehicleUpdates,
      } = req.body;

      // Si hay actualizaciones de vehículo, procesarlas primero
      let finalVehicleId = vehicleId;
      if (vehicleUpdates && Object.keys(vehicleUpdates).length > 0) {
        // Si se está actualizando la placa, verificar duplicados
        if (vehicleUpdates.plate) {
          const existingVehicle = await prisma.vehicle.findUnique({
            where: { plate: vehicleUpdates.plate },
            include: {
              client: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                }
              }
            }
          });

          // Si existe un vehículo con esa placa y NO es el vehículo actual
          if (existingVehicle && existingVehicle.id !== vehicleId) {
            const isSameClient = existingVehicle.clientId === clientId;

            return res.status(409).json({
              code: 'DUPLICATE_PLATE',
              message: 'La placa ya existe en el sistema',
              canMerge: isSameClient,
              existingVehicle: {
                id: existingVehicle.id,
                plate: existingVehicle.plate,
                brand: existingVehicle.brand,
                model: existingVehicle.model,
                year: existingVehicle.year,
                color: existingVehicle.color,
                client: existingVehicle.client,
              },
              tempVehicle: {
                id: vehicleId,
              }
            });
          }
        }

        // Si no hay conflicto, actualizar el vehículo
        await prisma.vehicle.update({
          where: { id: vehicleId },
          data: vehicleUpdates,
        });
      }

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
          aireAcondicionadoOk,
          cristalesOk,
          candadoLlantaOk,
          pertenenciasCajuelaOk,
          manijasOk,
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
  authorize(['reception'], ['read']),
  async (req, res) => {
    try {
      const branchId = req.user?.branchId;

      if (!branchId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      // Obtener fecha de inicio y fin del día de hoy en zona horaria México (UTC-6)
      // Railway usa UTC, necesitamos convertir a hora local de México
      const nowUTC = new Date();
      const mexicoOffsetHours = -6;
      const mexicoTime = new Date(nowUTC.getTime() + (mexicoOffsetHours * 60 * 60 * 1000));

      // Crear fecha "hoy" a las 00:00 hora México, pero en UTC
      // Si en México son las 8:50 PM del sábado 4, en UTC son las 2:50 AM del domingo 5
      // Queremos buscar citas del sábado 4 (00:00 a 23:59 hora México)
      // En UTC eso es: sábado 4 a las 06:00 hasta domingo 5 a las 05:59
      const todayMexico = new Date(mexicoTime.getFullYear(), mexicoTime.getMonth(), mexicoTime.getDate());
      const today = new Date(todayMexico.getTime() - (mexicoOffsetHours * 60 * 60 * 1000)); // Convertir a UTC
      const tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000));

      console.log('[RECEPTION] Hora UTC servidor:', nowUTC.toISOString());
      console.log('[RECEPTION] Hora México:', mexicoTime.toISOString());
      console.log('[RECEPTION] Buscando citas para branchId:', branchId);
      console.log('[RECEPTION] Rango de fechas UTC:', {
        today: today.toISOString(),
        tomorrow: tomorrow.toISOString()
      });

      const appointments = await prisma.appointment.findMany({
        where: {
          branchId,
          scheduledDate: {
            gte: today,
            lt: tomorrow,
          },
          status: {
            not: 'cancelled', // Excluir solo las citas canceladas
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

      console.log('[RECEPTION] Citas encontradas:', appointments.length);

      // Serializar BigInt para JSON
      const serializedAppointments = JSON.parse(
        JSON.stringify(appointments, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      );

      res.json(serializedAppointments);
    } catch (error) {
      console.error('[RECEPTION] Error al obtener citas del día:', error);
      res.status(500).json({
        message: 'Error al obtener citas del día',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/reception/merge-vehicle
 * Merge de vehículo temporal con vehículo existente (mismo cliente)
 */
router.post(
  '/merge-vehicle',
  authenticate,
  authorize(['reception'], ['create']),
  async (req, res) => {
    try {
      const { tempVehicleId, existingVehicleId, appointmentId } = req.body;

      if (!tempVehicleId || !existingVehicleId) {
        return res.status(400).json({ message: 'IDs de vehículos requeridos' });
      }

      // Verificar que ambos vehículos existan
      const [tempVehicle, existingVehicle] = await Promise.all([
        prisma.vehicle.findUnique({ where: { id: tempVehicleId } }),
        prisma.vehicle.findUnique({ where: { id: existingVehicleId } }),
      ]);

      if (!tempVehicle || !existingVehicle) {
        return res.status(404).json({ message: 'Vehículo no encontrado' });
      }

      // Verificar que sean del mismo cliente (seguridad)
      if (tempVehicle.clientId !== existingVehicle.clientId) {
        return res.status(403).json({ message: 'Los vehículos no pertenecen al mismo cliente' });
      }

      // Actualizar la cita para usar el vehículo existente
      if (appointmentId) {
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { vehicleId: existingVehicleId },
        });
      }

      // Eliminar el vehículo temporal
      await prisma.vehicle.delete({
        where: { id: tempVehicleId },
      });

      res.json({
        success: true,
        message: 'Vehículos fusionados exitosamente',
        mergedVehicleId: existingVehicleId,
      });
    } catch (error) {
      console.error('Error al fusionar vehículos:', error);
      res.status(500).json({ message: 'Error al fusionar vehículos' });
    }
  }
);

/**
 * GET /api/reception/received-today
 * Obtener todos los servicios recibidos hoy (statusId = 1)
 */
router.get(
  '/received-today',
  authenticate,
  authorize(['reception'], ['read']),
  async (req, res) => {
    try {
      const branchId = req.user?.branchId;

      if (!branchId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      // Obtener fecha de inicio y fin del día de hoy en zona horaria México (UTC-6)
      const nowUTC = new Date();
      const mexicoOffsetHours = -6;
      const mexicoTime = new Date(nowUTC.getTime() + (mexicoOffsetHours * 60 * 60 * 1000));

      const todayMexico = new Date(mexicoTime.getFullYear(), mexicoTime.getMonth(), mexicoTime.getDate());
      const today = new Date(todayMexico.getTime() - (mexicoOffsetHours * 60 * 60 * 1000)); // Convertir a UTC
      const tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000));

      console.log('[RECEPTION] Buscando servicios recibidos para branchId:', branchId);
      console.log('[RECEPTION] Rango de fechas UTC:', {
        today: today.toISOString(),
        tomorrow: tomorrow.toISOString()
      });

      const services = await prisma.service.findMany({
        where: {
          branchId,
          receivedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
              whatsapp: true,
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
            },
          },
          receptionist: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          status: true,
          appointment: {
            select: {
              id: true,
              scheduledDate: true,
            },
          },
        },
        orderBy: {
          receivedAt: 'desc',
        },
      });

      console.log('[RECEPTION] Servicios recibidos encontrados:', services.length);

      // Serializar BigInt para JSON
      const serializedServices = JSON.parse(
        JSON.stringify(services, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      );

      res.json(serializedServices);
    } catch (error) {
      console.error('[RECEPTION] Error al obtener servicios recibidos:', error);
      res.status(500).json({
        message: 'Error al obtener servicios recibidos',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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
  authorize(['reception'], ['read']),
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
