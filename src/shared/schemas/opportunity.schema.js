"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.opportunityFilterSchema = exports.updateOpportunitySchema = exports.createOpportunitySchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
exports.createOpportunitySchema = zod_1.z.object({
    clientId: common_schema_1.idSchema,
    vehicleId: common_schema_1.idSchema,
    serviceId: common_schema_1.idSchema.optional(),
    type: zod_1.z.string().min(2, 'El tipo debe tener al menos 2 caracteres'),
    description: zod_1.z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
    followUpDate: zod_1.z.string().min(1, 'Fecha de seguimiento requerida'),
    status: zod_1.z.enum(['pending', 'contacted', 'interested', 'declined', 'converted']).default('pending'),
    notes: zod_1.z.string().optional(),
});
exports.updateOpportunitySchema = exports.createOpportunitySchema.partial().extend({
    id: common_schema_1.idSchema,
});
exports.opportunityFilterSchema = common_schema_1.paginationSchema.extend({
    search: zod_1.z.string().optional(),
    clientId: common_schema_1.idSchema.optional(),
    vehicleId: common_schema_1.idSchema.optional(),
    serviceId: common_schema_1.idSchema.optional(),
    type: zod_1.z.string().optional(),
    status: zod_1.z.enum(['pending', 'contacted', 'interested', 'declined', 'converted']).optional(),
    dateFrom: common_schema_1.dateSchema.optional(),
    dateTo: common_schema_1.dateSchema.optional(),
});
