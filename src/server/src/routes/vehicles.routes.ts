import { Router } from 'express';
import { vehiclesController } from '../controllers/vehicles.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate, validateQuery, validateParams } from '../middleware/validation.middleware';
import { createVehicleSchema, updateVehicleSchema, vehicleFilterSchema } from '../../../shared/schemas';
import { idParamSchema, clientIdParamSchema } from '../../../shared/schemas/common.schema';

const router = Router();

// Todas las rutas de vehículos requieren autenticación
router.use(authenticate);

// GET /api/vehicles - Obtener todos los vehículos (todos los roles pueden leer)
router.get('/', 
  authorize(['vehicles'], ['read']), 
  validateQuery(vehicleFilterSchema), 
  vehiclesController.getVehicles
);

// GET /api/vehicles/by-client/:clientId - Obtener vehículos por cliente
router.get('/by-client/:clientId', 
  authorize(['vehicles'], ['read']), 
  validateParams(clientIdParamSchema), 
  vehiclesController.getVehiclesByClient
);

// GET /api/vehicles/:id - Obtener un vehículo por ID
router.get('/:id', 
  authorize(['vehicles'], ['read']), 
  validateParams(idParamSchema), 
  vehiclesController.getVehicleById
);

// POST /api/vehicles - Crear un nuevo vehículo (Admin/Encargado)
router.post('/', 
  authorize(['vehicles'], ['create']), 
  validate(createVehicleSchema), 
  vehiclesController.createVehicle
);

// PUT /api/vehicles/:id - Actualizar un vehículo (Admin/Encargado)
router.put('/:id', 
  authorize(['vehicles'], ['update']), 
  validateParams(idParamSchema),
  validate(updateVehicleSchema.omit({ id: true })), 
  vehiclesController.updateVehicle
);

// DELETE /api/vehicles/:id - Eliminar (desactivar) un vehículo (Solo Admin)
router.delete('/:id', 
  authorize(['vehicles'], ['delete']), 
  validateParams(idParamSchema), 
  vehiclesController.deleteVehicle
);

// POST /api/vehicles/:id/activate - Reactivar un vehículo (Solo Admin)
router.post('/:id/activate', 
  authorize(['vehicles'], ['create']), 
  validateParams(idParamSchema), 
  vehiclesController.activateVehicle
);

export default router;