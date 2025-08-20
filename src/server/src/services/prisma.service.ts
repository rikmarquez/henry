import { PrismaClient } from '@prisma/client';

class PrismaService {
  private prisma: PrismaClient | null = null;

  getInstance(): PrismaClient {
    if (!this.prisma) {
      this.prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    }
    return this.prisma;
  }

  async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
    }
  }
}

export const prismaService = new PrismaService();
export const prisma = prismaService.getInstance();