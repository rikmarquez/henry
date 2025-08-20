import { z } from 'zod';
import { idSchema, paginationSchema } from './common.schema';

export const createMechanicSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  commissionPercentage: z.number().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
});

export const updateMechanicSchema = createMechanicSchema.partial().extend({
  id: idSchema,
});

export const mechanicFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Types
export type CreateMechanicInput = z.infer<typeof createMechanicSchema>;
export type UpdateMechanicInput = z.infer<typeof updateMechanicSchema>;
export type MechanicFilterInput = z.infer<typeof mechanicFilterSchema>;