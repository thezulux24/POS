import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

interface CategoryFilters {
  includeInactive?: boolean;
  search?: string;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const nombre = this.validateName(createCategoryDto.nombre);

    return this.prisma.category.create({
      data: {
        nombre,
        activo: createCategoryDto.activo ?? true,
      },
    });
  }

  async findAll(filters: CategoryFilters) {
    const where: {
      activo?: boolean;
      nombre?: { contains: string; mode: 'insensitive' };
    } = {};

    if (!filters.includeInactive) {
      where.activo = true;
    }

    if (filters.search && filters.search.trim()) {
      where.nombre = {
        contains: filters.search.trim(),
        mode: 'insensitive',
      };
    }

    return this.prisma.category.findMany({
      where,
      include: {
        _count: {
          select: {
            products: {
              where: {
                activo: true,
              },
            },
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Categoria no encontrada');
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.ensureExists(id);

    const data: UpdateCategoryDto = {};

    if (updateCategoryDto.nombre !== undefined) {
      data.nombre = this.validateName(updateCategoryDto.nombre);
    }

    if (updateCategoryDto.activo !== undefined) {
      if (typeof updateCategoryDto.activo !== 'boolean') {
        throw new BadRequestException('El campo activo debe ser booleano');
      }
      data.activo = updateCategoryDto.activo;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No hay campos validos para actualizar');
    }

    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.ensureExists(id);

    return this.prisma.category.update({
      where: { id },
      data: {
        activo: false,
      },
    });
  }

  private validateName(value: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException('El nombre es obligatorio');
    }

    const normalized = value.trim();

    if (normalized.length < 2 || normalized.length > 80) {
      throw new BadRequestException(
        'El nombre debe tener entre 2 y 80 caracteres',
      );
    }

    return normalized;
  }

  private async ensureExists(id: number): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Categoria no encontrada');
    }
  }
}
