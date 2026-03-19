import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  subDays,
  subWeeks,
  subMonths,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from 'date-fns';

type ReportPeriod = 'day' | 'week' | 'month';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizePeriod(period?: string): ReportPeriod {
    if (period === 'week' || period === 'month') {
      return period;
    }
    return 'day';
  }

  private resolveCurrentPeriodRange(period: ReportPeriod) {
    const now = new Date();
    if (period === 'week') {
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    }

    if (period === 'month') {
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    }

    return {
      start: startOfDay(now),
      end: endOfDay(now),
    };
  }

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

  async getSalesByPeriod(period?: string, points?: number) {
    const normalizedPeriod = this.normalizePeriod(period);

    const defaultPointsByPeriod: Record<ReportPeriod, number> = {
      day: 7,
      week: 8,
      month: 6,
    };

    const maxPoints = 24;
    const selectedPoints = Math.min(
      Math.max(points || defaultPointsByPeriod[normalizedPeriod], 1),
      maxPoints,
    );

    const result: { label: string; total: number; salesCount: number }[] = [];

    for (let i = selectedPoints - 1; i >= 0; i--) {
      let start: Date;
      let end: Date;
      let label: string;

      if (normalizedPeriod === 'week') {
        const weekDate = subWeeks(new Date(), i);
        start = startOfWeek(weekDate, { weekStartsOn: 1 });
        end = endOfWeek(weekDate, { weekStartsOn: 1 });
        label = format(start, "dd MMM");
      } else if (normalizedPeriod === 'month') {
        const monthDate = subMonths(new Date(), i);
        start = startOfMonth(monthDate);
        end = endOfMonth(monthDate);
        label = format(start, 'MMM yyyy');
      } else {
        const dayDate = subDays(new Date(), i);
        start = startOfDay(dayDate);
        end = endOfDay(dayDate);
        label = format(start, 'dd MMM');
      }

      const stats = await this.prisma.sale.aggregate({
        where: {
          fecha: { gte: start, lte: end },
          estado: 'COMPLETED',
        },
        _sum: { total: true },
        _count: { id: true },
      });

      result.push({
        label,
        total: Number(stats._sum.total || 0),
        salesCount: stats._count.id,
      });
    }

    return {
      period: normalizedPeriod,
      points: selectedPoints,
      data: result,
    };
  }

  async getTopProductsByPeriod(period?: string, limit = 5) {
    const normalizedPeriod = this.normalizePeriod(period);
    const { start, end } = this.resolveCurrentPeriodRange(normalizedPeriod);

    const topItems = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          fecha: { gte: start, lte: end },
          estado: 'COMPLETED',
        },
      },
      _sum: { cantidad: true, subtotal: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: limit,
    });

    const productIds = topItems.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, nombre: true },
    });

    const productById = new Map(products.map((p) => [p.id, p.nombre]));

    return {
      period: normalizedPeriod,
      range: {
        start: format(start, 'yyyy-MM-dd'),
        end: format(end, 'yyyy-MM-dd'),
      },
      items: topItems.map((item) => ({
        productId: item.productId,
        nombre: productById.get(item.productId) || 'Desconocido',
        cantidadVendida: item._sum.cantidad || 0,
        ingresosTotales: Number(item._sum.subtotal || 0),
      })),
    };
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
