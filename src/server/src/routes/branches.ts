import { Router } from 'express';
import { authenticate, authorize } from '../middleware';
import { validate } from '../middleware';
import { prisma } from '../services/prisma.service';
import {
  createBranchSchema,
  updateBranchSchema,
  getBranchesSchema,
  getBranchByIdSchema,
  deleteBranchSchema,
} from '../../../shared/schemas/branch.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create branch
const createBranch = async (req: any, res: any) => {
  try {
    const { name, code, address, phone, email, city } = req.body;

    const branch = await prisma.branch.create({
      data: {
        name,
        code,
        address,
        phone,
        email,
        city,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Sucursal creada exitosamente',
      data: branch,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una sucursal con ese código',
        error: 'DUPLICATE_CODE'
      });
    }

    console.error('Error creating branch:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
};

// Get branches with pagination
const getBranches = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [branches, totalCount] = await Promise.all([
      prisma.branch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              mechanics: true,
              services: true,
              appointments: true,
            }
          }
        }
      }),
      prisma.branch.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: {
        branches,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
        },
      },
    });
  } catch (error: any) {
    console.error('Error getting branches:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
};

// Get branch by ID
const getBranchById = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const branch = await prisma.branch.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            users: true,
            mechanics: true,
            services: true,
            appointments: true,
            opportunities: true,
          }
        }
      }
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada',
      });
    }

    res.json({
      success: true,
      data: branch,
    });
  } catch (error: any) {
    console.error('Error getting branch by id:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
};

// Update branch
const updateBranch = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const branch = await prisma.branch.findUnique({
      where: { id: parseInt(id) }
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada',
      });
    }

    const updatedBranch = await prisma.branch.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        _count: {
          select: {
            users: true,
            mechanics: true,
            services: true,
            appointments: true,
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Sucursal actualizada exitosamente',
      data: updatedBranch,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una sucursal con ese código',
        error: 'DUPLICATE_CODE'
      });
    }

    console.error('Error updating branch:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
};

// Delete branch
const deleteBranch = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const branch = await prisma.branch.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            users: true,
            mechanics: true,
            services: true,
            appointments: true,
          }
        }
      }
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada',
      });
    }

    // Check if branch has related records
    const hasRelatedRecords = branch._count.users > 0 || 
                             branch._count.mechanics > 0 || 
                             branch._count.services > 0 || 
                             branch._count.appointments > 0;

    if (hasRelatedRecords) {
      // Soft delete - mark as inactive
      const updatedBranch = await prisma.branch.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
      });

      return res.json({
        success: true,
        message: 'Sucursal desactivada exitosamente (tiene registros asociados)',
        data: updatedBranch,
      });
    }

    // Hard delete if no related records
    await prisma.branch.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Sucursal eliminada exitosamente',
    });
  } catch (error: any) {
    console.error('Error deleting branch:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
};

// Get all active branches for dropdowns
const getActiveBranches = async (req: any, res: any) => {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: branches,
    });
  } catch (error: any) {
    console.error('Error getting active branches:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
};

// Route definitions
router.get('/active', getActiveBranches);

router.get('/', 
  validate(getBranchesSchema),
  authorize(['branches'], ['read']), 
  getBranches
);

router.get('/:id', 
  validate(getBranchByIdSchema),
  authorize(['branches'], ['read']),
  getBranchById
);

router.post('/', 
  validate(createBranchSchema),
  authorize(['branches'], ['create']),
  createBranch
);

router.put('/:id', 
  validate(updateBranchSchema),
  authorize(['branches'], ['update']),
  updateBranch
);

router.delete('/:id', 
  validate(deleteBranchSchema),
  authorize(['branches'], ['delete']),
  deleteBranch
);

export default router;