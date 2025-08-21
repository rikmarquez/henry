import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { CreateClientInput, UpdateClientInput, ClientFilterInput } from '../../../shared/schemas';
import { AuthRequest } from '../types/auth.types';

export const clientsController = {
  // GET /api/clients - Obtener todos los clientes con paginación y filtros
  getClients: async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 10, search } = req.query as any;
      const skip = (page - 1) * limit;

      const where = search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
        ]
      } : {};

      const [clients, total] = await Promise.all([
        prisma.client.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            vehicles: {
              select: {
                id: true,
                brand: true,
                model: true,
                year: true,
                plate: true,
              }
            },
            _count: {
              select: {
                appointments: true,
                vehicles: true,
              }
            }
          }
        }),
        prisma.client.count({ where })
      ]);

      return res.json({
        success: true,
        message: 'Clientes obtenidos exitosamente',
        data: {
          clients,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting clients:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // GET /api/clients/:id - Obtener un cliente por ID
  getClientById: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const client = await prisma.client.findUnique({
        where: { id: parseInt(id) },
        include: {
          vehicles: {
            orderBy: { createdAt: 'desc' }
          },
          appointments: {
            orderBy: { scheduledDate: 'desc' },
            take: 10,
            include: {
              vehicle: {
                select: {
                  brand: true,
                  model: true,
                  year: true,
                  plate: true,
                }
              },
              services: {
                select: {
                  id: true,
                  problemDescription: true,
                  totalAmount: true,
                }
              }
            }
          }
        }
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      return res.json({
        success: true,
        message: 'Cliente obtenido exitosamente',
        data: { client }
      });
    } catch (error) {
      console.error('Error getting client:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // POST /api/clients - Crear un nuevo cliente
  createClient: async (req: AuthRequest, res: Response) => {
    try {
      const clientData: CreateClientInput = req.body;

      // Verificar si el email ya existe (si se proporciona)
      if (clientData.email) {
        const existingClient = await prisma.client.findFirst({
          where: { email: clientData.email }
        });

        if (existingClient) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un cliente con este email'
          });
        }
      }

      // Unify phone and WhatsApp - use whatsapp as primary, phone as backup
      const unifiedData = {
        ...clientData,
        phone: clientData.whatsapp, // Copy whatsapp to phone
        whatsapp: clientData.whatsapp, // Keep whatsapp as is
      };

      const client = await prisma.client.create({
        data: unifiedData,
        include: {
          _count: {
            select: {
              vehicles: true,
              appointments: true,
            }
          }
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Cliente creado exitosamente',
        data: { client }
      });
    } catch (error) {
      console.error('Error creating client:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // PUT /api/clients/:id - Actualizar un cliente
  updateClient: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Verificar si el cliente existe
      const existingClient = await prisma.client.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingClient) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      // Si se actualiza el email, verificar que no esté en uso por otro cliente
      if (updateData.email && updateData.email !== existingClient.email) {
        const emailExists = await prisma.client.findFirst({
          where: {
            email: updateData.email,
            id: { not: parseInt(id) }
          }
        });

        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe otro cliente con este email'
          });
        }
      }

      // Unify phone and WhatsApp if whatsapp is being updated
      const unifiedUpdateData = {
        ...updateData,
        ...(updateData.whatsapp && { phone: updateData.whatsapp }), // If whatsapp is updated, copy to phone
      };

      const client = await prisma.client.update({
        where: { id: parseInt(id) },
        data: unifiedUpdateData,
        include: {
          _count: {
            select: {
              vehicles: true,
              appointments: true,
            }
          }
        }
      });

      return res.json({
        success: true,
        message: 'Cliente actualizado exitosamente',
        data: { client }
      });
    } catch (error) {
      console.error('Error updating client:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // DELETE /api/clients/:id - Eliminar un cliente (soft delete)
  deleteClient: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Verificar si el cliente existe
      const existingClient = await prisma.client.findUnique({
        where: { id: parseInt(id) },
        include: {
          vehicles: true,
          appointments: {
            where: {
              status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
            }
          }
        }
      });

      if (!existingClient) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      // Verificar si tiene citas activas
      if (existingClient.appointments.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el cliente porque tiene citas activas'
        });
      }

      // Soft delete: marcar como inactivo
      const client = await prisma.client.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
      });

      return res.json({
        success: true,
        message: 'Cliente desactivado exitosamente',
        data: { client }
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // POST /api/clients/:id/activate - Reactivar un cliente
  activateClient: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const client = await prisma.client.update({
        where: { id: parseInt(id) },
        data: { isActive: true }
      });

      return res.json({
        success: true,
        message: 'Cliente reactivado exitosamente',
        data: { client }
      });
    } catch (error) {
      console.error('Error activating client:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};