import { z } from 'zod';
export declare const generalSettingsSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    address: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    zipCode: z.ZodOptional<z.ZodString>;
    country: z.ZodDefault<z.ZodString>;
    phone: z.ZodString;
    whatsapp: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    email: z.ZodString;
    website: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    workingHours: z.ZodObject<{
        monday: z.ZodObject<{
            isOpen: z.ZodDefault<z.ZodBoolean>;
            openTime: z.ZodDefault<z.ZodString>;
            closeTime: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
        tuesday: z.ZodObject<{
            isOpen: z.ZodDefault<z.ZodBoolean>;
            openTime: z.ZodDefault<z.ZodString>;
            closeTime: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
        wednesday: z.ZodObject<{
            isOpen: z.ZodDefault<z.ZodBoolean>;
            openTime: z.ZodDefault<z.ZodString>;
            closeTime: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
        thursday: z.ZodObject<{
            isOpen: z.ZodDefault<z.ZodBoolean>;
            openTime: z.ZodDefault<z.ZodString>;
            closeTime: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
        friday: z.ZodObject<{
            isOpen: z.ZodDefault<z.ZodBoolean>;
            openTime: z.ZodDefault<z.ZodString>;
            closeTime: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
        saturday: z.ZodObject<{
            isOpen: z.ZodDefault<z.ZodBoolean>;
            openTime: z.ZodDefault<z.ZodString>;
            closeTime: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
        sunday: z.ZodObject<{
            isOpen: z.ZodDefault<z.ZodBoolean>;
            openTime: z.ZodDefault<z.ZodString>;
            closeTime: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    currency: z.ZodDefault<z.ZodString>;
    timezone: z.ZodDefault<z.ZodString>;
    language: z.ZodDefault<z.ZodString>;
    taxId: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    taxRegime: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    logoUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateGeneralSettingsSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    zipCode: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    country: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    phone: z.ZodOptional<z.ZodString>;
    whatsapp: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    email: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    workingHours: z.ZodOptional<z.ZodObject<{
        monday: z.ZodObject<{
            isOpen: z.ZodDefault<z.ZodBoolean>;
            openTime: z.ZodDefault<z.ZodString>;
            closeTime: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
        tuesday: z.ZodObject<{
            isOpen: z.ZodDefault<z.ZodBoolean>;
            openTime: z.ZodDefault<z.ZodString>;
            closeTime: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
        wednesday: z.ZodObject<{
            isOpen: z.ZodDefault<z.ZodBoolean>;
            openTime: z.ZodDefault<z.ZodString>;
            closeTime: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
        thursday: z.ZodObject<{
            isOpen: z.ZodDefault<z.ZodBoolean>;
            openTime: z.ZodDefault<z.ZodString>;
            closeTime: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
        friday: z.ZodObject<{
            isOpen: z.ZodDefault<z.ZodBoolean>;
            openTime: z.ZodDefault<z.ZodString>;
            closeTime: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
        saturday: z.ZodObject<{
            isOpen: z.ZodDefault<z.ZodBoolean>;
            openTime: z.ZodDefault<z.ZodString>;
            closeTime: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
        sunday: z.ZodObject<{
            isOpen: z.ZodDefault<z.ZodBoolean>;
            openTime: z.ZodDefault<z.ZodString>;
            closeTime: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>>;
    currency: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    timezone: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    language: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    taxId: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    taxRegime: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    logoUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>;
export type UpdateGeneralSettingsInput = z.infer<typeof updateGeneralSettingsSchema>;
