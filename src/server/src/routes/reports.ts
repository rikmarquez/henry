import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateQuery } from '../middleware/validation.middleware';

const router = Router();
const prisma = new PrismaClient();

// Common date range validation schema
const dateRangeSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// GET /api/reports/dashboard - Dashboard metrics
router.get(
  '/dashboard',
  authenticate,
  authorize(['reports'], ['read']),
  validateQuery(dateRangeSchema),
  async (req, res) => {
    try {
      const { dateFrom, dateTo } = req.query;

      const dateFilter: any = {};
      if (dateFrom || dateTo) {
        if (dateFrom) dateFilter.gte = new Date(dateFrom as string);
        if (dateTo) dateFilter.lte = new Date(dateTo as string);
      }

      const [
        // Counts
        totalClients,
        totalVehicles,
        totalMechanics,
        totalAppointments,
        totalServices,
        totalOpportunities,

        // Active counts
        activeClients,
        activeMechanics,
        pendingAppointments,
        inProgressServices,
        pendingOpportunities,

        // Revenue
        totalRevenue,
        recentServices,
      ] = await Promise.all([
        // Total counts
        prisma.client.count(),
        prisma.vehicle.count(),
        prisma.mechanic.count(),
        prisma.appointment.count(dateFilter.gte || dateFilter.lte ? { where: { createdAt: dateFilter } } : {}),
        prisma.service.count(dateFilter.gte || dateFilter.lte ? { where: { createdAt: dateFilter } } : {}),
        prisma.opportunity.count(dateFilter.gte || dateFilter.lte ? { where: { createdAt: dateFilter } } : {}),

        // Active counts (clients don't have isActive field, so using total)
        prisma.client.count(),
        prisma.mechanic.count({ where: { isActive: true } }),
        prisma.appointment.count({ 
          where: { 
            status: { in: ['scheduled', 'confirmed'] },
            ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
          }
        }),
        prisma.service.count({ 
          where: { 
            completedAt: null,
            ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
          }
        }),
        prisma.opportunity.count({ 
          where: { 
            status: { in: ['pending', 'contacted', 'interested'] },
            ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
          }
        }),

        // Revenue calculation
        prisma.service.aggregate({
          _sum: { totalAmount: true },
          where: {
            completedAt: { not: null },
            ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
          },
        }),

        // Recent services for quick overview
        prisma.service.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
          include: {
            client: { select: { name: true } },
            vehicle: { select: { plate: true, brand: true, model: true } },
            status: { select: { name: true, color: true } },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          overview: {
            totalClients,
            totalVehicles,
            totalMechanics,
            totalAppointments,
            totalServices,
            totalOpportunities,
          },
          active: {
            activeClients,
            activeMechanics,
            pendingAppointments,
            inProgressServices,
            pendingOpportunities,
          },
          revenue: {
            total: totalRevenue._sum.totalAmount || 0,
            period: dateFrom && dateTo ? 'custom' : 'all-time',
          },
          recentServices,
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// GET /api/reports/services - Service reports
router.get(
  '/services',
  authenticate,
  authorize(['reports'], ['read']),
  validateQuery(dateRangeSchema),
  async (req, res) => {
    try {
      const { dateFrom, dateTo } = req.query;

      const dateFilter: any = {};
      if (dateFrom || dateTo) {
        if (dateFrom) dateFilter.gte = new Date(dateFrom as string);
        if (dateTo) dateFilter.lte = new Date(dateTo as string);
      }

      const [
        servicesByStatus,
        servicesByMechanic,
        averageServiceValue,
        completionStats,
        revenueByMonth,
      ] = await Promise.all([
        // Services grouped by status
        prisma.service.groupBy({
          by: ['statusId'],
          _count: { id: true },
          where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
        }),

        // Services grouped by mechanic
        prisma.service.groupBy({
          by: ['mechanicId'],
          _count: { id: true },
          _sum: { totalAmount: true, mechanicCommission: true },
          where: {
            mechanicId: { not: null },
            ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
          },
        }),

        // Average service value
        prisma.service.aggregate({
          _avg: { totalAmount: true },
          _count: { id: true },
          where: {
            totalAmount: { gt: 0 },
            ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
          },
        }),

        // Completion statistics
        Promise.all([
          prisma.service.count({
            where: {
              completedAt: { not: null },
              ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
            },
          }),
          prisma.service.count({
            where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
          }),
        ]).then(([completed, total]) => ({
          completed,
          total,
          completionRate: total > 0 ? (completed / total) * 100 : 0,
        })),

        // Revenue by month (last 6 months)
        prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('month', created_at) as month,
            SUM(total_amount) as revenue,
            COUNT(*) as services_count
          FROM services 
          WHERE completed_at IS NOT NULL
            AND created_at >= NOW() - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', created_at)
          ORDER BY month DESC
        `,
      ]);

      // Enhance grouped data with related information
      const statuses = await prisma.workStatus.findMany({
        select: { id: true, name: true, color: true },
      });

      const mechanics = await prisma.mechanic.findMany({
        select: { id: true, name: true },
      });

      const enhancedServicesByStatus = servicesByStatus.map(item => ({
        ...item,
        status: statuses.find(s => s.id === item.statusId),
      }));

      const enhancedServicesByMechanic = servicesByMechanic.map(item => ({
        ...item,
        mechanic: mechanics.find(m => m.id === item.mechanicId),
      }));

      res.json({
        success: true,
        data: {
          servicesByStatus: enhancedServicesByStatus,
          servicesByMechanic: enhancedServicesByMechanic,
          averageServiceValue: averageServiceValue._avg.totalAmount || 0,
          totalServices: averageServiceValue._count.id,
          completion: completionStats,
          revenueByMonth,
        },
      });
    } catch (error) {
      console.error('Error fetching service reports:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// GET /api/reports/appointments - Appointment reports
router.get(
  '/appointments',
  authenticate,
  authorize(['reports'], ['read']),
  validateQuery(dateRangeSchema),
  async (req, res) => {
    try {
      const { dateFrom, dateTo } = req.query;

      const dateFilter: any = {};
      if (dateFrom || dateTo) {
        if (dateFrom) dateFilter.gte = new Date(dateFrom as string);
        if (dateTo) dateFilter.lte = new Date(dateTo as string);
      }

      const [
        appointmentsByStatus,
        appointmentsByMonth,
        upcomingAppointments,
        conversionStats,
      ] = await Promise.all([
        // Appointments grouped by status
        prisma.appointment.groupBy({
          by: ['status'],
          _count: { id: true },
          where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
        }),

        // Appointments by month
        prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('month', scheduled_date) as month,
            COUNT(*) as appointments_count,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
          FROM appointments 
          WHERE scheduled_date >= NOW() - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', scheduled_date)
          ORDER BY month DESC
        `,

        // Upcoming appointments (next 7 days)
        prisma.appointment.findMany({
          where: {
            scheduledDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            status: { in: ['scheduled', 'confirmed'] },
          },
          orderBy: { scheduledDate: 'asc' },
          include: {
            client: { select: { name: true, phone: true } },
            vehicle: { select: { plate: true, brand: true, model: true } },
          },
        }),

        // Conversion stats (appointments to services)
        Promise.all([
          prisma.appointment.count({
            where: {
              status: 'completed',
              ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
            },
          }),
          prisma.service.count({
            where: {
              appointmentId: { not: null },
              ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
            },
          }),
        ]).then(([completedAppointments, servicesFromAppointments]) => ({
          completedAppointments,
          servicesFromAppointments,
          conversionRate: completedAppointments > 0 ? 
            (servicesFromAppointments / completedAppointments) * 100 : 0,
        })),
      ]);

      res.json({
        success: true,
        data: {
          appointmentsByStatus,
          appointmentsByMonth,
          upcomingAppointments,
          conversion: conversionStats,
        },
      });
    } catch (error) {
      console.error('Error fetching appointment reports:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// GET /api/reports/opportunities - Opportunity reports
router.get(
  '/opportunities',
  authenticate,
  authorize(['reports'], ['read']),
  validateQuery(dateRangeSchema),
  async (req, res) => {
    try {
      const { dateFrom, dateTo } = req.query;

      const dateFilter: any = {};
      if (dateFrom || dateTo) {
        if (dateFrom) dateFilter.gte = new Date(dateFrom as string);
        if (dateTo) dateFilter.lte = new Date(dateTo as string);
      }

      const [
        opportunitiesByStatus,
        opportunitiesByType,
        conversionStats,
        upcomingFollowUps,
      ] = await Promise.all([
        // Opportunities grouped by status
        prisma.opportunity.groupBy({
          by: ['status'],
          _count: { id: true },
          where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
        }),

        // Opportunities grouped by type
        prisma.opportunity.groupBy({
          by: ['type'],
          _count: { id: true },
          where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
        }),

        // Conversion statistics
        Promise.all([
          prisma.opportunity.count({
            where: {
              status: 'converted',
              ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
            },
          }),
          prisma.opportunity.count({
            where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
          }),
        ]).then(([converted, total]) => ({
          converted,
          total,
          conversionRate: total > 0 ? (converted / total) * 100 : 0,
        })),

        // Upcoming follow-ups (next 7 days)
        prisma.opportunity.findMany({
          where: {
            followUpDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            status: { in: ['pending', 'contacted', 'interested'] },
          },
          orderBy: { followUpDate: 'asc' },
          include: {
            client: { select: { name: true, phone: true } },
            vehicle: { select: { plate: true, brand: true, model: true } },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          opportunitiesByStatus,
          opportunitiesByType,
          conversion: conversionStats,
          upcomingFollowUps,
        },
      });
    } catch (error) {
      console.error('Error fetching opportunity reports:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

// GET /api/reports/mechanics - Mechanic performance reports
router.get(
  '/mechanics',
  authenticate,
  authorize(['reports'], ['read']),
  validateQuery(dateRangeSchema),
  async (req, res) => {
    try {
      const { dateFrom, dateTo } = req.query;

      const dateFilter: any = {};
      if (dateFrom || dateTo) {
        if (dateFrom) dateFilter.gte = new Date(dateFrom as string);
        if (dateTo) dateFilter.lte = new Date(dateTo as string);
      }

      const mechanicPerformance = await prisma.mechanic.findMany({
        include: {
          services: {
            where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
            include: {
              status: { select: { name: true } },
            },
          },
        },
      });

      const enhancedMechanicData = mechanicPerformance.map(mechanic => {
        const services = mechanic.services;
        const completedServices = services.filter(s => s.completedAt !== null);
        const totalRevenue = services.reduce((sum, s) => sum + Number(s.totalAmount), 0);
        const totalCommission = services.reduce((sum, s) => sum + Number(s.mechanicCommission), 0);

        return {
          id: mechanic.id,
          name: mechanic.name,
          commissionPercentage: mechanic.commissionPercentage,
          isActive: mechanic.isActive,
          performance: {
            totalServices: services.length,
            completedServices: completedServices.length,
            completionRate: services.length > 0 ? (completedServices.length / services.length) * 100 : 0,
            totalRevenue,
            totalCommission,
            averageServiceValue: services.length > 0 ? totalRevenue / services.length : 0,
          },
        };
      });

      // Sort by total revenue
      enhancedMechanicData.sort((a, b) => b.performance.totalRevenue - a.performance.totalRevenue);

      res.json({
        success: true,
        data: {
          mechanics: enhancedMechanicData,
          summary: {
            totalMechanics: mechanicPerformance.length,
            activeMechanics: mechanicPerformance.filter(m => m.isActive).length,
            totalRevenue: enhancedMechanicData.reduce((sum, m) => sum + m.performance.totalRevenue, 0),
            totalCommissions: enhancedMechanicData.reduce((sum, m) => sum + m.performance.totalCommission, 0),
          },
        },
      });
    } catch (error) {
      console.error('Error fetching mechanic reports:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
);

export default router;