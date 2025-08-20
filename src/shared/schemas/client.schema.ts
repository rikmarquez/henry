import { z } from 'zod';
import { phoneSchema, emailSchema, idSchema, paginationSchema } from './common.schema';

export const createClientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: phoneSchema,
  whatsapp: phoneSchema.optional(),
  email: emailSchema,
  address: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial().extend({
  id: idSchema,
});

export const clientFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
});

// Types
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientFilterInput = z.infer<typeof clientFilterSchema>;