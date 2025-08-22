"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserPasswordSchema = exports.userFilterSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: common_schema_1.emailSchema,
    phone: common_schema_1.phoneSchema,
    roleId: common_schema_1.idSchema,
    isActive: zod_1.z.boolean().default(true),
});
exports.updateUserSchema = exports.createUserSchema.partial().extend({
    id: common_schema_1.idSchema,
});
exports.userFilterSchema = common_schema_1.paginationSchema.extend({
    search: zod_1.z.string().optional(),
    roleId: common_schema_1.idSchema.optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.updateUserPasswordSchema = zod_1.z.object({
    id: common_schema_1.idSchema,
    newPassword: zod_1.z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: zod_1.z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});
