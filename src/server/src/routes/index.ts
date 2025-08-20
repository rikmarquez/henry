import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import clientRoutes from './clients.routes';
import vehicleRoutes from './vehicles.routes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.use('/vehicles', vehicleRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Henry Diagnostics API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;