import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: dto,
    });
  }

  async findAll(includeInactive = false) {
    return this.prisma.supplier.findMany({
      where: includeInactive ? {} : { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    return supplier;
  }

  async update(id: number, dto: UpdateSupplierDto) {
    await this.findOne(id);
    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    return this.update(id, { activo: false });
  }
}
