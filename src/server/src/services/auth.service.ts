import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { LoginInput, RegisterInput } from '../../../shared/schemas';
import { prisma } from './prisma.service';

interface JWTPayload {
  userId: number;
  email: string;
  roleId: number;
  roleName: string;
  branchId: number;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private jwtSecret = process.env.JWT_SECRET!;
  private jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
  private jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  private jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
  private saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');

  constructor() {
    if (!this.jwtSecret || !this.jwtRefreshSecret) {
      throw new Error('JWT secrets are required');
    }
  }

  async login(data: LoginInput): Promise<{ user: any; tokens: TokenPair }> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { 
        role: true,
        branch: true 
      },
    });

    if (!user || !user.isActive) {
      throw new Error('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email!,
      roleId: user.roleId,
      roleName: user.role.name,
      branchId: user.branchId,
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  async register(data: RegisterInput, createdBy: number): Promise<{ user: any; tokens: TokenPair }> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
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
      },
      include: { role: true },
    });

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email!,
      roleId: user.roleId,
      roleName: user.role.name,
      branchId: user.branchId,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = jwt.verify(refreshToken, this.jwtRefreshSecret) as JWTPayload;
      
      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { role: true, branch: true },
      });

      if (!user || !user.isActive) {
        throw new Error('Usuario inválido');
      }

      return this.generateTokens({
        userId: user.id,
        email: user.email!,
        roleId: user.roleId,
        roleName: user.role.name,
        branchId: user.branchId,
      });
    } catch (error) {
      throw new Error('Token de actualización inválido');
    }
  }

  async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      return jwt.verify(token, this.jwtSecret) as JWTPayload;
    } catch (error) {
      throw new Error('Token de acceso inválido');
    }
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('Contraseña actual incorrecta');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, this.saltRounds);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }

  private generateTokens(payload: JWTPayload): TokenPair {
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    });

    const refreshToken = jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.jwtRefreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async getUserProfile(userId: number): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        role: true,
        branch: true 
      },
    });

    if (!user || !user.isActive) {
      throw new Error('Usuario no encontrado o inactivo');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();