import { z } from 'zod';
export declare const createWorkStatusSchema: z.ZodObject<{
    name: z.ZodString;
    orderIndex: z.ZodNumber;
    color: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const updateWorkStatusSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    orderIndex: z.ZodOptional<z.ZodNumber>;
    color: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    id: z.ZodNumber;
}, z.core.$strip>;
export declare const workStatusFilterSchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<"asc" | "desc", string | undefined>>;
    search: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateWorkStatusInput = z.infer<typeof createWorkStatusSchema>;
export type UpdateWorkStatusInput = z.infer<typeof updateWorkStatusSchema>;
export type WorkStatusFilterInput = z.infer<typeof workStatusFilterSchema>;
