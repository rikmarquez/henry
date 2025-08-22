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

// Admin-only routes using resource-action authorization
router.post('/', authorize(['users'], ['create']), userController.createUser);
router.get('/', 
  authorize(['users'], ['read']), 
  (req, res, next) => {
    // Manual query validation to bypass schema cache issues
    const { page, limit, search, roleId, isActive } = req.query;
    
    // Transform parameters manually
    const transformedQuery = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      search: search as string,
      roleId: roleId ? parseInt(roleId as string) : undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    
    req.query = transformedQuery;
    next();
  }, 
  userController.getUsers
);
router.get('/:id', authorize(['users'], ['read']), userController.getUserById);
router.put('/:id', authorize(['users'], ['update']), userController.updateUser);
router.put('/:id/password', authorize(['users'], ['update']), userController.updateUserPassword);
router.delete('/:id', authorize(['users'], ['delete']), userController.deleteUser);

export default router;