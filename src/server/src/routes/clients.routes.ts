import { Router } from 'express';
import { clientsController } from '../controllers/clients.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate, validateQuery, validateParams } from '../middleware/validation.middleware';
import { createClientSchema, updateClientSchema, clientFilterSchema } from '../../../shared/schemas';
import { idParamSchema } from '../../../shared/schemas/common.schema';

const router = Router();

// Todas las rutas de clientes requieren autenticación
router.use(authenticate);

// GET /api/clients - Obtener todos los clientes (todos los roles pueden leer)
router.get('/', 
  authorize(['clients'], ['read']), 
  validateQuery(clientFilterSchema), 
  clientsController.getClients
);

// GET /api/clients/:id - Obtener un cliente por ID
router.get('/:id', 
  authorize(['clients'], ['read']), 
  validateParams(idParamSchema), 
  clientsController.getClientById
);

// POST /api/clients - Crear un nuevo cliente (Admin/Encargado)
router.post('/', 
  authorize(['clients'], ['create']), 
  validate(createClientSchema), 
  clientsController.createClient
);

// PUT /api/clients/:id - Actualizar un cliente (Admin/Encargado)
router.put('/:id', 
  authorize(['clients'], ['update']), 
  validateParams(idParamSchema),
  validate(updateClientSchema), 
  clientsController.updateClient
);

// DELETE /api/clients/:id - Eliminar (desactivar) un cliente (Solo Admin)
router.delete('/:id', 
  authorize(['clients'], ['delete']), 
  validateParams(idParamSchema), 
  clientsController.deleteClient
);

// POST /api/clients/:id/activate - Reactivar un cliente (Solo Admin)
router.post('/:id/activate', 
  authorize(['clients'], ['create']), 
  validateParams(idParamSchema), 
  clientsController.activateClient
);

export default router;