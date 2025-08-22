const { z } = require('zod');

const createBranchSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'Nombre debe tener al menos 2 caracteres')
      .max(100, 'Nombre no puede exceder 100 caracteres'),
    code: z.string()
      .min(3, 'Código debe tener al menos 3 caracteres')
      .max(10, 'Código no puede exceder 10 caracteres')
      .regex(/^[A-Z0-9]+$/, 'Código debe contener solo letras mayúsculas y números'),
    address: z.string()
      .min(5, 'Dirección debe tener al menos 5 caracteres')
      .max(200, 'Dirección no puede exceder 200 caracteres'),
    phone: z.string()
      .min(10, 'Teléfono debe tener al menos 10 caracteres')
      .max(20, 'Teléfono no puede exceder 20 caracteres'),
    email: z.string()
      .email('Email debe tener un formato válido')
      .optional()
      .nullable(),
    city: z.string()
      .min(2, 'Ciudad debe tener al menos 2 caracteres')
      .max(50, 'Ciudad no puede exceder 50 caracteres'),
  })
});

const updateBranchSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número válido').transform(Number)
  }),
  body: z.object({
    name: z.string()
      .min(2, 'Nombre debe tener al menos 2 caracteres')
      .max(100, 'Nombre no puede exceder 100 caracteres')
      .optional(),
    code: z.string()
      .min(3, 'Código debe tener al menos 3 caracteres')
      .max(10, 'Código no puede exceder 10 caracteres')
      .regex(/^[A-Z0-9]+$/, 'Código debe contener solo letras mayúsculas y números')
      .optional(),
    address: z.string()
      .min(5, 'Dirección debe tener al menos 5 caracteres')
      .max(200, 'Dirección no puede exceder 200 caracteres')
      .optional(),
    phone: z.string()
      .min(10, 'Teléfono debe tener al menos 10 caracteres')
      .max(20, 'Teléfono no puede exceder 20 caracteres')
      .optional(),
    email: z.string()
      .email('Email debe tener un formato válido')
      .optional()
      .nullable(),
    city: z.string()
      .min(2, 'Ciudad debe tener al menos 2 caracteres')
      .max(50, 'Ciudad no puede exceder 50 caracteres')
      .optional(),
    isActive: z.boolean().optional(),
  })
});

const getBranchesSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().max(100).optional(),
  isActive: z.string()
    .transform((val) => val === 'true')
    .optional(),
});

const getBranchByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número válido').transform(Number)
  })
});

const deleteBranchSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número válido').transform(Number)
  })
});

module.exports = {
  createBranchSchema,
  updateBranchSchema,
  getBranchesSchema,
  getBranchByIdSchema,
  deleteBranchSchema,
};