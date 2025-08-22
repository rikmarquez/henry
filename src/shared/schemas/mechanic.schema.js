"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mechanicFilterSchema = exports.updateMechanicSchema = exports.createMechanicSchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
exports.createMechanicSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    commissionPercentage: zod_1.z.number().min(0).max(100).default(0),
    isActive: zod_1.z.boolean().default(true),
});
exports.updateMechanicSchema = exports.createMechanicSchema.partial().extend({
    id: common_schema_1.idSchema,
});
exports.mechanicFilterSchema = common_schema_1.paginationSchema.extend({
    search: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
