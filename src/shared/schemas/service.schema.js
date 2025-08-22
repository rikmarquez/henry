"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceFilterSchema = exports.serviceStatusUpdateSchema = exports.updateServiceSchema = exports.createServiceSchema = void 0;
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
    totalAmount: zod_1.z.number().min(0).default(0),
    mechanicCommission: zod_1.z.number().min(0).default(0),
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
    clientId: common_schema_1.idSchema.optional(),
    vehicleId: common_schema_1.idSchema.optional(),
    mechanicId: common_schema_1.idSchema.optional(),
    statusId: common_schema_1.idSchema.optional(),
    dateFrom: common_schema_1.dateSchema.optional(),
    dateTo: common_schema_1.dateSchema.optional(),
});
