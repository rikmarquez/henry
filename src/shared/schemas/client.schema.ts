import { z } from 'zod';
import { phoneSchema, emailSchema, idSchema, paginationSchema } from './common.schema';

export const createClientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  whatsapp: phoneSchema.optional(),
  phone: phoneSchema.optional(),
  email: z.string().email('Email inválido').nullable().optional(),
  address: z.string().nullable().optional(),
}).refine((data) => data.whatsapp || data.phone, {
  message: 'Al menos WhatsApp o teléfono es requerido',
  path: ['whatsapp'],
});

export const updateClientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  whatsapp: phoneSchema.optional(),
  phone: phoneSchema.optional(),
  email: z.string().email('Email inválido').nullable().optional(),
  address: z.string().nullable().optional(),
});

export const clientFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
});

// Types
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientFilterInput = z.infer<typeof clientFilterSchema>;