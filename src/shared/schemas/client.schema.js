"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientFilterSchema = exports.updateClientSchema = exports.createClientSchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
exports.createClientSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    whatsapp: common_schema_1.phoneSchema.optional(),
    phone: common_schema_1.phoneSchema.optional(),
    address: zod_1.z.string().nullable().optional(),
}).refine((data) => data.whatsapp || data.phone, {
    message: 'Al menos WhatsApp o teléfono es requerido',
    path: ['whatsapp'],
});
exports.updateClientSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    whatsapp: common_schema_1.phoneSchema.optional(),
    phone: common_schema_1.phoneSchema.optional(),
    address: zod_1.z.string().nullable().optional(),
});
exports.clientFilterSchema = common_schema_1.paginationSchema.extend({
    search: zod_1.z.string().optional(),
});
