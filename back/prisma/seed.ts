import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting comprehensive seed...');

  // 0. Clear existing data (respecting foreign keys)
  console.log('🧹 Clearing old data...');
  const p = prisma as any;
  await p.userRole.deleteMany();
  await p.role.deleteMany();
  await prisma.saleItem.deleteMany();
  await p.saleAdjustment.deleteMany();
  await prisma.sale.deleteMany();
  await p.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await p.supplier.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const saltRounds = 10;
  const commonPassword = 'test123';
  const hashedPassword = await bcrypt.hash(commonPassword, saltRounds);

  // 1. Seed Roles
  console.log('👥 Seeding Roles...');
  const roleAdmin = await p.role.create({
    data: { nombre: 'ADMIN' },
  });
  const roleVendedor = await p.role.create({
    data: { nombre: 'VENDEDOR' },
  });

  // 2. Seed Users
  console.log('👤 Seeding Users...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@pos.com',
      nombre: 'Administrador Principal',
      password_hash: hashedPassword,
      activo: true,
      roles: { create: { roleId: roleAdmin.id } } as any,
    },
  });

  const vendedor = await prisma.user.create({
    data: {
      email: 'vendedor@pos.com',
      nombre: 'Sebastián Vendedor',
      password_hash: hashedPassword,
      activo: true,
      roles: { create: { roleId: roleVendedor.id } } as any,
    },
  });

  // 3. Seed Categories
  console.log('📦 Seeding Categories...');
  const catElectronica = await prisma.category.create({ data: { nombre: 'Electrónica', activo: true } });
  const catAlimentos = await prisma.category.create({ data: { nombre: 'Alimentos', activo: true } });
  const catHogar = await prisma.category.create({ data: { nombre: 'Hogar', activo: true } });
  const catAccesorios = await prisma.category.create({ data: { nombre: 'Accesorios', activo: true } });
  
  const categories = [catElectronica, catAlimentos, catHogar, catAccesorios];

  // 4. Seed Suppliers (With Contaco)
  console.log('🏭 Seeding Suppliers...');
  const s1 = await p.supplier.create({
    data: {
      nombre: 'Sony Colombia',
      contacto: 'David Giraldo',
      telefono: '3001234567',
      email: 'david@sony.co',
      direccion: 'Av. Siempre Viva 123',
      activo: true,
    }
  });
  const s2 = await p.supplier.create({
    data: {
      nombre: 'Distribuciones Axion',
      contacto: 'Isabela Reyes',
      telefono: '3124567890',
      email: 'isabela@axion.com.co',
      direccion: 'Calle 45 # 23-11',
      activo: true,
    }
  });
  const s3 = await p.supplier.create({
    data: {
      nombre: 'Global Tech SAS',
      contacto: 'Brayan Zuluaga',
      telefono: '3200001122',
      email: 'brayan@globaltech.com',
      direccion: 'Centro Empresarial Norte',
      activo: true,
    }
  });
  
  const suppliers = [s1, s2, s3];

  // 5. Seed Products
  console.log('🍎 Seeding Products...');
  const productData = [
    { codigo: 'AUD-001', nombre: 'Audífonos Bluetooth Pro', precio: new Prisma.Decimal(150000), stock: 45, min_stock: 10, categoryId: s1.id, supplierId: s1.id },
    { codigo: 'TV-4K-50', nombre: 'Televisor Smart 4K 50"', precio: new Prisma.Decimal(1850000), stock: 8, min_stock: 3, categoryId: s1.id, supplierId: s1.id },
    { codigo: 'MOU-88', nombre: 'Mouse Gamer RGB', precio: new Prisma.Decimal(85000), stock: 25, min_stock: 5, categoryId: s3.id, supplierId: s3.id },
    { codigo: 'KEY-MECH', nombre: 'Teclado Mecánico', precio: new Prisma.Decimal(220000), stock: 12, min_stock: 4, categoryId: s3.id, supplierId: s3.id },
    { codigo: 'CAF-200', nombre: 'Café Premium 500g', precio: new Prisma.Decimal(32000), stock: 60, min_stock: 15, categoryId: s2.id, supplierId: s2.id },
    { codigo: 'CHO-DARK', nombre: 'Chocolate Amargo 80%', precio: new Prisma.Decimal(12500), stock: 100, min_stock: 20, categoryId: s2.id, supplierId: s2.id },
    { codigo: 'LMP-DESK', nombre: 'Lámpara Escritorio LED', precio: new Prisma.Decimal(55000), stock: 15, min_stock: 5, categoryId: s3.id, supplierId: s3.id },
  ];

  // Fix category IDs (they were mapped wrong in previous draft)
  productData[0].categoryId = categories[0].id;
  productData[1].categoryId = categories[0].id;
  productData[2].categoryId = categories[3].id;
  productData[3].categoryId = categories[3].id;
  productData[4].categoryId = categories[1].id;
  productData[5].categoryId = categories[1].id;
  productData[6].categoryId = categories[2].id;

  // Fix supplier IDs
  productData[0].supplierId = suppliers[0].id;
  productData[1].supplierId = suppliers[0].id;
  productData[2].supplierId = suppliers[2].id;
  productData[3].supplierId = suppliers[2].id;
  productData[4].supplierId = suppliers[1].id;
  productData[5].supplierId = suppliers[1].id;
  productData[6].supplierId = suppliers[2].id;

  const products: any[] = [];
  for (const item of productData) {
    const prod = await prisma.product.create({ data: item });
    products.push(prod);
  }

  // 6. Seed Customers
  console.log('🤝 Seeding Customers...');
  const c1 = await prisma.customer.create({
    data: { documento: '1061700111', nombre: 'Juan Esteban Pérez', email: 'juan.perez@email.com', telefono: '3151112233' }
  });
  const c2 = await prisma.customer.create({
    data: { documento: '94321000', nombre: 'Maria Paula Torres', email: 'maria.torres@example.com', telefono: '3167778899' }
  });
  const c3 = await prisma.customer.create({
    data: { documento: '111222333', nombre: 'Carlos Mario Ruiz', email: 'carlos.ruiz@puj.edu.co', telefono: '3004445566' }
  });
  const c4 = await prisma.customer.create({
    data: { documento: '555666777', nombre: 'Elena Vasquez', email: 'elena.v@outlook.com', telefono: '3112223344' }
  });
  
  const customers = [c1, c2, c3, c4];

  // 7. Seed Sales (Realistic mixed dates)
  console.log('💰 Seeding Sales and Items...');
  const today = new Date();
  
  // Historical sales (last 7 days)
  for (let d = 1; d <= 7; d++) {
    const saleDate = subDays(today, d);
    const numSales = 2;
    
    for (let s = 0; s < numSales; s++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const product = products[Math.floor(Math.random() * products.length)];
      const cantidad = 1;
      const total = Number(product.precio) * cantidad;

      await prisma.sale.create({
        data: {
          vendedorId: vendedor.id,
          clienteId: customer.id,
          total: new Prisma.Decimal(total),
          fecha: saleDate,
          estado: 'COMPLETED',
          saleItems: {
            create: [{
              productId: product.id,
              cantidad,
              precio_unitario: product.precio,
              subtotal: new Prisma.Decimal(total)
            }]
          }
        }
      });
    }
  }

  // Today's sales
  console.log('📅 Seeding Today\'s Sales...');
  for (let s = 0; s < 3; s++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const cantidad = 1;
    const total = Number(product.precio) * cantidad;

    await prisma.sale.create({
      data: {
        vendedorId: admin.id,
        clienteId: customer.id,
        total: new Prisma.Decimal(total),
        fecha: today,
        estado: 'COMPLETED',
        saleItems: {
          create: [{
            productId: product.id,
            cantidad,
            precio_unitario: product.precio,
            subtotal: new Prisma.Decimal(total)
          }]
        }
      }
    });
  }

  console.log('✅ Comprehensive Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
