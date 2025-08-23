import { z } from 'zod';
export declare const createOpportunitySchema: z.ZodObject<{
    clientId: z.ZodNumber;
    vehicleId: z.ZodNumber;
    serviceId: z.ZodOptional<z.ZodNumber>;
    type: z.ZodString;
    description: z.ZodString;
    followUpDate: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        contacted: "contacted";
        interested: "interested";
        declined: "declined";
        converted: "converted";
    }>>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateOpportunitySchema: z.ZodObject<{
    clientId: z.ZodOptional<z.ZodNumber>;
    vehicleId: z.ZodOptional<z.ZodNumber>;
    serviceId: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    type: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    followUpDate: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        contacted: "contacted";
        interested: "interested";
        declined: "declined";
        converted: "converted";
    }>>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    id: z.ZodNumber;
}, z.core.$strip>;
export declare const opportunityFilterSchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<"asc" | "desc", string | undefined>>;
    search: z.ZodOptional<z.ZodString>;
    clientId: z.ZodOptional<z.ZodNumber>;
    vehicleId: z.ZodOptional<z.ZodNumber>;
    serviceId: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        pending: "pending";
        contacted: "contacted";
        interested: "interested";
        declined: "declined";
        converted: "converted";
    }>>;
    dateFrom: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    dateTo: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
}, z.core.$strip>;
export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
export type OpportunityFilterInput = z.infer<typeof opportunityFilterSchema>;
