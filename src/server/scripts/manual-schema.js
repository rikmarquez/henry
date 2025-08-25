#!/usr/bin/env node

/**
 * Manual schema creation for Railway deployment
 * Creates tables directly with SQL if Prisma schema sync fails
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTablesManually() {
  console.log('🔧 Creating tables manually...');

  try {
    // Create branches table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "branches" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "code" TEXT UNIQUE NOT NULL,
        "address" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "email" TEXT,
        "city" TEXT NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Branches table created');

    // Add branch_id to existing tables if they don't have it
    const tables = ['users', 'mechanics', 'appointments', 'services', 'opportunities'];
    
    for (const table of tables) {
      try {
        await prisma.$executeRaw`
          ALTER TABLE "${table}" 
          ADD COLUMN IF NOT EXISTS "branch_id" INTEGER REFERENCES "branches"("id")
        `;
        console.log(`✅ Added branch_id to ${table}`);
      } catch (error) {
        console.log(`⚠️ Could not add branch_id to ${table}: ${error.message}`);
      }
    }

    // Add pricing fields to services table if they don't exist
    const pricingFields = [
      { name: 'labor_price', type: 'DECIMAL(10,2) DEFAULT 0.00' },
      { name: 'parts_price', type: 'DECIMAL(10,2) DEFAULT 0.00' }, 
      { name: 'parts_cost', type: 'DECIMAL(10,2) DEFAULT 0.00' },
      { name: 'truput', type: 'DECIMAL(10,2) DEFAULT 0.00' }
    ];

    for (const field of pricingFields) {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "services" 
          ADD COLUMN IF NOT EXISTS "${field.name}" ${field.type}
        `);
        console.log(`✅ Added ${field.name} to services table`);
      } catch (error) {
        console.log(`⚠️ Could not add ${field.name} to services: ${error.message}`);
      }
    }

    // Create default branch
    await prisma.$executeRaw`
      INSERT INTO "branches" ("name", "code", "address", "phone", "email", "city")
      VALUES ('Henry Diagnostics Central', 'HD001', 'Dirección Principal', '+52-555-000-0000', 'central@henrydiagnostics.com', 'Ciudad Principal')
      ON CONFLICT ("code") DO NOTHING
    `;
    console.log('✅ Default branch inserted');

    // Update existing records to use branch 1
    for (const table of tables) {
      try {
        await prisma.$executeRaw`
          UPDATE "${table}" SET "branch_id" = 1 WHERE "branch_id" IS NULL
        `;
        console.log(`✅ Updated ${table} with default branch_id`);
      } catch (error) {
        console.log(`⚠️ Could not update ${table}: ${error.message}`);
      }
    }

    console.log('🎉 Manual schema creation completed!');
    return true;

  } catch (error) {
    console.error('❌ Manual schema creation failed:', error);
    return false;
  }
}

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    // Try to check if branches table exists
    let branchExists = false;
    try {
      await prisma.$queryRaw`SELECT 1 FROM "branches" LIMIT 1`;
      branchExists = true;
      console.log('✅ Branches table exists');
    } catch (error) {
      console.log('⚠️ Branches table does not exist, will create manually');
    }

    if (!branchExists) {
      const success = await createTablesManually();
      if (!success) {
        process.exit(1);
      }
    } else {
      // Force pricing fields creation even if branches exist
      console.log('🔧 Forcing pricing fields creation...');
      
      const pricingFields = [
        { name: 'labor_price', type: 'DECIMAL(10,2) DEFAULT 0.00' },
        { name: 'parts_price', type: 'DECIMAL(10,2) DEFAULT 0.00' }, 
        { name: 'parts_cost', type: 'DECIMAL(10,2) DEFAULT 0.00' },
        { name: 'truput', type: 'DECIMAL(10,2) DEFAULT 0.00' }
      ];

      for (const field of pricingFields) {
        try {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "services" 
            ADD COLUMN IF NOT EXISTS "${field.name}" ${field.type}
          `);
          console.log(`✅ Added ${field.name} to services table`);
        } catch (error) {
          console.log(`⚠️ Could not add ${field.name} to services: ${error.message}`);
        }
      }
    }

    console.log('🚀 Schema setup completed successfully!');

  } catch (error) {
    console.error('💥 Schema setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { main, createTablesManually };