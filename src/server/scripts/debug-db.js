#!/usr/bin/env node

/**
 * Debug script to check database state in production
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugDatabase() {
  console.log('🔍 Debugging database state...');

  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Check tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    console.log('📋 Available tables:', tables.map(t => t.table_name));

    // Check branches
    try {
      const branches = await prisma.branch.findMany();
      console.log(`🏢 Branches (${branches.length}):`, branches.map(b => ({ id: b.id, name: b.name, code: b.code })));
    } catch (error) {
      console.log('❌ Error querying branches:', error.message);
    }

    // Check roles
    try {
      const roles = await prisma.role.findMany();
      console.log(`👥 Roles (${roles.length}):`, roles.map(r => ({ id: r.id, name: r.name })));
    } catch (error) {
      console.log('❌ Error querying roles:', error.message);
    }

    // Check users
    try {
      const users = await prisma.user.findMany({
        include: {
          role: true,
          branch: true
        }
      });
      console.log(`👤 Users (${users.length}):`);
      users.forEach(u => {
        console.log(`  - ${u.name} (${u.email}) - Role: ${u.role?.name || 'NO_ROLE'} - Branch: ${u.branch?.name || 'NO_BRANCH'}`);
      });
    } catch (error) {
      console.log('❌ Error querying users:', error.message);
    }

    // Check work statuses
    try {
      const statuses = await prisma.workStatus.findMany();
      console.log(`📋 Work Statuses (${statuses.length}):`, statuses.map(s => ({ id: s.id, name: s.name })));
    } catch (error) {
      console.log('❌ Error querying work statuses:', error.message);
    }

    // Test admin user specifically
    try {
      const adminUser = await prisma.user.findUnique({
        where: { email: 'admin@henrydiagnostics.com' },
        include: {
          role: true,
          branch: true
        }
      });
      
      if (adminUser) {
        console.log('✅ Admin user found:', {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role?.name,
          branch: adminUser.branch?.name,
          branchId: adminUser.branchId,
          hasPassword: !!adminUser.passwordHash
        });
      } else {
        console.log('❌ Admin user NOT found');
      }
    } catch (error) {
      console.log('❌ Error querying admin user:', error.message);
    }

    console.log('🔍 Debug completed');

  } catch (error) {
    console.error('💥 Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  debugDatabase();
}

module.exports = { debugDatabase };