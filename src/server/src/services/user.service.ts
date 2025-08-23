import bcrypt from 'bcrypt';
import { CreateUserInput, UpdateUserInput, UserFilterInput, UpdateUserPasswordInput } from '../../../shared/schemas';
import { prisma } from './prisma.service';

export class UserService {
  private saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');

  async createUser(data: CreateUserInput & { password: string }): Promise<any> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email || undefined },
    });

    if (existingUser) {
      throw new Error('El usuario ya existe');
    }

    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: data.roleId },
    });

    if (!role) {
      throw new Error('Rol inválido');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, this.saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        roleId: data.roleId,
        isActive: data.isActive,
      },
      include: {
        role: true,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUsers(filters: UserFilterInput = {}): Promise<{ users: any[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 10, search, roleId, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
    const skip = (page - 1) * limit;

    console.log('🔧 userService.getUsers - filtros:', { page, limit, search, roleId, isActive });

    // Use raw SQL to avoid Prisma client cache issues
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ` AND (u.name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1} OR u.phone ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    if (roleId) {
      whereClause += ` AND u.role_id = $${params.length + 1}`;
      params.push(roleId);
    }

    if (typeof isActive === 'boolean') {
      whereClause += ` AND u.is_active = $${params.length + 1}`;
      params.push(isActive);
    }

    const orderClause = `ORDER BY u.${sortBy === 'createdAt' ? 'created_at' : sortBy} ${sortOrder}`;

    // Get users with pagination - no branch_id column exists yet
    const usersQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.is_active as "isActive",
        u.role_id as "roleId",
        u.created_at as "createdAt",
        u.updated_at as "updatedAt",
        r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ${orderClause}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;

    params.push(limit, skip);

    console.log('🔧 SQL Query:', usersQuery);
    console.log('🔧 SQL Params:', params);

    // Execute queries separately to handle parameters correctly
    const rawUsers = await prisma.$queryRawUnsafe(usersQuery, ...params) as any[];
    
    // For count, use params without limit/offset
    const countParams = params.slice(0, -2);
    const rawCount = await prisma.$queryRawUnsafe(countQuery, ...countParams) as { total: bigint }[];

    const users = rawUsers.map(user => ({
      ...user,
      role: { id: user.roleId, name: user.role_name },
      // Remove raw fields
      role_name: undefined
    }));

    const total = Number(rawCount[0]?.total || 0);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: number): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(id: number, data: Partial<UpdateUserInput>): Promise<any> {
    // Verify user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error('Usuario no encontrado');
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new Error('El email ya está en uso');
      }
    }

    // Verify role exists if roleId is being updated
    if (data.roleId) {
      const role = await prisma.role.findUnique({
        where: { id: data.roleId },
      });

      if (!role) {
        throw new Error('Rol inválido');
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      include: {
        role: true,
      },
    });

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUserPassword(data: UpdateUserPasswordInput): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: data.id },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const newPasswordHash = await bcrypt.hash(data.newPassword, this.saltRounds);
    await prisma.user.update({
      where: { id: data.id },
      data: { passwordHash: newPasswordHash },
    });
  }

  async deleteUser(id: number): Promise<void> {
    // Verify user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error('Usuario no encontrado');
    }

    // Instead of deleting, we deactivate the user
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getRoles(): Promise<any[]> {
    return prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }
}

export const userService = new UserService();