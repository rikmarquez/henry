import { z } from 'zod';
export declare const createClientSchema: z.ZodObject<{
    name: z.ZodString;
    whatsapp: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const updateClientSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    whatsapp: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const clientFilterSchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<"asc" | "desc", string | undefined>>;
    search: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientFilterInput = z.infer<typeof clientFilterSchema>;
