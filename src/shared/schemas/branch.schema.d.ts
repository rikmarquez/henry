import { z } from 'zod';

export declare const createBranchSchema: z.ZodObject<{
  body: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    address: z.ZodString;
    phone: z.ZodString;
    email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    city: z.ZodString;
  }>;
}>;

export declare const updateBranchSchema: z.ZodObject<{
  params: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, number, string>;
  }>;
  body: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    city: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
  }>;
}>;

export declare const getBranchesSchema: z.ZodObject<{
  query: z.ZodObject<{
    page: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
    search: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
  }>;
}>;

export declare const getBranchByIdSchema: z.ZodObject<{
  params: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, number, string>;
  }>;
}>;

export declare const deleteBranchSchema: z.ZodObject<{
  params: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, number, string>;
  }>;
}>;

export interface Branch {
  id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  email?: string | null;
  city: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBranchRequest {
  name: string;
  code: string;
  address: string;
  phone: string;
  email?: string | null;
  city: string;
}

export interface UpdateBranchRequest {
  name?: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string | null;
  city?: string;
  isActive?: boolean;
}

export interface GetBranchesQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}