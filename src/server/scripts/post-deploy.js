#!/usr/bin/env node

/**
 * Post-deployment script for Railway
 * Repopulates essential data after schema changes
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Running post-deployment setup...');

  try {
    // Check if branches table exists and has data
    const branchCount = await prisma.branch.count();
    
    if (branchCount === 0) {
      console.log('📋 Creating default branch...');
      
      // Create default branch
      const defaultBranch = await prisma.branch.create({
        data: {
          name: 'Henry Diagnostics Central',
          code: 'HD001',
          address: 'Dirección Principal',
          phone: '+52-555-000-0000',
          email: 'central@henrydiagnostics.com',
          city: 'Ciudad Principal',
        },
      });
      
      console.log(`✅ Default branch created: ${defaultBranch.name}`);
    }

    // Check if roles exist
    const roleCount = await prisma.role.count();
    
    if (roleCount === 0) {
      console.log('👥 Creating roles...');
      
      // Create admin role
      await prisma.role.create({
        data: {
          name: 'ADMIN',
          permissions: {
            users: ['create', 'read', 'update', 'delete'],
            clients: ['create', 'read', 'update', 'delete'],
            vehicles: ['create', 'read', 'update', 'delete'],
            appointments: ['create', 'read', 'update', 'delete'],
            services: ['create', 'read', 'update', 'delete'],
            opportunities: ['create', 'read', 'update', 'delete'],
            mechanics: ['create', 'read', 'update', 'delete'],
            branches: ['create', 'read', 'update', 'delete'],
            reports: ['read']
          },
        },
      });

      // Create other roles
      await prisma.role.create({
        data: {
          name: 'RECEPCIONISTA',
          permissions: {
            clients: ['create', 'read', 'update'],
            vehicles: ['create', 'read', 'update'],
            appointments: ['create', 'read', 'update', 'delete'],
            services: ['create', 'read', 'update'],
            opportunities: ['read']
          },
        },
      });

      await prisma.role.create({
        data: {
          name: 'ENCARGADO',
          permissions: {
            clients: ['create', 'read', 'update', 'delete'],
            vehicles: ['create', 'read', 'update', 'delete'],
            appointments: ['create', 'read', 'update', 'delete'],
            services: ['create', 'read', 'update', 'delete'],
            opportunities: ['create', 'read', 'update', 'delete'],
            mechanics: ['read'],
            reports: ['read']
          },
        },
      });
      
      console.log('✅ Roles created');
    }

    // Check if work statuses exist
    const statusCount = await prisma.workStatus.count();
    
    if (statusCount === 0) {
      console.log('📋 Creating work statuses...');
      
      const workStatuses = [
        { id: 1, name: 'Recibido', orderIndex: 1, color: '#EF4444' },
        { id: 2, name: 'Cotizado', orderIndex: 2, color: '#F59E0B' },
        { id: 3, name: 'Autorizado', orderIndex: 3, color: '#3B82F6' },
        { id: 4, name: 'En Proceso', orderIndex: 4, color: '#8B5CF6' },
        { id: 5, name: 'Terminado', orderIndex: 5, color: '#10B981' },
      ];

      for (const status of workStatuses) {
        await prisma.workStatus.upsert({
          where: { id: status.id },
          update: {},
          create: status,
        });
      }
      
      console.log('✅ Work statuses created');
    }

    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@henrydiagnostics.com' }
    });

    if (!adminUser) {
      console.log('👤 Creating admin user...');
      
      const adminRole = await prisma.role.findUnique({
        where: { name: 'ADMIN' }
      });
      
      const defaultBranch = await prisma.branch.findUnique({
        where: { code: 'HD001' }
      });

      if (adminRole && defaultBranch) {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        
        await prisma.user.create({
          data: {
            name: 'Administrador',
            email: 'admin@henrydiagnostics.com',
            phone: '+1234567890',
            passwordHash: hashedPassword,
            roleId: adminRole.id,
            branchId: defaultBranch.id,
          },
        });
        
        console.log('✅ Admin user created');
      }
    }

    console.log('🎉 Post-deployment setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Post-deployment setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { main };