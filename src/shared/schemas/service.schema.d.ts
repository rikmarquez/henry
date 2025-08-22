import { z } from 'zod';
export declare const createServiceSchema: z.ZodObject<{
    appointmentId: z.ZodOptional<z.ZodNumber>;
    clientId: z.ZodNumber;
    vehicleId: z.ZodNumber;
    mechanicId: z.ZodOptional<z.ZodNumber>;
    statusId: z.ZodDefault<z.ZodNumber>;
    problemDescription: z.ZodOptional<z.ZodString>;
    diagnosis: z.ZodOptional<z.ZodString>;
    quotationDetails: z.ZodOptional<z.ZodString>;
    totalAmount: z.ZodDefault<z.ZodNumber>;
    mechanicCommission: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const updateServiceSchema: z.ZodObject<{
    appointmentId: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    clientId: z.ZodOptional<z.ZodNumber>;
    vehicleId: z.ZodOptional<z.ZodNumber>;
    mechanicId: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    statusId: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    problemDescription: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    diagnosis: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    quotationDetails: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    totalAmount: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    mechanicCommission: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    id: z.ZodNumber;
    startedAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    completedAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
}, z.core.$strip>;
export declare const serviceStatusUpdateSchema: z.ZodObject<{
    id: z.ZodNumber;
    newStatusId: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const serviceFilterSchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>, z.ZodNumber>;
    limit: z.ZodPipe<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>, z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
    search: z.ZodOptional<z.ZodString>;
    clientId: z.ZodOptional<z.ZodNumber>;
    vehicleId: z.ZodOptional<z.ZodNumber>;
    mechanicId: z.ZodOptional<z.ZodNumber>;
    statusId: z.ZodOptional<z.ZodNumber>;
    dateFrom: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    dateTo: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
}, z.core.$strip>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceStatusUpdateInput = z.infer<typeof serviceStatusUpdateSchema>;
export type ServiceFilterInput = z.infer<typeof serviceFilterSchema>;
