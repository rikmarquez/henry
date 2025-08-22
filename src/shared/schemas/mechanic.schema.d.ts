import { z } from 'zod';
export declare const createMechanicSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    commissionPercentage: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    isActive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const updateMechanicSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    commissionPercentage: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodNumber>>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    id: z.ZodNumber;
}, z.core.$strip>;
export declare const mechanicFilterSchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<"asc" | "desc", string | undefined>>;
    search: z.ZodOptional<z.ZodString>;
    isActive: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<boolean | undefined, string | undefined>>;
}, z.core.$strip>;
export type CreateMechanicInput = z.infer<typeof createMechanicSchema>;
export type UpdateMechanicInput = z.infer<typeof updateMechanicSchema>;
export type MechanicFilterInput = z.infer<typeof mechanicFilterSchema>;
