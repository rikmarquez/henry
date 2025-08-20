import { z } from 'zod';
import { idSchema, dateSchema, paginationSchema } from './common.schema';

export const createAppointmentSchema = z.object({
  clientId: idSchema,
  vehicleId: idSchema,
  opportunityId: idSchema.optional(),
  scheduledDate: dateSchema,
  notes: z.string().optional(),
  isFromOpportunity: z.boolean().default(false),
});

export const updateAppointmentSchema = createAppointmentSchema.partial().extend({
  id: idSchema,
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled']).optional(),
});

export const appointmentFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  clientId: idSchema.optional(),
  vehicleId: idSchema.optional(),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled']).optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
});

// Types
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type AppointmentFilterInput = z.infer<typeof appointmentFilterSchema>;