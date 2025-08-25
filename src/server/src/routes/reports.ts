import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateQuery } from '../middleware/validation.middleware';

const router = Router();
const prisma = new PrismaClient();

// GET /api/reports/debug - Simple diagnostic endpoint
router.get(
  '/debug',
  authenticate,
  async (req, res) => {
    try {
      console.log('🔧 Debug endpoint called');
      const user = (req as any).user;
      console.log('🔧 User from token:', user);

      // Test basic Prisma connection
      const serviceCount = await prisma.service.count();
      const statusCount = await prisma.workStatus.count();
      
      console.log('🔧 Basic counts:', { serviceCount, statusCount });

      res.json({
        success: true,
        debug: {
          user,
          serviceCount,
          statusCount,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Debug endpoint error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  }
);

// GET /api/reports/test - Simple test without any middleware
router.get('/test', (req, res) => {
  console.log('🔧 Test endpoint called - NO MIDDLEWARE AT ALL');
  res.json({
    success: true,
    message: 'Test endpoint working - no middleware',
    timestamp: new Date().toISOString()
  });
});

// GET /api/reports/auth-test - Test with just authentication
router.get(
  '/auth-test',
  authenticate,
  (req, res) => {
    console.log('🔧 Auth-test endpoint called');
    const user = (req as any).user;
    res.json({
      success: true,
      message: 'Auth test working',
      user: user
    });
  }
);

// GET /api/reports/step1 - Test servicesByStatus query
router.get('/step1', authenticate, async (req, res) => {
  try {
    console.log('🔧 Testing Step 1 - servicesByStatus');
    const branchId = (req as any).user.branchId;
    const servicesByStatus = await prisma.service.groupBy({
      by: ['statusId'],
      _count: { id: true },
      where: { branchId },
    });
    res.json({ success: true, data: servicesByStatus });
  } catch (error) {
    console.error('❌ Step 1 error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/reports/step2 - Test servicesByMechanic query
router.get('/step2', authenticate, async (req, res) => {
  try {
    console.log('🔧 Testing Step 2 - servicesByMechanic');
    const branchId = (req as any).user.branchId;
    const servicesByMechanic = await prisma.service.groupBy({
      by: ['mechanicId'],
      _count: { id: true },
      _sum: { totalAmount: true, mechanicCommission: true },
      where: { branchId, mechanicId: { not: null } },
    });
    res.json({ success: true, data: servicesByMechanic });
  } catch (error) {
    console.error('❌ Step 2 error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/reports/step3 - Test SQL raw query (with BigInt fix)
router.get('/step3', authenticate, async (req, res) => {
  try {
    console.log('🔧 Testing Step 3 - SQL raw query');
    const branchId = (req as any).user.branchId;
    const rawResult: any[] = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(total_amount) as revenue,
        COUNT(*) as services_count
      FROM services 
      WHERE completed_at IS NOT NULL
        AND created_at >= NOW() - INTERVAL '6 months'
        AND branch_id = ${branchId}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `;
    
    // Convert BigInt to regular numbers
    const result = rawResult.map(item => ({
      month: item.month,
      revenue: Number(item.revenue), // Convert BigInt to number
      services_count: Number(item.services_count) // Convert BigInt to number
    }));
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Step 3 error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

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
      const branchId = (req as any).user.branchId;

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
        upcomingOpportunities,
      ] = await Promise.all([
        // Total counts
        prisma.client.count(),
        prisma.vehicle.count(),
        prisma.mechanic.count({ where: { branchId } }),
        prisma.appointment.count(dateFilter.gte || dateFilter.lte ? { where: { branchId, createdAt: dateFilter } } : { where: { branchId } }),
        prisma.service.count(dateFilter.gte || dateFilter.lte ? { where: { branchId, createdAt: dateFilter } } : { where: { branchId } }),
        prisma.opportunity.count(dateFilter.gte || dateFilter.lte ? { where: { branchId, createdAt: dateFilter } } : { where: { branchId } }),

        // Active counts (clients don't have isActive field, so using total)
        prisma.client.count(),
        prisma.mechanic.count({ where: { branchId, isActive: true } }),
        prisma.appointment.count({ 
          where: { 
            branchId,
            status: { in: ['scheduled', 'confirmed'] },
            ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
          }
        }),
        prisma.service.count({ 
          where: { 
            branchId,
            completedAt: null,
            ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
          }
        }),
        prisma.opportunity.count({ 
          where: { 
            branchId,
            status: { in: ['pending', 'contacted', 'interested'] },
            ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
          }
        }),

        // Revenue calculation with pricing breakdown
        prisma.service.aggregate({
          _sum: { 
            totalAmount: true,
            laborPrice: true,
            partsPrice: true,
            partsCost: true,
            truput: true
          },
          where: {
            branchId,
            completedAt: { not: null },
            ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
          },
        }),

        // Recent services for quick overview
        prisma.service.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          where: { 
            branchId,
            ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
          },
          include: {
            client: { select: { name: true } },
            vehicle: { select: { plate: true, brand: true, model: true } },
            status: { select: { name: true, color: true } },
          },
        }),

        // Upcoming opportunities (next 7 days)
        prisma.opportunity.findMany({
          where: {
            branchId,
            followUpDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            status: { in: ['pending', 'contacted', 'interested'] },
          },
          orderBy: { followUpDate: 'asc' },
          include: {
            client: { select: { name: true } },
            vehicle: { select: { plate: true, brand: true, model: true } },
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
            laborPrice: totalRevenue._sum.laborPrice || 0,
            partsPrice: totalRevenue._sum.partsPrice || 0,
            partsCost: totalRevenue._sum.partsCost || 0,
            truput: totalRevenue._sum.truput || 0,
            period: dateFrom && dateTo ? 'custom' : 'all-time',
          },
          recentServices,
          upcomingOpportunities,
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

// GET /api/reports/services-test - Service reports without authorization (temporary)
router.get(
  '/services-test',
  authenticate,
  async (req, res) => {
    try {
      console.log('🔧 Services-test endpoint called - NO AUTHORIZATION');
      const user = (req as any).user;
      console.log('🔧 User:', user);
      
      res.json({
        success: true,
        message: 'Test endpoint working without authorization',
        user: user
      });
    } catch (error) {
      console.error('❌ Services-test error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  }
);

// GET /api/reports/services-simple - Ultra simple test
router.get(
  '/services-simple',
  authenticate,
  async (req, res) => {
    try {
      console.log('🔧 Services-simple called');
      const branchId = (req as any).user.branchId;
      console.log('🔧 BranchId:', branchId);
      
      // Test one simple query
      const serviceCount = await prisma.service.count({ 
        where: { branchId } 
      });
      console.log('🔧 Service count:', serviceCount);
      
      res.json({
        success: true,
        data: { serviceCount, branchId }
      });
    } catch (error) {
      console.error('❌ Services-simple error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  }
);

// GET /api/reports/services - Service reports (FIXED BigInt issue)
router.get(
  '/services',
  authenticate,
  authorize(['reports'], ['read']),
  validateQuery(dateRangeSchema),
  async (req, res) => {
    try {
      const { dateFrom, dateTo } = req.query;
      const branchId = (req as any).user.branchId;

      console.log('🔧 Reports/services - Debug Info:', {
        branchId,
        dateFrom,
        dateTo,
        userFromReq: (req as any).user
      });

      if (!branchId) {
        console.error('❌ Reports/services - Missing branchId in user token');
        return res.status(400).json({
          success: false,
          message: 'Branch ID requerido para generar reportes',
        });
      }

      const dateFilter: any = {};
      if (dateFrom || dateTo) {
        if (dateFrom) dateFilter.gte = new Date(dateFrom as string);
        if (dateTo) dateFilter.lte = new Date(dateTo as string);
      }

      const branchFilter = { branchId };

      console.log('🔧 Starting reports queries with filters:', { branchFilter, dateFilter });

      // Test queries one by one to identify which one fails
      console.log('🔧 Testing servicesByStatus query...');
      const servicesByStatus = await prisma.service.groupBy({
        by: ['statusId'],
        _count: { id: true },
        where: {
          ...branchFilter,
          ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
        },
      });
      console.log('✅ servicesByStatus completed:', servicesByStatus);

      console.log('🔧 Testing servicesByMechanic query...');
      const servicesByMechanic = await prisma.service.groupBy({
        by: ['mechanicId'],
        _count: { id: true },
        _sum: { totalAmount: true, mechanicCommission: true },
        where: {
          ...branchFilter,
          mechanicId: { not: null },
          ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
        },
      });
      console.log('✅ servicesByMechanic completed:', servicesByMechanic);

      console.log('🔧 Testing averageServiceValue query...');
      const averageServiceValue = await prisma.service.aggregate({
        _avg: { totalAmount: true },
        _count: { id: true },
        where: {
          ...branchFilter,
          totalAmount: { gt: 0 },
          ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
        },
      });
      console.log('✅ averageServiceValue completed:', averageServiceValue);

      console.log('🔧 Testing completionStats queries...');
      const completionStats = await Promise.all([
        prisma.service.count({
          where: {
            ...branchFilter,
            completedAt: { not: null },
            ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
          },
        }),
        prisma.service.count({
          where: {
            ...branchFilter,
            ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {}),
          },
        }),
      ]).then(([completed, total]) => ({
        completed,
        total,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
      }));
      console.log('✅ completionStats completed:', completionStats);

      console.log('🔧 Testing revenueByMonth query...');
      const revenueByMonth = await (async () => {
        try {
          const rawResult: any[] = await prisma.$queryRaw`
            SELECT 
              DATE_TRUNC('month', created_at) as month,
              SUM(total_amount) as revenue,
              COUNT(*) as services_count
            FROM services 
            WHERE completed_at IS NOT NULL
              AND created_at >= NOW() - INTERVAL '6 months'
              AND branch_id = ${branchId}
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month DESC
          `;
          
          // Convert BigInt to regular numbers to avoid serialization error
          return rawResult.map(item => ({
            month: item.month,
            revenue: Number(item.revenue),
            services_count: Number(item.services_count)
          }));
        } catch (error) {
          console.error('❌ SQL Raw query failed, using fallback:', error);
          // Fallback to regular Prisma query without raw SQL
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          
          const services = await prisma.service.findMany({
            where: {
              ...branchFilter,
              completedAt: { not: null },
              createdAt: { gte: sixMonthsAgo }
            },
            select: {
              createdAt: true,
              totalAmount: true
            }
          });
          
          // Group by month manually
          const monthlyData: any = {};
          services.forEach(service => {
            const month = new Date(service.createdAt.getFullYear(), service.createdAt.getMonth(), 1);
            const monthKey = month.toISOString();
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { month, revenue: 0, services_count: 0 };
            }
            monthlyData[monthKey].revenue += service.totalAmount;
            monthlyData[monthKey].services_count += 1;
          });
          
          return Object.values(monthlyData).sort((a: any, b: any) => 
            new Date(b.month).getTime() - new Date(a.month).getTime()
          );
        }
      })();
      console.log('✅ revenueByMonth completed:', revenueByMonth);

      console.log('🔧 Queries completed successfully, starting data enhancement');

      // Enhance grouped data with related information
      const statuses = await prisma.workStatus.findMany({
        select: { id: true, name: true, color: true },
      });

      const mechanics = await prisma.mechanic.findMany({
        where: branchFilter,
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
      console.error('❌ Error fetching service reports:', error);
      console.error('❌ Error stack:', (error as Error).stack);
      console.error('❌ Error message:', (error as Error).message);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        debug: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
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