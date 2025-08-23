#!/usr/bin/env node

/**
 * Safe seeding script that handles missing tables gracefully
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function safeSeed() {
  console.log('🌱 Starting safe database seeding...');

  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Create roles first (should exist)
    console.log('👥 Setting up roles...');
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
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

    await prisma.role.upsert({
      where: { name: 'RECEPCIONISTA' },
      update: {},
      create: {
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

    await prisma.role.upsert({
      where: { name: 'ENCARGADO' },
      update: {},
      create: {
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

    // Create work statuses
    console.log('📋 Setting up work statuses...');
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

    // Try to create branch (might fail if table doesn't exist)
    let defaultBranch = null;
    try {
      defaultBranch = await prisma.branch.upsert({
        where: { code: 'HD001' },
        update: {},
        create: {
          name: 'Henry Diagnostics Central',
          code: 'HD001',
          address: 'Dirección Principal',
          phone: '+52-555-000-0000',
          email: 'central@henrydiagnostics.com',
          city: 'Ciudad Principal',
        },
      });
      console.log(`✅ Default branch created: ${defaultBranch.name}`);
    } catch (error) {
      console.log('⚠️ Could not create branch, table might not exist');
      // Set default branch ID to 1 for user creation
      defaultBranch = { id: 1 };
    }

    // Create admin users
    console.log('👤 Setting up admin users...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    try {
      await prisma.user.upsert({
        where: { email: 'admin@henrydiagnostics.com' },
        update: {},
        create: {
          name: 'Administrador',
          email: 'admin@henrydiagnostics.com',
          phone: '+1234567890',
          passwordHash: hashedPassword,
          roleId: adminRole.id,
          branchId: defaultBranch.id,
        },
      });

      const rikHashedPassword = await bcrypt.hash('Acceso979971', 12);
      await prisma.user.upsert({
        where: { email: 'rik@rikmarquez.com' },
        update: {},
        create: {
          name: 'Rik Marquez',
          email: 'rik@rikmarquez.com',
          phone: '+1234567891',
          passwordHash: rikHashedPassword,
          roleId: adminRole.id,
          branchId: defaultBranch.id,
        },
      });

      console.log('✅ Admin users created');
    } catch (error) {
      console.log('⚠️ Could not create users with branchId, trying without...');
      try {
        // Try creating users without branchId (will be updated later)
        await prisma.user.upsert({
          where: { email: 'admin@henrydiagnostics.com' },
          update: {},
          create: {
            name: 'Administrador',
            email: 'admin@henrydiagnostics.com',
            phone: '+1234567890',
            passwordHash: hashedPassword,
            roleId: adminRole.id,
          },
        });
        console.log('✅ Admin user created (without branchId)');
      } catch (userError) {
        console.log('❌ Could not create admin user:', userError.message);
      }
    }

    // Create sample mechanics if possible
    try {
      const mechanics = [
        { name: 'Juan Pérez', commissionPercentage: 15.00, branchId: defaultBranch.id },
        { name: 'María González', commissionPercentage: 12.50, branchId: defaultBranch.id },
        { name: 'Carlos Rodríguez', commissionPercentage: 20.00, branchId: defaultBranch.id },
      ];

      for (const mechanic of mechanics) {
        try {
          await prisma.mechanic.upsert({
            where: { name: mechanic.name },
            update: {},
            create: mechanic
          });
        } catch (error) {
          // Try without branchId
          const { branchId, ...mechanicWithoutBranch } = mechanic;
          try {
            await prisma.mechanic.upsert({
              where: { name: mechanicWithoutBranch.name },
              update: {},
              create: mechanicWithoutBranch
            });
          } catch (e) {
            console.log(`⚠️ Could not create mechanic ${mechanic.name}`);
          }
        }
      }
      console.log('✅ Sample mechanics created');
    } catch (error) {
      console.log('⚠️ Could not create mechanics');
    }

    console.log('🎉 Safe seeding completed successfully!');

  } catch (error) {
    console.error('❌ Safe seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  safeSeed();
}

module.exports = { safeSeed };