import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 0. Clear existing data (respecting foreign keys)
  await (prisma as any).userRole.deleteMany();
  await (prisma as any).role.deleteMany();
  await prisma.saleItem.deleteMany();
  await (prisma as any).saleAdjustment.deleteMany();
  await prisma.sale.deleteMany();
  await (prisma as any).stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await (prisma as any).supplier.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const saltRounds = 10;
  const commonPassword = 'test123';
  const hashedPassword = await bcrypt.hash(commonPassword, saltRounds);

  // 1. Seed Roles
  console.log('Seeding Roles...');
  const roleAdmin = await (prisma as any).role.create({
    data: { nombre: 'ADMIN' },
  });
  const roleVendedor = await (prisma as any).role.create({
    data: { nombre: 'VENDEDOR' },
  });

  // 2. Seed Users
  console.log('Seeding Users...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@pos.com',
      nombre: 'Administrador Principal',
      password_hash: hashedPassword,
      activo: true,
      roles: {
        create: { roleId: roleAdmin.id },
      },
    },
  });

  const vendedor = await prisma.user.create({
    data: {
      email: 'vendedor@pos.com',
      nombre: 'Vendedor Demo',
      password_hash: hashedPassword,
      activo: true,
      roles: {
        create: { roleId: roleVendedor.id },
      },
    },
  });

  // 3. Seed Categories
  console.log('Seeding Categories...');
  const catElectronica = await prisma.category.create({
    data: { nombre: 'Electrónica', activo: true },
  });
  const catAlimentos = await prisma.category.create({
    data: { nombre: 'Alimentos', activo: true },
  });

  // 4. Seed Suppliers
  console.log('Seeding Suppliers...');
  const provSony = await (prisma as any).supplier.create({
    data: {
      nombre: 'Sony Colombia',
      telefono: '3001234567',
      email: 'contacto@sony.co',
      direccion: 'Bogotá, Colombia',
      activo: true,
    },
  });
  const provNestle = await (prisma as any).supplier.create({
    data: {
      nombre: 'Nestlé S.A.',
      telefono: '3109876543',
      email: 'ventas@nestle.com',
      direccion: 'Cali, Colombia',
      activo: true,
    },
  });

  // 5. Seed Products
  console.log('Seeding Products...');
  const productsData = [
    {
      codigo: 'PROD-001',
      nombre: 'Audífonos Bluetooth',
      precio: 150000.00,
      stock: 50,
      categoryId: catElectronica.id,
      supplierId: provSony.id,
      min_stock: 5,
      activo: true,
    },
    {
      codigo: 'PROD-002',
      nombre: 'Televisor 4K 50"',
      precio: 1800000.00,
      stock: 10,
      categoryId: catElectronica.id,
      supplierId: provSony.id,
      min_stock: 2,
      activo: true,
    },
    {
      codigo: 'PROD-003',
      nombre: 'Caja de Chocolates',
      precio: 25000.00,
      stock: 100,
      categoryId: catAlimentos.id,
      supplierId: provNestle.id,
      min_stock: 10,
      activo: true,
    },
    {
      codigo: 'PROD-004',
      nombre: 'Café Instantáneo 200g',
      precio: 18000.00,
      stock: 200,
      categoryId: catAlimentos.id,
      supplierId: provNestle.id,
      min_stock: 20,
      activo: true,
    },
  ];

  for (const prod of productsData) {
    await prisma.product.create({
      data: prod,
    });
  }

  // 6. Seed Customers
  console.log('Seeding Customers...');
  await prisma.customer.create({
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
