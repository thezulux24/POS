import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing data (optional but recommended for clean seeds)
  // Ordered to respect foreign keys
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  // Users are handled via upsert

  const saltRounds = 10;
  const commonPassword = 'test123';
  const hashedPassword = await bcrypt.hash(commonPassword, saltRounds);

  // 1. Create Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pos.com' },
    update: {
      password_hash: hashedPassword,
    },
    create: {
      email: 'admin@pos.com',
      nombre: 'Administrador Principal',
      password_hash: hashedPassword,
      rol: Role.ADMIN,
      activo: true,
    },
  });

  const vendedor = await prisma.user.upsert({
    where: { email: 'vendedor@pos.com' },
    update: {
      password_hash: hashedPassword,
    },
    create: {
      email: 'vendedor@pos.com',
      nombre: 'Vendedor Demo',
      password_hash: hashedPassword,
      rol: Role.VENDEDOR,
      activo: true,
    },
  });

  console.log('Users seeded');

  // 2. Create Categories
  const catElectronica = await prisma.category.create({
    data: { nombre: 'Electrónica', activo: true },
  });

  const catAlimentos = await prisma.category.create({
    data: { nombre: 'Alimentos', activo: true },
  });

  console.log('Categories seeded');

  // 3. Create Providers
  const provSony = await prisma.provider.create({
    data: {
      nombre: 'Sony Colombia',
      telefono: '3001234567',
      email: 'contacto@sony.co',
      direccion: 'Bogotá, Colombia',
      activo: true,
    },
  });

  const provNestle = await prisma.provider.create({
    data: {
      nombre: 'Nestlé S.A.',
      telefono: '3109876543',
      email: 'ventas@nestle.com',
      direccion: 'Cali, Colombia',
      activo: true,
    },
  });

  console.log('Providers seeded');

  // 4. Create Products
  await prisma.product.createMany({
    data: [
      {
        codigo: 'PROD-001',
        nombre: 'Audífonos Bluetooth',
        precio: 150000.00,
        stock: 50,
        categoryId: catElectronica.id,
        providerId: provSony.id,
        activo: true,
      },
      {
        codigo: 'PROD-002',
        nombre: 'Televisor 4K 50"',
        precio: 1800000.00,
        stock: 10,
        categoryId: catElectronica.id,
        providerId: provSony.id,
        activo: true,
      },
      {
        codigo: 'PROD-003',
        nombre: 'Caja de Chocolates',
        precio: 25000.00,
        stock: 100,
        categoryId: catAlimentos.id,
        providerId: provNestle.id,
        activo: true,
      },
      {
        codigo: 'PROD-004',
        nombre: 'Café Instantáneo 200g',
        precio: 18000.00,
        stock: 200,
        categoryId: catAlimentos.id,
        providerId: provNestle.id,
        activo: true,
      },
      {
        codigo: 'PROD-005',
        nombre: 'Parlante Portátil',
        precio: 220000.00,
        stock: 32,
        categoryId: catElectronica.id,
        providerId: provSony.id,
        activo: true,
      },
      {
        codigo: 'PROD-006',
        nombre: 'Teclado Mecánico',
        precio: 270000.00,
        stock: 26,
        categoryId: catElectronica.id,
        providerId: provSony.id,
        activo: true,
      },
      {
        codigo: 'PROD-007',
        nombre: 'Mouse Inalámbrico',
        precio: 95000.00,
        stock: 48,
        categoryId: catElectronica.id,
        providerId: provSony.id,
        activo: true,
      },
      {
        codigo: 'PROD-008',
        nombre: 'Cargador USB-C 30W',
        precio: 68000.00,
        stock: 60,
        categoryId: catElectronica.id,
        providerId: provSony.id,
        activo: true,
      },
      {
        codigo: 'PROD-009',
        nombre: 'Memoria USB 64GB',
        precio: 42000.00,
        stock: 75,
        categoryId: catElectronica.id,
        providerId: provSony.id,
        activo: true,
      },
      {
        codigo: 'PROD-010',
        nombre: 'Cable HDMI 2m',
        precio: 28000.00,
        stock: 90,
        categoryId: catElectronica.id,
        providerId: provSony.id,
        activo: true,
      },
      {
        codigo: 'PROD-011',
        nombre: 'Barra de Sonido',
        precio: 640000.00,
        stock: 14,
        categoryId: catElectronica.id,
        providerId: provSony.id,
        activo: true,
      },
      {
        codigo: 'PROD-012',
        nombre: 'Smartwatch Deportivo',
        precio: 390000.00,
        stock: 21,
        categoryId: catElectronica.id,
        providerId: provSony.id,
        activo: true,
      },
      {
        codigo: 'PROD-013',
        nombre: 'Galletas de Avena',
        precio: 8200.00,
        stock: 130,
        categoryId: catAlimentos.id,
        providerId: provNestle.id,
        activo: true,
      },
      {
        codigo: 'PROD-014',
        nombre: 'Leche en Polvo 900g',
        precio: 31500.00,
        stock: 88,
        categoryId: catAlimentos.id,
        providerId: provNestle.id,
        activo: true,
      },
      {
        codigo: 'PROD-015',
        nombre: 'Cereal Integral 500g',
        precio: 16700.00,
        stock: 97,
        categoryId: catAlimentos.id,
        providerId: provNestle.id,
        activo: true,
      },
      {
        codigo: 'PROD-016',
        nombre: 'Yogurt Bebible Fresa',
        precio: 5400.00,
        stock: 140,
        categoryId: catAlimentos.id,
        providerId: provNestle.id,
        activo: true,
      },
      {
        codigo: 'PROD-017',
        nombre: 'Agua Mineral 600ml',
        precio: 3200.00,
        stock: 220,
        categoryId: catAlimentos.id,
        providerId: provNestle.id,
        activo: true,
      },
      {
        codigo: 'PROD-018',
        nombre: 'Atún en Lata 170g',
        precio: 9100.00,
        stock: 105,
        categoryId: catAlimentos.id,
        providerId: provNestle.id,
        activo: true,
      },
      {
        codigo: 'PROD-019',
        nombre: 'Pasta Spaghetti 500g',
        precio: 6300.00,
        stock: 160,
        categoryId: catAlimentos.id,
        providerId: provNestle.id,
        activo: true,
      },
      {
        codigo: 'PROD-020',
        nombre: 'Salsa de Tomate 400g',
        precio: 7600.00,
        stock: 112,
        categoryId: catAlimentos.id,
        providerId: provNestle.id,
        activo: true,
      },
    ],
  });

  console.log('Products seeded');

  // 5. Create a Customer
  const customer = await prisma.customer.create({
    data: {
      nombre: 'Juan Pérez',
      email: 'juan.perez@email.com',
      telefono: '3151112233',
      activo: true,
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
