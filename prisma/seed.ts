import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create roles first 
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

  // Create default branch 
  const defaultBranch = await prisma.branch.upsert({
    where: { code: 'HD001' },
    update: {},
    create: {
      name: 'Henry Diagnostics Central',
      code: 'HD001',
      address: 'Dirección Principal',
      phone: '+52-555-000-0000',
      city: 'Ciudad Principal',
    },
  });

  console.log(`🏢 Default branch created: ${defaultBranch.name}`);

  const receptionistRole = await prisma.role.upsert({
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

  const managerRole = await prisma.role.upsert({
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

  // Create work statuses
  const workStatuses = [
    { name: 'Recibido', orderIndex: 1, color: '#EF4444' },
    { name: 'Cotizado', orderIndex: 2, color: '#F59E0B' },
    { name: 'Autorizado', orderIndex: 3, color: '#3B82F6' },
    { name: 'En Proceso', orderIndex: 4, color: '#8B5CF6' },
    { name: 'Terminado', orderIndex: 5, color: '#10B981' },
  ];

  for (const status of workStatuses) {
    await prisma.workStatus.upsert({
      where: { id: status.orderIndex },
      update: {},
      create: status,
    });
  }

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.upsert({
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

  // Create Rik admin user
  const rikHashedPassword = await bcrypt.hash('Acceso979971', 12);
  
  const rikAdminUser = await prisma.user.upsert({
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

  // Create some sample mechanics (prevent duplicates with upsert)
  console.log('🔧 Creating mechanics...');
  const mechanics = [
    { name: 'Juan Pérez', commissionPercentage: 15.00, branchId: defaultBranch.id },
    { name: 'María González', commissionPercentage: 12.50, branchId: defaultBranch.id },
    { name: 'Carlos Rodríguez', commissionPercentage: 20.00, branchId: defaultBranch.id },
  ];

  const createdMechanics = [];
  for (const mechanicData of mechanics) {
    const existingMechanic = await prisma.mechanic.findFirst({
      where: { 
        name: mechanicData.name,
        branchId: mechanicData.branchId 
      }
    });

    if (!existingMechanic) {
      const mechanic = await prisma.mechanic.create({
        data: mechanicData,
      });
      createdMechanics.push(mechanic);
      console.log(`   ✅ Created mechanic: ${mechanic.name}`);
    } else {
      console.log(`   ⚠️ Mechanic already exists: ${mechanicData.name}`);
      createdMechanics.push(existingMechanic);
    }
  }

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Admin user: admin@henrydiagnostics.com / admin123`);
  console.log(`👤 Rik admin user: rik@rikmarquez.com / Acceso979971`);
  console.log(`🔧 Created ${mechanics.length} mechanics`);
  console.log(`📋 Created ${workStatuses.length} work statuses`);
  console.log(`👥 Created 3 roles: ADMIN, RECEPCIONISTA, ENCARGADO`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });