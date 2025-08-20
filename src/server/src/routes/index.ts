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

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Henry Diagnostics API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;