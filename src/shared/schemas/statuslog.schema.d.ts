import { z } from 'zod';
export declare const statusLogFilterSchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<"asc" | "desc", string | undefined>>;
    serviceId: z.ZodOptional<z.ZodNumber>;
    oldStatusId: z.ZodOptional<z.ZodNumber>;
    newStatusId: z.ZodOptional<z.ZodNumber>;
    changedBy: z.ZodOptional<z.ZodNumber>;
    dateFrom: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    dateTo: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
}, z.core.$strip>;
export type StatusLogFilterInput = z.infer<typeof statusLogFilterSchema>;
