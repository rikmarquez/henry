"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGeneralSettingsSchema = exports.generalSettingsSchema = void 0;
const zod_1 = require("zod");
// General settings schema
exports.generalSettingsSchema = zod_1.z.object({
    // Información básica del taller
    name: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    description: zod_1.z.string().optional(),
    address: zod_1.z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
    city: zod_1.z.string().min(2, 'La ciudad es requerida'),
    state: zod_1.z.string().min(2, 'El estado/provincia es requerido'),
    zipCode: zod_1.z.string().optional(),
    country: zod_1.z.string().default('México'),
    // Información de contacto
    phone: zod_1.z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
    whatsapp: zod_1.z.string().optional().or(zod_1.z.literal('')),
    email: zod_1.z.string().email('Email inválido'),
    website: zod_1.z.string().url('URL inválida').optional().or(zod_1.z.literal('')),
    // Horarios de trabajo
    workingHours: zod_1.z.object({
        monday: zod_1.z.object({
            isOpen: zod_1.z.boolean().default(true),
            openTime: zod_1.z.string().default('08:00'),
            closeTime: zod_1.z.string().default('18:00')
        }),
        tuesday: zod_1.z.object({
            isOpen: zod_1.z.boolean().default(true),
            openTime: zod_1.z.string().default('08:00'),
            closeTime: zod_1.z.string().default('18:00')
        }),
        wednesday: zod_1.z.object({
            isOpen: zod_1.z.boolean().default(true),
            openTime: zod_1.z.string().default('08:00'),
            closeTime: zod_1.z.string().default('18:00')
        }),
        thursday: zod_1.z.object({
            isOpen: zod_1.z.boolean().default(true),
            openTime: zod_1.z.string().default('08:00'),
            closeTime: zod_1.z.string().default('18:00')
        }),
        friday: zod_1.z.object({
            isOpen: zod_1.z.boolean().default(true),
            openTime: zod_1.z.string().default('08:00'),
            closeTime: zod_1.z.string().default('18:00')
        }),
        saturday: zod_1.z.object({
            isOpen: zod_1.z.boolean().default(false),
            openTime: zod_1.z.string().default('08:00'),
            closeTime: zod_1.z.string().default('14:00')
        }),
        sunday: zod_1.z.object({
            isOpen: zod_1.z.boolean().default(false),
            openTime: zod_1.z.string().default('09:00'),
            closeTime: zod_1.z.string().default('13:00')
        })
    }),
    // Configuraciones regionales
    currency: zod_1.z.string().default('MXN'),
    timezone: zod_1.z.string().default('America/Mexico_City'),
    language: zod_1.z.string().default('es-MX'),
    // Información fiscal
    taxId: zod_1.z.string().optional().or(zod_1.z.literal('')), // RFC en México
    taxRegime: zod_1.z.string().optional().or(zod_1.z.literal('')),
    // Logo y branding
    logoUrl: zod_1.z.string().optional(),
});
exports.updateGeneralSettingsSchema = exports.generalSettingsSchema.partial();
