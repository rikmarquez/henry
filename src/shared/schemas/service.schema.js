"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceFilterSchema = exports.serviceStatusUpdateSchema = exports.updateServiceSchema = exports.vehicleReceptionSchema = exports.createServiceSchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
exports.createServiceSchema = zod_1.z.object({
    appointmentId: common_schema_1.idSchema.optional(),
    clientId: common_schema_1.idSchema,
    vehicleId: common_schema_1.idSchema,
    mechanicId: common_schema_1.idSchema.optional(),
    statusId: common_schema_1.idSchema.default(1),
    problemDescription: zod_1.z.string().optional(),
    diagnosis: zod_1.z.string().optional(),
    quotationDetails: zod_1.z.string().optional(),
    laborPrice: zod_1.z.number().min(0).default(0),
    partsPrice: zod_1.z.number().min(0).default(0),
    partsCost: zod_1.z.number().min(0).default(0),
    totalAmount: zod_1.z.number().min(0).default(0),
    truput: zod_1.z.number().min(0).default(0),
    mechanicCommission: zod_1.z.number().min(0).default(0),
});
// Schema para recepción de vehículos
exports.vehicleReceptionSchema = zod_1.z.object({
    appointmentId: common_schema_1.idSchema.optional(),
    clientId: common_schema_1.idSchema,
    vehicleId: common_schema_1.idSchema,
    kilometraje: zod_1.z.number().int().min(0, 'El kilometraje debe ser mayor o igual a 0'),
    nivelCombustible: zod_1.z.enum(['1/4', '1/2', '3/4', 'FULL'], {
        errorMap: () => ({ message: 'Selecciona un nivel de combustible válido' })
    }),
    lucesOk: zod_1.z.boolean().default(true),
    llantasOk: zod_1.z.boolean().default(true),
    cristalesOk: zod_1.z.boolean().default(true),
    carroceriaOk: zod_1.z.boolean().default(true),
    observacionesRecepcion: zod_1.z.string().optional(),
    firmaCliente: zod_1.z.string().min(1, 'La firma del cliente es requerida'),
    fotosRecepcion: zod_1.z.array(zod_1.z.string()).optional(),
    // Campos opcionales para actualizar datos del vehículo
    vehicleUpdates: zod_1.z.object({
        plate: zod_1.z.string().min(1, 'La placa es requerida').optional(),
        brand: zod_1.z.string().optional(),
        model: zod_1.z.string().optional(),
        year: zod_1.z.number().int().min(1900).max(2030).optional(),
        color: zod_1.z.string().optional(),
    }).optional(),
});
exports.updateServiceSchema = exports.createServiceSchema.partial().extend({
    id: common_schema_1.idSchema,
    startedAt: common_schema_1.dateSchema.optional(),
    completedAt: common_schema_1.dateSchema.optional(),
});
exports.serviceStatusUpdateSchema = zod_1.z.object({
    id: common_schema_1.idSchema,
    newStatusId: common_schema_1.idSchema,
    notes: zod_1.z.string().optional(),
});
exports.serviceFilterSchema = common_schema_1.paginationSchema.extend({
    search: zod_1.z.string().optional(),
    clientId: zod_1.z.coerce.number().optional(),
    vehicleId: zod_1.z.coerce.number().optional(),
    mechanicId: zod_1.z.coerce.number().optional(),
    statusId: zod_1.z.coerce.number().optional(),
    dateFrom: common_schema_1.dateSchema.optional(),
    dateTo: common_schema_1.dateSchema.optional(),
});
