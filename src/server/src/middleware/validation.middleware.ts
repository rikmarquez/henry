import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('🔧 VALIDATION INPUT:', JSON.stringify(req.body, null, 2));
      req.body = schema.parse(req.body);
      console.log('✅ VALIDATION PASSED');
      next();
    } catch (error) {
      console.log('❌ FULL ERROR:', error);
      if (error instanceof ZodError) {
        console.log('❌ VALIDATION FAILED:', error.errors);
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: error.errors?.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })) || [],
        });
      }
      
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros de consulta inválidos',
          errors: error.errors?.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })) || [],
        });
      }
      
      next(error);
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros de ruta inválidos',
          errors: error.errors?.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })) || [],
        });
      }
      
      next(error);
    }
  };
};