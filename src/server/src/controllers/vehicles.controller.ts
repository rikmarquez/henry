import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { CreateVehicleInput, UpdateVehicleInput, VehicleFilterInput } from '../../../shared/schemas';
import { AuthRequest } from '../types/auth.types';

export const vehiclesController = {
  // GET /api/vehicles - Obtener todos los vehículos con paginación y filtros
  getVehicles: async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 10, search, clientId, brand } = req.query as any;
      const skip = (page - 1) * limit;

      let where: any = {};

      if (search) {
        where.OR = [
          { plate: { contains: search, mode: 'insensitive' as const } },
          { brand: { contains: search, mode: 'insensitive' as const } },
          { model: { contains: search, mode: 'insensitive' as const } },
          { color: { contains: search, mode: 'insensitive' as const } },
          { client: { name: { contains: search, mode: 'insensitive' as const } } },
        ];
      }

      if (clientId) {
        where.clientId = parseInt(clientId);
      }

      if (brand) {
        where.brand = { contains: brand, mode: 'insensitive' as const };
      }

      const [vehicles, total] = await Promise.all([
        prisma.vehicle.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              }
            },
            _count: {
              select: {
                appointments: true,
                services: true,
              }
            }
          }
        }),
        prisma.vehicle.count({ where })
      ]);

      return res.json({
        success: true,
        message: 'Vehículos obtenidos exitosamente',
        data: {
          vehicles,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting vehicles:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // GET /api/vehicles/:id - Obtener un vehículo por ID
  getVehicleById: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const vehicle = await prisma.vehicle.findUnique({
        where: { id: parseInt(id) },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              whatsapp: true,
            }
          },
          appointments: {
            orderBy: { scheduledDate: 'desc' },
            take: 10,
            include: {
              services: {
                select: {
                  id: true,
                  problemDescription: true,
                  totalAmount: true,
                }
              }
            }
          },
          services: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              appointment: {
                select: {
                  id: true,
                  scheduledDate: true,
                }
              }
            }
          }
        }
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehículo no encontrado'
        });
      }

      return res.json({
        success: true,
        message: 'Vehículo obtenido exitosamente',
        data: { vehicle }
      });
    } catch (error) {
      console.error('Error getting vehicle:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // POST /api/vehicles - Crear un nuevo vehículo
  createVehicle: async (req: AuthRequest, res: Response) => {
    try {
      const vehicleData: CreateVehicleInput = req.body;

      // Verificar si el cliente existe
      const client = await prisma.client.findUnique({
        where: { id: vehicleData.clientId }
      });

      if (!client) {
        return res.status(400).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      // Verificar si la placa ya existe
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { plate: vehicleData.plate }
      });

      if (existingVehicle) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un vehículo con esta placa'
        });
      }

      const vehicle = await prisma.vehicle.create({
        data: {
          plate: vehicleData.plate,
          brand: vehicleData.brand,
          model: vehicleData.model,
          year: vehicleData.year,
          color: vehicleData.color,
          fuelType: vehicleData.fuelType,
          transmission: vehicleData.transmission,
          engineNumber: vehicleData.engineNumber,
          chassisNumber: vehicleData.chassisNumber,
          notes: vehicleData.notes,
          clientId: vehicleData.clientId,
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            }
          },
          _count: {
            select: {
              appointments: true,
              services: true,
            }
          }
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Vehículo creado exitosamente',
        data: { vehicle }
      });
    } catch (error) {
      console.error('Error creating vehicle:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // PUT /api/vehicles/:id - Actualizar un vehículo
  updateVehicle: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      console.log('🔧 UPDATE DATA RECEIVED:', JSON.stringify(updateData, null, 2));

      // Verificar si el vehículo existe
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingVehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehículo no encontrado'
        });
      }

      // Si se actualiza el clientId, verificar que el cliente existe
      if (updateData.clientId && updateData.clientId !== existingVehicle.clientId) {
        const client = await prisma.client.findUnique({
          where: { id: updateData.clientId }
        });

        if (!client) {
          return res.status(400).json({
            success: false,
            message: 'Cliente no encontrado'
          });
        }
      }

      // Si se actualiza la placa, verificar que no esté en uso por otro vehículo
      if (updateData.plate && updateData.plate !== existingVehicle.plate) {
        const plateExists = await prisma.vehicle.findFirst({
          where: {
            plate: updateData.plate,
            id: { not: parseInt(id) }
          }
        });

        if (plateExists) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe otro vehículo con esta placa'
          });
        }
      }

      const vehicleUpdateData: any = { ...updateData };

      const vehicle = await prisma.vehicle.update({
        where: { id: parseInt(id) },
        data: vehicleUpdateData,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            }
          },
          _count: {
            select: {
              appointments: true,
              services: true,
            }
          }
        }
      });

      return res.json({
        success: true,
        message: 'Vehículo actualizado exitosamente',
        data: { vehicle }
      });
    } catch (error) {
      console.error('Error updating vehicle:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // DELETE /api/vehicles/:id - Eliminar un vehículo (soft delete)
  deleteVehicle: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Verificar si el vehículo existe y tiene citas activas
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { id: parseInt(id) },
        include: {
          appointments: {
            where: {
              status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
            }
          },
          services: {
            where: {
              status: { in: ['PENDING', 'IN_PROGRESS'] }
            }
          }
        }
      });

      if (!existingVehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehículo no encontrado'
        });
      }

      // Verificar si tiene citas o servicios activos
      if (existingVehicle.appointments.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el vehículo porque tiene citas activas'
        });
      }

      if (existingVehicle.services.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el vehículo porque tiene servicios activos'
        });
      }

      // Hard delete por ahora (en producción sería soft delete)
      const vehicle = await prisma.vehicle.delete({
        where: { id: parseInt(id) }
      });

      return res.json({
        success: true,
        message: 'Vehículo desactivado exitosamente',
        data: { vehicle }
      });
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // POST /api/vehicles/:id/activate - Reactivar un vehículo
  activateVehicle: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Esta funcionalidad no aplica sin isActive
      return res.status(400).json({
        success: false,
        message: 'Funcionalidad no disponible - no hay soft delete implementado'
      });

      return res.json({
        success: true,
        message: 'Vehículo reactivado exitosamente',
        data: { vehicle }
      });
    } catch (error) {
      console.error('Error activating vehicle:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Vehículo no encontrado'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // GET /api/vehicles/by-client/:clientId - Obtener vehículos por cliente
  getVehiclesByClient: async (req: AuthRequest, res: Response) => {
    try {
      const { clientId } = req.params;

      const vehicles = await prisma.vehicle.findMany({
        where: {
          clientId: parseInt(clientId)
        },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              appointments: true,
              services: true,
            }
          }
        }
      });

      return res.json({
        success: true,
        message: 'Vehículos obtenidos exitosamente',
        data: { vehicles }
      });
    } catch (error) {
      console.error('Error getting vehicles by client:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};