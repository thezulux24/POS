import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalProducts, activeUsers, lowStock] = await Promise.all([
      this.prisma.product.count({ where: { activo: true } }),
      this.prisma.user.count({ where: { activo: true } }),
      this.prisma.product.count({
        where: {
          activo: true,
          stock: { lte: this.prisma.product.fields.min_stock as any },
        },
      }),
    ]);

    // Total sales today
    const today = new Date();
    const salesToday = await this.prisma.sale.aggregate({
      where: {
        fecha: { gte: startOfDay(today), lte: endOfDay(today) },
        estado: 'COMPLETED',
      },
      _sum: { total: true },
      _count: { id: true },
    });

    // New customers in last 30 days
    const thirtyDaysAgo = subDays(new Date(), 30);
    const newCustomers = await this.prisma.customer.count({
      where: {
        activo: true,
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // More reliable low stock query
    const allProducts = await this.prisma.product.findMany({
      where: { activo: true },
      select: { id: true, stock: true, min_stock: true, nombre: true, codigo: true }
    });
    
    const lowStockItems = allProducts.filter(p => p.stock <= p.min_stock);

    return {
      totalProductos: totalProducts,
      vendorsCount: activeUsers,
      productosBajoStockCount: lowStockItems.length,
      productosBajoStock: lowStockItems.slice(0, 5).map(p => ({
        id: p.id,
        nombre: p.nombre,
        codigo: p.codigo,
        stock: p.stock,
        stockMinimo: p.min_stock
      })),
      totalVentasHoy: Number(salesToday._sum.total || 0),
      conteoVentasHoy: salesToday._count.id,
      nuevosClientesMes: newCustomers,
    };
  }

  async getSalesOverTime(days = 7) {
    const results: { date: string; total: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const start = startOfDay(date);
      const end = endOfDay(date);

      const stats = await this.prisma.sale.aggregate({
        where: {
          fecha: { gte: start, lte: end },
          estado: 'COMPLETED',
        },
        _sum: { total: true },
      });

      results.push({
        date: format(date, 'yyyy-MM-dd'),
        total: Number(stats._sum.total || 0),
      });
    }
    return results;
  }

  async getTopProducts(limit = 5) {
    const topItems = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { cantidad: true, subtotal: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: limit,
    });

    const products = await Promise.all(
      topItems.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: { nombre: true },
        });
        return {
          nombre: product?.nombre || 'Desconocido',
          cantidadVendida: item._sum.cantidad || 0,
          ingresosTotales: Number(item._sum.subtotal || 0),
        };
      }),
    );

    return products;
  }

  async getDetailedReport(startDate: string, endDate: string) {
    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));

    const sales = await this.prisma.sale.findMany({
      where: {
        fecha: { gte: start, lte: end },
        estado: 'COMPLETED',
      },
      include: {
        vendedor: { select: { nombre: true } },
        cliente: { select: { nombre: true } },
      },
      orderBy: { fecha: 'desc' },
    });

    return sales.map(sale => ({
      id: sale.id,
      date: format(sale.fecha, 'yyyy-MM-dd HH:mm'),
      vendedor: sale.vendedor.nombre,
      cliente: sale.cliente?.nombre || 'S/C',
      total: Number(sale.total),
    }));
  }
}
