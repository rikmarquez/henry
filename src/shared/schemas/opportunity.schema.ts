import { z } from 'zod';
import { idSchema, dateSchema, paginationSchema } from './common.schema';

export const createOpportunitySchema = z.object({
  clientId: idSchema,
  vehicleId: idSchema,
  serviceId: idSchema.optional(),
  type: z.string().min(2, 'El tipo debe tener al menos 2 caracteres'),
  description: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
  followUpDate: dateSchema,
  status: z.enum(['pending', 'contacted', 'interested', 'declined', 'converted']).default('pending'),
  notes: z.string().optional(),
});

export const updateOpportunitySchema = createOpportunitySchema.partial().extend({
  id: idSchema,
});

export const opportunityFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  clientId: idSchema.optional(),
  vehicleId: idSchema.optional(),
  serviceId: idSchema.optional(),
  type: z.string().optional(),
  status: z.enum(['pending', 'contacted', 'interested', 'declined', 'converted']).optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
});

// Types
export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
export type OpportunityFilterInput = z.infer<typeof opportunityFilterSchema>;