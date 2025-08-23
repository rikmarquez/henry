import { z } from 'zod';
import { phoneSchema, emailSchema, idSchema, paginationSchema } from './common.schema';

export const createUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  roleId: idSchema,
  isActive: z.boolean().default(true),
});

export const updateUserSchema = createUserSchema.partial().extend({
  id: idSchema,
});

export const userFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  roleId: idSchema.optional(),
  isActive: z.boolean().optional(),
});

export const updateUserPasswordSchema = z.object({
  id: idSchema,
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// Types
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserFilterInput = z.infer<typeof userFilterSchema>;
export type UpdateUserPasswordInput = z.infer<typeof updateUserPasswordSchema>;