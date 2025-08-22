"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workStatusFilterSchema = exports.updateWorkStatusSchema = exports.createWorkStatusSchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
exports.createWorkStatusSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    orderIndex: zod_1.z.number().int().min(1),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser un código hexadecimal válido').default('#6B7280'),
});
exports.updateWorkStatusSchema = exports.createWorkStatusSchema.partial().extend({
    id: common_schema_1.idSchema,
});
exports.workStatusFilterSchema = common_schema_1.paginationSchema.extend({
    search: zod_1.z.string().optional(),
});
