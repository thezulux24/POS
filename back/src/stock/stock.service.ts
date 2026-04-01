import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async adjust(dto: CreateAdjustmentDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const newStock = product.stock + dto.cantidad;
    if (newStock < 0) {
      throw new BadRequestException('El ajuste resultaría en stock negativo');
    }

    // Use a transaction to update stock and record movement
    return this.prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: dto.productId },
        data: { stock: newStock },
      });

      await tx.stockMovement.create({
        data: {
          productId: dto.productId,
          cantidad: dto.cantidad,
          tipo: 'AJUSTE',
          motivo: dto.motivo || 'Ajuste manual',
        },
      });

      return updatedProduct;
    });
  }

  async getMovements(productId?: number) {
    return this.prisma.stockMovement.findMany({
      where: productId ? { productId } : {},
      include: {
        product: {
          select: { nombre: true, codigo: true },
        },
      },
      orderBy: { fecha: 'desc' },
      take: 100,
    });
  }
}
