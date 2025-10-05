import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import clientRoutes from './clients.routes';
import vehicleRoutes from './vehicles.routes';
import mechanicRoutes from './mechanics';
import appointmentRoutes from './appointments';
import serviceRoutes from './services';
import workStatusRoutes from './workstatus';
import opportunityRoutes from './opportunities';
import statusLogRoutes from './statuslogs';
import reportRoutes from './reports';
import branchRoutes from './branches';
import settingRoutes from './settings';
import receptionRoutes from './reception';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/mechanics', mechanicRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/services', serviceRoutes);
router.use('/workstatus', workStatusRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/statuslogs', statusLogRoutes);
router.use('/reports', reportRoutes);
router.use('/branches', branchRoutes);
router.use('/settings', settingRoutes);
router.use('/reception', receptionRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// Debug endpoint for production debugging
router.get('/debug', async (req, res) => {
  try {
    const { prisma } = await import('../services/prisma.service');
    
    // Check database connection
    await prisma.$connect();
    
    // Get basic counts
    const [userCount, branchCount, roleCount] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.branch.count().catch(() => 0),
      prisma.role.count().catch(() => 0),
    ]);

    // Check admin user
    let adminExists = false;
    try {
      const admin = await prisma.user.findUnique({
        where: { email: 'admin@henrydiagnostics.com' }
      });
      adminExists = !!admin;
    } catch (error) {
      adminExists = false;
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: true,
        counts: {
          users: userCount,
          branches: branchCount,
          roles: roleCount,
        },
        adminUserExists: adminExists,
      },
      env: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDbUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;