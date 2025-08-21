import { z } from 'zod';
import { idSchema, paginationSchema } from './common.schema';

export const createVehicleSchema = z.object({
  plate: z.string().min(1, 'La placa es requerida').toUpperCase(),
  brand: z.string().min(1, 'La marca es requerida'),
  model: z.string().min(1, 'El modelo es requerido'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  color: z.string().nullable().optional().transform(val => val === '' ? null : val),
  fuelType: z.string().nullable().optional().transform(val => val === '' ? null : val),
  transmission: z.string().nullable().optional().transform(val => val === '' ? null : val),
  engineNumber: z.string().nullable().optional().transform(val => val === '' ? null : val),
  chassisNumber: z.string().nullable().optional().transform(val => val === '' ? null : val),
  clientId: idSchema,
  notes: z.string().nullable().optional().transform(val => val === '' ? null : val),
});

export const updateVehicleSchema = z.object({
  plate: z.string().min(1, 'La placa es requerida').toUpperCase().optional(),
  brand: z.string().min(1, 'La marca es requerida').optional(),
  model: z.string().min(1, 'El modelo es requerido').optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  color: z.string().nullable().optional().transform(val => val === '' ? null : val),
  fuelType: z.string().nullable().optional().transform(val => val === '' ? null : val),
  transmission: z.string().nullable().optional().transform(val => val === '' ? null : val),
  engineNumber: z.string().nullable().optional().transform(val => val === '' ? null : val),
  chassisNumber: z.string().nullable().optional().transform(val => val === '' ? null : val),
  clientId: idSchema.optional(),
  notes: z.string().nullable().optional().transform(val => val === '' ? null : val),
  id: idSchema,
});

export const vehicleFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  clientId: z.string().optional().transform(val => val ? parseInt(val) : undefined).pipe(z.number().int().positive().optional()),
  brand: z.string().optional(),
});

// Types
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleFilterInput = z.infer<typeof vehicleFilterSchema>;