"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mechanicFilterSchema = exports.updateMechanicSchema = exports.createMechanicSchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
exports.createMechanicSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    phone: zod_1.z.string().optional(),
    commissionPercentage: zod_1.z.number().min(0).max(100).optional().default(0),
    isActive: zod_1.z.boolean().optional().default(true),
});
exports.updateMechanicSchema = exports.createMechanicSchema.partial().extend({
    id: common_schema_1.idSchema,
});
exports.mechanicFilterSchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 10),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.string().optional().transform(val => {
        if (val === 'asc' || val === 'desc')
            return val;
        return 'desc';
    }),
    search: zod_1.z.string().optional(),
    isActive: zod_1.z.string().optional().transform((val) => {
        if (val === 'true')
            return true;
        if (val === 'false')
            return false;
        return undefined;
    }),
});
