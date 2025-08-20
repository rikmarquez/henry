import { z } from 'zod';
import { idSchema, paginationSchema } from './common.schema';

export const createWorkStatusSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  orderIndex: z.number().int().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser un código hexadecimal válido').default('#6B7280'),
});

export const updateWorkStatusSchema = createWorkStatusSchema.partial().extend({
  id: idSchema,
});

export const workStatusFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
});

// Types
export type CreateWorkStatusInput = z.infer<typeof createWorkStatusSchema>;
export type UpdateWorkStatusInput = z.infer<typeof updateWorkStatusSchema>;
export type WorkStatusFilterInput = z.infer<typeof workStatusFilterSchema>;