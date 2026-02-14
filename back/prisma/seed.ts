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
