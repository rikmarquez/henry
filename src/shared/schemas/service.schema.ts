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
  laborPrice: z.number().min(0).default(0),
  partsPrice: z.number().min(0).default(0),
  partsCost: z.number().min(0).default(0),
  totalAmount: z.number().min(0).default(0),
  truput: z.number().min(0).default(0),
  mechanicCommission: z.number().min(0).default(0),
});

// Schema para recepción de vehículos
export const vehicleReceptionSchema = z.object({
  appointmentId: idSchema.optional(),
  clientId: idSchema,
  vehicleId: idSchema,
  kilometraje: z.number().int().min(0, 'El kilometraje debe ser mayor o igual a 0'),
  nivelCombustible: z.enum(['1/4', '1/2', '3/4', 'FULL'], {
    errorMap: () => ({ message: 'Selecciona un nivel de combustible válido' })
  }),
  lucesOk: z.boolean().default(true),
  llantasOk: z.boolean().default(true),
  cristalesOk: z.boolean().default(true),
  carroceriaOk: z.boolean().default(true),
  observacionesRecepcion: z.string().optional(),
  firmaCliente: z.string().min(1, 'La firma del cliente es requerida'),
  fotosRecepcion: z.array(z.string()).optional(),
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
  clientId: z.coerce.number().optional(),
  vehicleId: z.coerce.number().optional(),
  mechanicId: z.coerce.number().optional(),
  statusId: z.coerce.number().optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
});

// Types
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceStatusUpdateInput = z.infer<typeof serviceStatusUpdateSchema>;
export type ServiceFilterInput = z.infer<typeof serviceFilterSchema>;
export type VehicleReceptionInput = z.infer<typeof vehicleReceptionSchema>;