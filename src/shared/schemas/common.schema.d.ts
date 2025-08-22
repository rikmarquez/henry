import { z } from 'zod';
export declare const idSchema: z.ZodNumber;
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>;
}, z.core.$strip>;
export declare const clientIdParamSchema: z.ZodObject<{
    clientId: z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>;
}, z.core.$strip>;
export declare const phoneSchema: z.ZodString;
export declare const emailSchema: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
export declare const dateSchema: z.ZodUnion<[z.ZodString, z.ZodDate]>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<"asc" | "desc", string | undefined>>;
}, z.core.$strip>;
export type PaginationInput = z.infer<typeof paginationSchema>;
