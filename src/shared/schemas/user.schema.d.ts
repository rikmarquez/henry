import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodString;
    roleId: z.ZodNumber;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const updateUserSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    phone: z.ZodOptional<z.ZodString>;
    roleId: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    id: z.ZodNumber;
}, z.core.$strip>;
export declare const userFilterSchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<"asc" | "desc", string | undefined>>;
    search: z.ZodOptional<z.ZodString>;
    roleId: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const updateUserPasswordSchema: z.ZodObject<{
    id: z.ZodNumber;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, z.core.$strip>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserFilterInput = z.infer<typeof userFilterSchema>;
export type UpdateUserPasswordInput = z.infer<typeof updateUserPasswordSchema>;
