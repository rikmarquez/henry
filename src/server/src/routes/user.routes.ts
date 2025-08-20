import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateQuery } from '../middleware/validation.middleware';
import { userFilterSchema } from '../../../shared/schemas';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Get roles (available to all authenticated users)
router.get('/roles', userController.getRoles);

// Admin-only routes
router.post('/', authorize(['ADMIN']), userController.createUser);
router.get('/', authorize(['ADMIN', 'ENCARGADO']), validateQuery(userFilterSchema), userController.getUsers);
router.get('/:id', authorize(['ADMIN', 'ENCARGADO']), userController.getUserById);
router.put('/:id', authorize(['ADMIN']), userController.updateUser);
router.put('/:id/password', authorize(['ADMIN']), userController.updateUserPassword);
router.delete('/:id', authorize(['ADMIN']), userController.deleteUser);

export default router;