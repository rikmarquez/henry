import { z } from 'zod';
import { idSchema, dateSchema, paginationSchema } from './common.schema';

export const statusLogFilterSchema = paginationSchema.extend({
  serviceId: idSchema.optional(),
  oldStatusId: idSchema.optional(),
  newStatusId: idSchema.optional(),
  changedBy: idSchema.optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
});

// Types
export type StatusLogFilterInput = z.infer<typeof statusLogFilterSchema>;