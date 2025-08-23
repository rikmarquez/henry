import { Router } from 'express';
import { authenticate, authorize } from '../middleware';
import { validate, validateQuery } from '../middleware';
import { prisma } from '../services/prisma.service';
import {
  createBranchSchema,
  updateBranchSchema,
  getBranchesSchema,
  getBranchByIdSchema,
  deleteBranchSchema,
} from '../../../shared/schemas/branch.schema';

const router = Router();

// Debug endpoint to test branches table - MUST BE BEFORE AUTH
router.get('/debug-table', async (req, res) => {
  try {
    console.log('🔧 Testing branches table access...');
    
    // Try with raw SQL first
    const tableCheck = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_branches,
        EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'branches'
        ) as table_exists
      FROM branches;
    `;
    
    console.log('🔧 Raw query result:', tableCheck);
    
    // Convert BigInt to string for JSON serialization
    const serializedResult = tableCheck.map((row: any) => ({
      ...row,
      total_branches: row.total_branches.toString()
    }));
    
    res.json({
      success: true,
      debug: {
        rawQuery: serializedResult,
        prismaAvailable: !!prisma.branch,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('❌ Debug branches error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// All routes require authentication
router.use(authenticate);

// Create branch
const createBranch = async (req: any, res: any) => {
  try {
    const { name, code, address, phone, city } = req.body;

    const branch = await prisma.branch.create({
      data: {
        name,
        code,
        address,
        phone,
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

// Get branches with pagination - TEMPORARY RAW SQL FIX
const getBranches = async (req: any, res: any) => {
  try {
    console.log('🔧 getBranches called with query:', req.query);
    const { page = 1, limit = 10, search, isActive } = req.query;
    
    // Validate parameters
    const parsedPage = parseInt(page as string) || 1;
    const parsedLimit = Math.min(parseInt(limit as string) || 10, 100); // Max 100 items
    const offset = (parsedPage - 1) * parsedLimit;

    console.log('🔧 Parsed params:', { parsedPage, parsedLimit, offset, search, isActive });

    // Build WHERE conditions for raw SQL
    let whereConditions = ['1=1']; // Base condition
    let params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(
        name ILIKE $${paramIndex} OR 
        code ILIKE $${paramIndex} OR 
        city ILIKE $${paramIndex} OR 
        address ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (isActive !== undefined) {
      whereConditions.push(`is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');
    console.log('🔧 WHERE clause:', whereClause);
    console.log('🔧 Params:', params);

    // Simplified: Get all branches first, then paginate in memory for now
    const rawBranches = await prisma.$queryRaw`
      SELECT id, name, code, address, phone, city, is_active, created_at, updated_at
      FROM branches
      ORDER BY created_at DESC
    `;
    
    // Map database fields to match expected format
    const branches = Array.isArray(rawBranches) ? rawBranches.map((branch: any) => ({
      id: branch.id,
      name: branch.name,
      code: branch.code,
      address: branch.address,
      phone: branch.phone,
      city: branch.city,
      isActive: branch.is_active, // Map is_active to isActive
      createdAt: branch.created_at,
      updatedAt: branch.updated_at
    })) : [];
    console.log('🔧 Found branches:', Array.isArray(branches) ? branches.length : 0);

    // Apply pagination in memory
    const startIdx = offset;
    const endIdx = startIdx + parsedLimit;
    const paginatedBranches = Array.isArray(branches) ? branches.slice(startIdx, endIdx) : [];
    const totalCount = Array.isArray(branches) ? branches.length : 0;
    console.log('🔧 Total count:', totalCount);

    const totalPages = Math.ceil(totalCount / parsedLimit);

    res.json({
      success: true,
      data: {
        branches: paginatedBranches,
        pagination: {
          currentPage: parsedPage,
          totalPages,
          totalCount,
          limit: parsedLimit,
        },
      },
    });
  } catch (error: any) {
    console.error('❌ Error getting branches:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
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

// Get all active branches for dropdowns - RAW SQL FIX
const getActiveBranches = async (req: any, res: any) => {
  try {
    console.log('🔧 Getting active branches...');
    
    const rawBranches = await prisma.$queryRaw`
      SELECT id, name, code, city
      FROM branches
      WHERE is_active = true
      ORDER BY name ASC
    `;

    const branches = Array.isArray(rawBranches) ? rawBranches : [];
    console.log('🔧 Found active branches:', branches.length);

    res.json({
      success: true,
      data: branches,
    });
  } catch (error: any) {
    console.error('❌ Error getting active branches:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
};

// Route definitions
router.get('/active', 
  authorize(['branches'], ['read']),
  getActiveBranches
);

router.get('/', 
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