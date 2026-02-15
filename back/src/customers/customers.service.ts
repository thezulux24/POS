import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

interface CustomerFilters {
  search?: string;
  includeInactive?: boolean;
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const nombre = this.validateName(createCustomerDto.nombre);

    return this.prisma.customer.create({
      data: {
        nombre,
        telefono: this.normalizePhone(createCustomerDto.telefono),
        email: this.normalizeEmail(createCustomerDto.email),
        activo: createCustomerDto.activo ?? true,
      },
    });
  }

  async findAll(filters: CustomerFilters) {
    const where: Prisma.CustomerWhereInput = {};

    if (!filters.includeInactive) {
      where.activo = true;
    }

    if (filters.search && filters.search.trim()) {
      const search = filters.search.trim();
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.customer.findMany({
      where,
      orderBy: [{ nombre: 'asc' }],
    });
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    await this.ensureExists(id);

    const data: Prisma.CustomerUpdateInput = {};

    if (updateCustomerDto.nombre !== undefined) {
      data.nombre = this.validateName(updateCustomerDto.nombre);
    }

    if (updateCustomerDto.telefono !== undefined) {
      data.telefono = this.normalizePhone(
        updateCustomerDto.telefono ?? undefined,
      );
    }

    if (updateCustomerDto.email !== undefined) {
      data.email = this.normalizeEmail(updateCustomerDto.email ?? undefined);
    }

    if (updateCustomerDto.activo !== undefined) {
      if (typeof updateCustomerDto.activo !== 'boolean') {
        throw new BadRequestException('El campo activo debe ser booleano');
      }
      data.activo = updateCustomerDto.activo;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No hay campos validos para actualizar');
    }

    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.ensureExists(id);

    return this.prisma.customer.update({
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

    if (normalized.length < 2 || normalized.length > 120) {
      throw new BadRequestException(
        'El nombre debe tener entre 2 y 120 caracteres',
      );
    }

    return normalized;
  }

  private normalizePhone(value?: string | null): string | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('El telefono debe ser texto');
    }

    const normalized = value.trim();

    if (normalized.length > 30) {
      throw new BadRequestException(
        'El telefono no puede superar 30 caracteres',
      );
    }

    return normalized;
  }

  private normalizeEmail(value?: string | null): string | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('El email debe ser texto');
    }

    const normalized = value.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalized)) {
      throw new BadRequestException('Formato de email invalido');
    }

    return normalized;
  }

  private async ensureExists(id: number): Promise<void> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }
  }
}
