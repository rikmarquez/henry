import { z } from 'zod';
import { idSchema, dateSchema, paginationSchema } from './common.schema';

export const createServiceSchema = z.object({
  appointmentId: idSchema.optional(),
  clientId: idSchema,
  vehicleId: idSchema,
  mechanicId: idSchema.optional(),
  statusId: idSchema.default(1),
  problemDescription: z.string().optional(),
  diagnosis: z.string().optional(),
  quotationDetails: z.string().optional(),
  totalAmount: z.number().min(0).default(0),
  mechanicCommission: z.number().min(0).default(0),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  id: idSchema,
  startedAt: dateSchema.optional(),
  completedAt: dateSchema.optional(),
});

export const serviceStatusUpdateSchema = z.object({
  id: idSchema,
  newStatusId: idSchema,
  notes: z.string().optional(),
});

export const serviceFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  clientId: idSchema.optional(),
  vehicleId: idSchema.optional(),
  mechanicId: idSchema.optional(),
  statusId: idSchema.optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
});

// Types
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceStatusUpdateInput = z.infer<typeof serviceStatusUpdateSchema>;
export type ServiceFilterInput = z.infer<typeof serviceFilterSchema>;