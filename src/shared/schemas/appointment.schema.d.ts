import { z } from 'zod';
export declare const createAppointmentSchema: z.ZodObject<{
    clientId: z.ZodNumber;
    vehicleId: z.ZodNumber;
    opportunityId: z.ZodOptional<z.ZodNumber>;
    scheduledDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    notes: z.ZodOptional<z.ZodString>;
    isFromOpportunity: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const updateAppointmentSchema: z.ZodObject<{
    clientId: z.ZodOptional<z.ZodNumber>;
    vehicleId: z.ZodOptional<z.ZodNumber>;
    opportunityId: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    scheduledDate: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isFromOpportunity: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    id: z.ZodNumber;
    status: z.ZodOptional<z.ZodEnum<{
        scheduled: "scheduled";
        confirmed: "confirmed";
        completed: "completed";
        cancelled: "cancelled";
    }>>;
}, z.core.$strip>;
export declare const appointmentFilterSchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<"asc" | "desc", string | undefined>>;
    search: z.ZodOptional<z.ZodString>;
    clientId: z.ZodOptional<z.ZodNumber>;
    vehicleId: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<{
        scheduled: "scheduled";
        confirmed: "confirmed";
        completed: "completed";
        cancelled: "cancelled";
    }>>;
    dateFrom: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    dateTo: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
}, z.core.$strip>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type AppointmentFilterInput = z.infer<typeof appointmentFilterSchema>;
