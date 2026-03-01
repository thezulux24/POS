import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateSaleItemDto } from './dto/create-sale-item.dto';

const saleInclude = {
  vendedor: {
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
    },
  },
  cliente: {
    select: {
      id: true,
      nombre: true,
      telefono: true,
      email: true,
    },
  },
  saleItems: {
    include: {
      product: {
        select: {
          id: true,
          codigo: true,
          nombre: true,
        },
      },
    },
    orderBy: {
      id: 'asc' as const,
    },
  },
} satisfies Prisma.SaleInclude;

type SaleWithRelations = Prisma.SaleGetPayload<{ include: typeof saleInclude }>;

interface NormalizedSaleItem {
  productId: number;
  cantidad: number;
}

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(vendedorId: number, createSaleDto: CreateSaleDto) {
    const items = this.normalizeItems(createSaleDto.items);
    const clienteId = this.parseNullablePositiveInt(
      createSaleDto.clienteId,
      'clienteId',
    );

    if (clienteId !== null) {
      await this.ensureCustomerExists(clienteId);
    }

    const productIds = items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        activo: true,
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        precio: true,
        stock: true,
      },
    });

    if (products.length !== productIds.length) {
      const foundProductIds = new Set(products.map((product) => product.id));
      const missing = productIds.filter((id) => !foundProductIds.has(id));
      throw new NotFoundException(
        `Productos no encontrados o inactivos: ${missing.join(', ')}`,
      );
    }

    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );

    for (const item of items) {
      const product = productsById.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Producto ${item.productId} no encontrado`);
      }

      if (product.stock < item.cantidad) {
        throw new ConflictException(
          `Stock insuficiente para ${product.nombre}`,
        );
      }
    }

    const estado = createSaleDto.estado
      ? this.normalizeStatus(createSaleDto.estado)
      : undefined;

    const sale = await this.prisma.$transaction(async (tx) => {
      const saleItemsToCreate: Prisma.SaleItemUncheckedCreateWithoutSaleInput[] =
        [];
      let total = new Prisma.Decimal(0);

      for (const item of items) {
        const decremented = await tx.product.updateMany({
          where: {
            id: item.productId,
            activo: true,
            stock: { gte: item.cantidad },
          },
          data: {
            stock: {
              decrement: item.cantidad,
            },
          },
        });

        if (decremented.count === 0) {
          throw new ConflictException(
            'No fue posible descontar inventario por concurrencia',
          );
        }

        const product = productsById.get(item.productId);
        if (!product) {
          throw new NotFoundException(
            `Producto ${item.productId} no encontrado`,
          );
        }

        const precioUnitario = new Prisma.Decimal(product.precio);
        const subtotal = precioUnitario.mul(item.cantidad);
        total = total.plus(subtotal);

        saleItemsToCreate.push({
          productId: item.productId,
          cantidad: item.cantidad,
          precio_unitario: precioUnitario,
          subtotal,
        });
      }

      return tx.sale.create({
        data: {
          vendedorId,
          clienteId,
          total,
          ...(estado ? { estado } : {}),
          saleItems: {
            create: saleItemsToCreate,
          },
        },
        include: saleInclude,
      });
    });

    return {
      ...this.serializeSale(sale),
      ticketPreview: this.buildTicketText(sale),
    };
  }

  async findOne(id: number) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: saleInclude,
    });

    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    return this.serializeSale(sale);
  }

  async getTicket(id: number) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: saleInclude,
    });

    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    const printableText = this.buildTicketText(sale);

    return {
      sale: this.serializeSale(sale),
      printableText,
    };
  }

  async getDailyReport(
    user: AuthenticatedUser,
    date?: string,
    vendedorIdParam?: string,
  ) {
    const { start, end, label } = this.getDateRange(date);
    const requestedVendedorId = this.parseOptionalPositiveInt(
      vendedorIdParam,
      'vendedorId',
    );

    let vendedorIdFilter: number | undefined;

    if (user.rol === Role.ADMIN) {
      vendedorIdFilter = requestedVendedorId;
    } else {
      if (requestedVendedorId && requestedVendedorId !== user.id) {
        throw new ForbiddenException(
          'Solo puedes consultar reportes de tus propias ventas',
        );
      }

      vendedorIdFilter = user.id;
    }

    const sales = await this.prisma.sale.findMany({
      where: {
        fecha: {
          gte: start,
          lt: end,
        },
        ...(vendedorIdFilter ? { vendedorId: vendedorIdFilter } : {}),
      },
      include: {
        vendedor: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    });

    let total = new Prisma.Decimal(0);
    for (const sale of sales) {
      total = total.plus(sale.total);
    }

    return {
      date: label,
      vendedorId: vendedorIdFilter ?? null,
      totalSales: sales.length,
      totalAmount: total,
      sales: sales.map((sale) => ({
        id: sale.id,
        fecha: sale.fecha,
        total: sale.total,
        estado: sale.estado,
        vendedor: sale.vendedor,
        cliente: sale.cliente,
      })),
    };
  }

  async getReportVendors() {
    const vendors = await this.prisma.user.findMany({
      where: {
        activo: true,
        rol: Role.VENDEDOR,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return vendors;
  }

  private normalizeItems(items: CreateSaleItemDto[]): NormalizedSaleItem[] {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException(
        'La venta debe incluir al menos un producto',
      );
    }

    const grouped = new Map<number, number>();

    for (const item of items) {
      const productId = Number(item?.productId);
      const cantidad = Number(item?.cantidad);

      if (!Number.isInteger(productId) || productId < 1) {
        throw new BadRequestException('Cada item debe tener productId valido');
      }

      if (!Number.isInteger(cantidad) || cantidad < 1) {
        throw new BadRequestException(
          'Cada item debe tener cantidad mayor a 0',
        );
      }

      grouped.set(productId, (grouped.get(productId) ?? 0) + cantidad);
    }

    return Array.from(grouped.entries()).map(([productId, cantidad]) => ({
      productId,
      cantidad,
    }));
  }

  private parseNullablePositiveInt(
    value: number | null | undefined,
    field: string,
  ): number | null {
    if (value === undefined || value === null) {
      return null;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException(
        `El campo ${field} debe ser un entero positivo`,
      );
    }

    return parsed;
  }

  private async ensureCustomerExists(customerId: number): Promise<void> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        activo: true,
      },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado o inactivo');
    }
  }

  private normalizeStatus(status: string): string {
    if (typeof status !== 'string' || !status.trim()) {
      throw new BadRequestException('El estado de la venta no es valido');
    }

    const normalized = status.trim().toUpperCase();

    if (normalized.length > 40) {
      throw new BadRequestException('El estado no puede superar 40 caracteres');
    }

    return normalized;
  }

  private serializeSale(sale: SaleWithRelations) {
    return {
      id: sale.id,
      fecha: sale.fecha,
      estado: sale.estado,
      total: sale.total,
      vendedor: sale.vendedor,
      cliente: sale.cliente,
      items: sale.saleItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        codigo: item.product.codigo,
        nombre: item.product.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
      })),
    };
  }

  private buildTicketText(sale: SaleWithRelations): string {
    const lines: string[] = [];

    lines.push('POS - TIQUETE DE VENTA');
    lines.push(`Venta #${sale.id}`);
    lines.push(`Fecha: ${this.formatDate(sale.fecha)}`);
    lines.push(`Vendedor: ${sale.vendedor.nombre}`);
    lines.push(`Cliente: ${sale.cliente?.nombre ?? 'Consumidor final'}`);
    lines.push('----------------------------------------');

    for (const item of sale.saleItems) {
      lines.push(`${item.cantidad} x ${item.product.nombre}`);
      lines.push(
        `  ${this.formatMoney(item.precio_unitario)} c/u  =  ${this.formatMoney(item.subtotal)}`,
      );
    }

    lines.push('----------------------------------------');
    lines.push(`TOTAL: ${this.formatMoney(sale.total)}`);

    return lines.join('\n');
  }

  private formatMoney(value: Prisma.Decimal | number | string): string {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
      return '$0.00';
    }

    return `$${numberValue.toFixed(2)}`;
  }

  private formatDate(value: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(value);
  }

  private parseOptionalPositiveInt(
    value: string | undefined,
    field: string,
  ): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const parsed = Number(trimmed);

    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException(
        `El campo ${field} debe ser un entero positivo`,
      );
    }

    return parsed;
  }

  private getDateRange(date?: string): {
    start: Date;
    end: Date;
    label: string;
  } {
    if (!date) {
      const now = new Date();
      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0,
      );
      const end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        0,
      );

      return {
        start,
        end,
        label: start.toISOString().slice(0, 10),
      };
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new BadRequestException('La fecha debe tener formato YYYY-MM-DD');
    }

    const [year, month, day] = date.split('-').map(Number);
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);

    if (
      Number.isNaN(start.getTime()) ||
      start.getFullYear() !== year ||
      start.getMonth() !== month - 1 ||
      start.getDate() !== day
    ) {
      throw new BadRequestException('La fecha no es valida');
    }

    const end = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

    return {
      start,
      end,
      label: date,
    };
  }
}
