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

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    if (roleId) {
      where.roleId = roleId;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const usersWithoutPasswords = users.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return {
      users: usersWithoutPasswords,
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