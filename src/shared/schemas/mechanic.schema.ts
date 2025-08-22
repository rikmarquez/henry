import { z } from 'zod';
import { idSchema, paginationSchema } from './common.schema';

export const createMechanicSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
  commissionPercentage: z.number().min(0).max(100).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateMechanicSchema = createMechanicSchema.partial().extend({
  id: idSchema,
});

export const mechanicFilterSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  sortBy: z.string().optional(),
  sortOrder: z.string().optional().transform(val => {
    if (val === 'asc' || val === 'desc') return val;
    return 'desc';
  }),
  search: z.string().optional(),
  isActive: z.string().optional().transform((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }),
});

// Types
export type CreateMechanicInput = z.infer<typeof createMechanicSchema>;
export type UpdateMechanicInput = z.infer<typeof updateMechanicSchema>;
export type MechanicFilterInput = z.infer<typeof mechanicFilterSchema>;