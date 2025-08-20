import { z } from 'zod';

// Common validation patterns
export const idSchema = z.number().int().positive();

export const phoneSchema = z.string()
  .min(10, 'El teléfono debe tener al menos 10 dígitos')
  .regex(/^[+]?[\d\s-()]+$/, 'Formato de teléfono inválido');

export const emailSchema = z.string()
  .email('Email inválido')
  .optional()
  .or(z.literal(''));

export const dateSchema = z.string().datetime('Fecha inválida')
  .or(z.date());

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;