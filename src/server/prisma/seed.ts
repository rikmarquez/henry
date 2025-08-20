import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Limpiando datos existentes...');
    await prisma.statusLog.deleteMany();
    await prisma.opportunity.deleteMany();
    await prisma.service.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.client.deleteMany();
    await prisma.mechanic.deleteMany();
    await prisma.workStatus.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
  }

  // 1. Crear roles y permisos
  console.log('👥 Creando roles...');
  const adminRole = await prisma.role.create({
    data: {
      name: 'Administrador',
      permissions: [
        { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'clients', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'vehicles', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'appointments', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'services', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'mechanics', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'opportunities', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'reports', actions: ['read'] },
        { resource: 'workstatus', actions: ['create', 'read', 'update', 'delete'] },
      ],
    },
  });

  const mechanicRole = await prisma.role.create({
    data: {
      name: 'Mecánico',
      permissions: [
        { resource: 'clients', actions: ['read'] },
        { resource: 'vehicles', actions: ['read'] },
        { resource: 'appointments', actions: ['read', 'update'] },
        { resource: 'services', actions: ['read', 'update'] },
        { resource: 'opportunities', actions: ['read'] },
      ],
    },
  });

  const receptionistRole = await prisma.role.create({
    data: {
      name: 'Recepcionista',
      permissions: [
        { resource: 'clients', actions: ['create', 'read', 'update'] },
        { resource: 'vehicles', actions: ['create', 'read', 'update'] },
        { resource: 'appointments', actions: ['create', 'read', 'update'] },
        { resource: 'services', actions: ['create', 'read'] },
        { resource: 'opportunities', actions: ['create', 'read', 'update'] },
      ],
    },
  });

  // 2. Crear usuarios
  console.log('👤 Creando usuarios...');
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.create({
    data: {
      name: 'Administrador Henry',
      email: 'admin@henry.com',
      password: hashedPassword,
      roleId: adminRole.id,
    },
  });

  const mechanicPassword = await bcrypt.hash('mecanico123', 12);
  const mechanicUser = await prisma.user.create({
    data: {
      name: 'Carlos Mechanic',
      email: 'mecanico@henry.com',
      password: mechanicPassword,
      roleId: mechanicRole.id,
    },
  });

  const receptionistPassword = await bcrypt.hash('recepcion123', 12);
  const receptionistUser = await prisma.user.create({
    data: {
      name: 'Ana Recepcionista',
      email: 'recepcion@henry.com',
      password: receptionistPassword,
      roleId: receptionistRole.id,
    },
  });

  // 3. Crear estados de trabajo
  console.log('🔧 Creando estados de trabajo...');
  const workStatuses = await Promise.all([
    prisma.workStatus.create({
      data: {
        name: 'Recibido',
        orderIndex: 1,
        color: '#6B7280', // Gray
      },
    }),
    prisma.workStatus.create({
      data: {
        name: 'En Diagnóstico',
        orderIndex: 2,
        color: '#F59E0B', // Yellow
      },
    }),
    prisma.workStatus.create({
      data: {
        name: 'Cotización Enviada',
        orderIndex: 3,
        color: '#3B82F6', // Blue
      },
    }),
    prisma.workStatus.create({
      data: {
        name: 'Aprobado - En Reparación',
        orderIndex: 4,
        color: '#8B5CF6', // Purple
      },
    }),
    prisma.workStatus.create({
      data: {
        name: 'Control de Calidad',
        orderIndex: 5,
        color: '#06B6D4', // Cyan
      },
    }),
    prisma.workStatus.create({
      data: {
        name: 'Listo para Entrega',
        orderIndex: 6,
        color: '#10B981', // Green
      },
    }),
    prisma.workStatus.create({
      data: {
        name: 'Entregado',
        orderIndex: 7,
        color: '#059669', // Dark Green
      },
    }),
    prisma.workStatus.create({
      data: {
        name: 'Cancelado',
        orderIndex: 8,
        color: '#EF4444', // Red
      },
    }),
  ]);

  // 4. Crear mecánicos
  console.log('🔧 Creando mecánicos...');
  const mechanics = await Promise.all([
    prisma.mechanic.create({
      data: {
        name: 'Carlos Rodriguez',
        phone: '+573001234567',
        email: 'carlos@henry.com',
        specialty: 'Motor y Transmisión',
        commissionPercentage: 15.0,
        isActive: true,
      },
    }),
    prisma.mechanic.create({
      data: {
        name: 'Miguel Santos',
        phone: '+573007654321',
        email: 'miguel@henry.com',
        specialty: 'Sistema Eléctrico',
        commissionPercentage: 12.5,
        isActive: true,
      },
    }),
    prisma.mechanic.create({
      data: {
        name: 'Pedro Martinez',
        phone: '+573009876543',
        email: 'pedro@henry.com',
        specialty: 'Frenos y Suspensión',
        commissionPercentage: 10.0,
        isActive: true,
      },
    }),
  ]);

  // 5. Crear clientes de ejemplo
  console.log('👥 Creando clientes...');
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Juan Pérez',
        email: 'juan.perez@email.com',
        phone: '+573101234567',
        address: 'Carrera 15 #123-45, Bogotá',
        documentType: 'cedula',
        documentNumber: '12345678',
      },
    }),
    prisma.client.create({
      data: {
        name: 'María González',
        email: 'maria.gonzalez@email.com',
        phone: '+573109876543',
        address: 'Calle 80 #20-30, Medellín',
        documentType: 'cedula',
        documentNumber: '87654321',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Transportes XYZ S.A.S.',
        email: 'contacto@transportesxyz.com',
        phone: '+573115555555',
        address: 'Zona Industrial, Cali',
        documentType: 'nit',
        documentNumber: '900123456-1',
      },
    }),
  ]);

  // 6. Crear vehículos
  console.log('🚗 Creando vehículos...');
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        clientId: clients[0].id,
        plate: 'ABC123',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2020,
        color: 'Blanco',
        vin: '1HGBH41JXMN109186',
        mileage: 45000,
      },
    }),
    prisma.vehicle.create({
      data: {
        clientId: clients[1].id,
        plate: 'XYZ789',
        brand: 'Chevrolet',
        model: 'Spark',
        year: 2019,
        color: 'Rojo',
        vin: '2HGBH41JXMN109187',
        mileage: 62000,
      },
    }),
    prisma.vehicle.create({
      data: {
        clientId: clients[2].id,
        plate: 'TRK456',
        brand: 'Ford',
        model: 'Transit',
        year: 2018,
        color: 'Blanco',
        vin: '3HGBH41JXMN109188',
        mileage: 125000,
      },
    }),
  ]);

  // 7. Crear citas
  console.log('📅 Creando citas...');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const appointments = await Promise.all([
    prisma.appointment.create({
      data: {
        clientId: clients[0].id,
        vehicleId: vehicles[0].id,
        scheduledDate: tomorrow,
        description: 'Revisión general y cambio de aceite',
        status: 'scheduled',
        notes: 'Cliente reporta ruido extraño en el motor',
      },
    }),
    prisma.appointment.create({
      data: {
        clientId: clients[1].id,
        vehicleId: vehicles[1].id,
        scheduledDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
        description: 'Diagnóstico sistema eléctrico',
        status: 'confirmed',
        notes: 'Problemas con luces y batería',
      },
    }),
  ]);

  // 8. Crear servicios
  console.log('🔧 Creando servicios...');
  const services = await Promise.all([
    prisma.service.create({
      data: {
        clientId: clients[0].id,
        vehicleId: vehicles[0].id,
        mechanicId: mechanics[0].id,
        appointmentId: appointments[0].id,
        statusId: workStatuses[1].id, // En Diagnóstico
        description: 'Cambio de aceite y filtros + revisión general',
        estimatedHours: 2.5,
        laborCost: 150000,
        partsCost: 80000,
        totalAmount: 230000,
        mechanicCommission: 34500, // 15% de 230000
        notes: 'Aceite sintético solicitado por el cliente',
        createdBy: adminUser.id,
      },
    }),
    prisma.service.create({
      data: {
        clientId: clients[2].id,
        vehicleId: vehicles[2].id,
        mechanicId: mechanics[1].id,
        statusId: workStatuses[5].id, // Listo para Entrega
        description: 'Reparación sistema eléctrico completo',
        estimatedHours: 8.0,
        laborCost: 400000,
        partsCost: 350000,
        totalAmount: 750000,
        mechanicCommission: 93750, // 12.5% de 750000
        notes: 'Reemplazo alternador y cableado principal',
        createdBy: adminUser.id,
        completedAt: new Date(),
      },
    }),
  ]);

  // 9. Crear logs de estado
  console.log('📝 Creando logs de estado...');
  await Promise.all([
    prisma.statusLog.create({
      data: {
        serviceId: services[0].id,
        oldStatusId: workStatuses[0].id, // De: Recibido
        newStatusId: workStatuses[1].id, // A: En Diagnóstico
        changedBy: adminUser.id,
        notes: 'Servicio iniciado, asignado a mecánico',
      },
    }),
    prisma.statusLog.create({
      data: {
        serviceId: services[1].id,
        oldStatusId: workStatuses[3].id, // De: En Reparación
        newStatusId: workStatuses[5].id, // A: Listo para Entrega
        changedBy: mechanicUser.id,
        notes: 'Reparación completada, control de calidad aprobado',
      },
    }),
  ]);

  // 10. Crear oportunidades
  console.log('💼 Creando oportunidades...');
  await Promise.all([
    prisma.opportunity.create({
      data: {
        clientId: clients[0].id,
        vehicleId: vehicles[0].id,
        type: 'mantenimiento',
        description: 'Mantenimiento de 50,000 km - incluye correas y bujías',
        estimatedValue: 450000,
        probability: 80,
        status: 'interested',
        followUpDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        notes: 'Cliente muy interesado, revisar disponibilidad la próxima semana',
        createdBy: receptionistUser.id,
      },
    }),
    prisma.opportunity.create({
      data: {
        clientId: clients[1].id,
        vehicleId: vehicles[1].id,
        type: 'reparacion',
        description: 'Reparación caja de cambios',
        estimatedValue: 1200000,
        probability: 60,
        status: 'contacted',
        followUpDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
        notes: 'Pendiente cotización detallada, cliente evaluando opciones',
        createdBy: adminUser.id,
      },
    }),
  ]);

  console.log('✅ Seed completado exitosamente!');
  console.log('');
  console.log('📋 Credenciales de prueba creadas:');
  console.log('👑 Administrador:');
  console.log('   Email: admin@henry.com');
  console.log('   Password: admin123');
  console.log('');
  console.log('🔧 Mecánico:');
  console.log('   Email: mecanico@henry.com');
  console.log('   Password: mecanico123');
  console.log('');
  console.log('📞 Recepcionista:');
  console.log('   Email: recepcion@henry.com');
  console.log('   Password: recepcion123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });