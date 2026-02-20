import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

export interface ProductFilters {
  search?: string;
  categoryId?: number;
  includeInactive?: boolean;
  onlyWithStock?: boolean;
}

export interface ProviderFilters {
  search?: string;
  includeInactive?: boolean;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const codigo = this.validateCode(createProductDto.codigo);
    const nombre = this.validateName(createProductDto.nombre);
    const precio = this.parsePrice(createProductDto.precio);
    const stock = this.parseStock(createProductDto.stock ?? 0);
    const categoryId = this.parsePositiveInt(
      createProductDto.categoryId,
      'categoryId',
    );
    const providerId = this.parseNullablePositiveInt(
      createProductDto.providerId,
      'providerId',
    );

    if (
      createProductDto.activo !== undefined &&
      typeof createProductDto.activo !== 'boolean'
    ) {
      throw new BadRequestException('El campo activo debe ser booleano');
    }

    await this.ensureCategoryExists(categoryId);
    if (providerId !== null) {
      await this.ensureProviderExists(providerId);
    }

    try {
      return await this.prisma.product.create({
        data: {
          codigo,
          nombre,
          precio,
          stock,
          categoryId,
          providerId,
          activo: createProductDto.activo ?? true,
        },
        include: {
          category: true,
          provider: true,
        },
      });
    } catch (error) {
      this.handleProductWriteError(error);
    }
  }

  async findAll(filters: ProductFilters) {
    const where: Prisma.ProductWhereInput = {};

    if (!filters.includeInactive) {
      where.activo = true;
    }

    if (filters.categoryId !== undefined) {
      where.categoryId = filters.categoryId;
    }

    if (filters.onlyWithStock) {
      where.stock = { gt: 0 };
    }

    if (filters.search && filters.search.trim()) {
      const search = filters.search.trim();
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nombre: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.product.findMany({
      where,
      include: {
        category: true,
        provider: true,
      },
      orderBy: [{ nombre: 'asc' }],
    });
  }

  async search(query?: string, limit = 20) {
    if (!query || !query.trim()) {
      throw new BadRequestException('El parametro q es obligatorio');
    }

    const normalizedQuery = query.trim();
    const take = Math.min(Math.max(limit, 1), 50);

    return this.prisma.product.findMany({
      where: {
        activo: true,
        stock: { gt: 0 },
        OR: [
          { codigo: { contains: normalizedQuery, mode: 'insensitive' } },
          { nombre: { contains: normalizedQuery, mode: 'insensitive' } },
        ],
      },
      include: {
        category: true,
      },
      orderBy: [{ stock: 'desc' }, { nombre: 'asc' }],
      take,
    });
  }

  async findProviders(filters: ProviderFilters) {
    const where: Prisma.ProviderWhereInput = {};

    if (!filters.includeInactive) {
      where.activo = true;
    }

    if (filters.search && filters.search.trim()) {
      where.nombre = {
        contains: filters.search.trim(),
        mode: 'insensitive',
      };
    }

    return this.prisma.provider.findMany({
      where,
      select: {
        id: true,
        nombre: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        provider: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    await this.ensureExists(id);

    const data: Prisma.ProductUpdateInput = {};

    if (updateProductDto.codigo !== undefined) {
      data.codigo = this.validateCode(updateProductDto.codigo);
    }

    if (updateProductDto.nombre !== undefined) {
      data.nombre = this.validateName(updateProductDto.nombre);
    }

    if (updateProductDto.precio !== undefined) {
      data.precio = this.parsePrice(updateProductDto.precio);
    }

    if (updateProductDto.stock !== undefined) {
      data.stock = this.parseStock(updateProductDto.stock);
    }

    if (updateProductDto.categoryId !== undefined) {
      const categoryId = this.parsePositiveInt(
        updateProductDto.categoryId,
        'categoryId',
      );
      await this.ensureCategoryExists(categoryId);
      data.category = {
        connect: { id: categoryId },
      };
    }

    if (updateProductDto.providerId !== undefined) {
      const providerId = this.parseNullablePositiveInt(
        updateProductDto.providerId,
        'providerId',
      );
      if (providerId === null) {
        data.provider = {
          disconnect: true,
        };
      } else {
        await this.ensureProviderExists(providerId);
        data.provider = {
          connect: { id: providerId },
        };
      }
    }

    if (updateProductDto.activo !== undefined) {
      if (typeof updateProductDto.activo !== 'boolean') {
        throw new BadRequestException('El campo activo debe ser booleano');
      }
      data.activo = updateProductDto.activo;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No hay campos validos para actualizar');
    }

    try {
      return await this.prisma.product.update({
        where: { id },
        data,
        include: {
          category: true,
          provider: true,
        },
      });
    } catch (error) {
      this.handleProductWriteError(error);
    }
  }

  async remove(id: number) {
    await this.ensureExists(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        activo: false,
      },
    });
  }

  private validateCode(value: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException('El codigo es obligatorio');
    }

    const normalized = value.trim();
    if (normalized.length < 2 || normalized.length > 40) {
      throw new BadRequestException(
        'El codigo debe tener entre 2 y 40 caracteres',
      );
    }

    return normalized;
  }

  private validateName(value: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException('El nombre es obligatorio');
    }

    const normalized = value.trim();
    if (normalized.length < 2 || normalized.length > 120) {
      throw new BadRequestException(
        'El nombre debe tener entre 2 y 120 caracteres',
      );
    }

    return normalized;
  }

  private parsePrice(value: number | string): Prisma.Decimal {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      throw new BadRequestException('El precio debe ser un numero mayor a 0');
    }

    return new Prisma.Decimal(numericValue.toFixed(2));
  }

  private parseStock(value: number): number {
    if (!Number.isInteger(value) || value < 0) {
      throw new BadRequestException(
        'El stock debe ser un entero mayor o igual a 0',
      );
    }

    return value;
  }

  private parsePositiveInt(value: number, field: string): number {
    if (!Number.isInteger(value) || value < 1) {
      throw new BadRequestException(
        `El campo ${field} debe ser un entero positivo`,
      );
    }

    return value;
  }

  private parseNullablePositiveInt(
    value: number | null | undefined,
    field: string,
  ): number | null {
    if (value === undefined || value === null) {
      return null;
    }

    return this.parsePositiveInt(value, field);
  }

  private async ensureCategoryExists(categoryId: number): Promise<void> {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, activo: true },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Categoria no encontrada o inactiva');
    }
  }

  private async ensureProviderExists(providerId: number): Promise<void> {
    const provider = await this.prisma.provider.findFirst({
      where: { id: providerId, activo: true },
      select: { id: true },
    });

    if (!provider) {
      throw new NotFoundException('Proveedor no encontrado o inactivo');
    }
  }

  private async ensureExists(id: number): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  private handleProductWriteError(error: unknown): never {
    const errorCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: string }).code)
        : undefined;

    if (errorCode === 'P2002') {
      throw new ConflictException('Ya existe un producto con ese codigo');
    }

    if (errorCode === 'P2003') {
      throw new BadRequestException(
        'Relacion invalida en categoria o proveedor',
      );
    }

    throw error;
  }
}
