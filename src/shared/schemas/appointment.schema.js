"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointmentFilterSchema = exports.updateAppointmentSchema = exports.createAppointmentSchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
exports.createAppointmentSchema = zod_1.z.object({
    clientId: common_schema_1.idSchema,
    vehicleId: common_schema_1.idSchema,
    opportunityId: common_schema_1.idSchema.optional(),
    scheduledDate: common_schema_1.dateSchema,
    notes: zod_1.z.string().optional(),
    isFromOpportunity: zod_1.z.boolean().default(false),
});
exports.updateAppointmentSchema = exports.createAppointmentSchema.partial().extend({
    id: common_schema_1.idSchema,
    status: zod_1.z.enum(['scheduled', 'confirmed', 'completed', 'cancelled']).optional(),
});
exports.appointmentFilterSchema = common_schema_1.paginationSchema.extend({
    search: zod_1.z.string().optional(),
    clientId: common_schema_1.idSchema.optional(),
    vehicleId: common_schema_1.idSchema.optional(),
    status: zod_1.z.enum(['scheduled', 'confirmed', 'completed', 'cancelled']).optional(),
    dateFrom: common_schema_1.dateSchema.optional(),
    dateTo: common_schema_1.dateSchema.optional(),
});
