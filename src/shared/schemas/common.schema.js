"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.dateSchema = exports.emailSchema = exports.phoneSchema = exports.clientIdParamSchema = exports.idParamSchema = exports.idSchema = void 0;
const zod_1 = require("zod");
// Common validation patterns
exports.idSchema = zod_1.z.number().int().positive();
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().transform(val => parseInt(val))
});
exports.clientIdParamSchema = zod_1.z.object({
    clientId: zod_1.z.string().transform(val => parseInt(val))
});
exports.phoneSchema = zod_1.z.string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .regex(/^[+]?[\d\s-()]+$/, 'Formato de teléfono inválido');
exports.emailSchema = zod_1.z.string()
    .email('Email inválido')
    .optional()
    .or(zod_1.z.literal(''));
exports.dateSchema = zod_1.z.string().datetime('Fecha inválida')
    .or(zod_1.z.date());
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 10),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.string().optional().transform(val => {
        if (val === 'asc' || val === 'desc')
            return val;
        return 'desc';
    }),
});
