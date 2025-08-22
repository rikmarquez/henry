"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehicleFilterSchema = exports.updateVehicleSchema = exports.createVehicleSchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
exports.createVehicleSchema = zod_1.z.object({
    plate: zod_1.z.string().min(1, 'La placa es requerida').toUpperCase(),
    brand: zod_1.z.string().min(1, 'La marca es requerida'),
    model: zod_1.z.string().min(1, 'El modelo es requerido'),
    year: zod_1.z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
    color: zod_1.z.string().nullable().optional().transform(val => val === '' ? null : val),
    fuelType: zod_1.z.string().nullable().optional().transform(val => val === '' ? null : val),
    transmission: zod_1.z.string().nullable().optional().transform(val => val === '' ? null : val),
    engineNumber: zod_1.z.string().nullable().optional().transform(val => val === '' ? null : val),
    chassisNumber: zod_1.z.string().nullable().optional().transform(val => val === '' ? null : val),
    clientId: common_schema_1.idSchema,
    notes: zod_1.z.string().nullable().optional().transform(val => val === '' ? null : val),
});
exports.updateVehicleSchema = zod_1.z.object({
    plate: zod_1.z.string().min(1, 'La placa es requerida').toUpperCase().optional(),
    brand: zod_1.z.string().min(1, 'La marca es requerida').optional(),
    model: zod_1.z.string().min(1, 'El modelo es requerido').optional(),
    year: zod_1.z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
    color: zod_1.z.string().nullable().optional().transform(val => val === '' ? null : val),
    fuelType: zod_1.z.string().nullable().optional().transform(val => val === '' ? null : val),
    transmission: zod_1.z.string().nullable().optional().transform(val => val === '' ? null : val),
    engineNumber: zod_1.z.string().nullable().optional().transform(val => val === '' ? null : val),
    chassisNumber: zod_1.z.string().nullable().optional().transform(val => val === '' ? null : val),
    clientId: common_schema_1.idSchema.optional(),
    notes: zod_1.z.string().nullable().optional().transform(val => val === '' ? null : val),
    id: common_schema_1.idSchema,
});
exports.vehicleFilterSchema = common_schema_1.paginationSchema.extend({
    search: zod_1.z.string().optional(),
    clientId: zod_1.z.string().optional().transform(val => val ? parseInt(val) : undefined).pipe(zod_1.z.number().int().positive().optional()),
    brand: zod_1.z.string().optional(),
});
