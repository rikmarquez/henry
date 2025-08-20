import { z } from 'zod';
import { idSchema, paginationSchema } from './common.schema';

export const createVehicleSchema = z.object({
  plate: z.string().min(1, 'La placa es requerida').toUpperCase(),
  brand: z.string().min(1, 'La marca es requerida'),
  model: z.string().min(1, 'El modelo es requerido'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  color: z.string().optional(),
  clientId: idSchema,
  notes: z.string().optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  id: idSchema,
});

export const vehicleFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  clientId: idSchema.optional(),
  brand: z.string().optional(),
});

// Types
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleFilterInput = z.infer<typeof vehicleFilterSchema>;