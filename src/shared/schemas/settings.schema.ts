import { z } from 'zod';

// General settings schema
export const generalSettingsSchema = z.object({
  // Información básica del taller
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  city: z.string().min(2, 'La ciudad es requerida'),
  state: z.string().min(2, 'El estado/provincia es requerido'),
  zipCode: z.string().optional(),
  country: z.string().default('México'),

  // Información de contacto
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  whatsapp: z.string().optional().or(z.literal('')),
  email: z.string().email('Email inválido'),
  website: z.string().url('URL inválida').optional().or(z.literal('')),

  // Horarios de trabajo
  workingHours: z.object({
    monday: z.object({
      isOpen: z.boolean().default(true),
      openTime: z.string().default('08:00'),
      closeTime: z.string().default('18:00')
    }),
    tuesday: z.object({
      isOpen: z.boolean().default(true),
      openTime: z.string().default('08:00'),
      closeTime: z.string().default('18:00')
    }),
    wednesday: z.object({
      isOpen: z.boolean().default(true),
      openTime: z.string().default('08:00'),
      closeTime: z.string().default('18:00')
    }),
    thursday: z.object({
      isOpen: z.boolean().default(true),
      openTime: z.string().default('08:00'),
      closeTime: z.string().default('18:00')
    }),
    friday: z.object({
      isOpen: z.boolean().default(true),
      openTime: z.string().default('08:00'),
      closeTime: z.string().default('18:00')
    }),
    saturday: z.object({
      isOpen: z.boolean().default(false),
      openTime: z.string().default('08:00'),
      closeTime: z.string().default('14:00')
    }),
    sunday: z.object({
      isOpen: z.boolean().default(false),
      openTime: z.string().default('09:00'),
      closeTime: z.string().default('13:00')
    })
  }),

  // Configuraciones regionales
  currency: z.string().default('MXN'),
  timezone: z.string().default('America/Mexico_City'),
  language: z.string().default('es-MX'),

  // Información fiscal
  taxId: z.string().optional().or(z.literal('')), // RFC en México
  taxRegime: z.string().optional().or(z.literal('')),
  
  // Logo y branding
  logoUrl: z.string().optional(),
});

export const updateGeneralSettingsSchema = generalSettingsSchema.partial();

// Types
export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>;
export type UpdateGeneralSettingsInput = z.infer<typeof updateGeneralSettingsSchema>;