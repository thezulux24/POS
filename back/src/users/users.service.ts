import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('El correo electronico ya esta registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Verify roles exist or create them (standardizing)
    const roles = dto.roles || [];
    const roleEntities = await Promise.all(
      roles.map(async (roleName) => {
        const name = roleName.toUpperCase();
        let role = await this.prisma.role.findUnique({ where: { nombre: name } });
        if (!role) {
          role = await this.prisma.role.create({ data: { nombre: name } });
        }
        return role;
      }),
    );

    const user = await this.prisma.user.create({
      data: {
        nombre: dto.nombre,
        email: dto.email,
        password_hash: hashedPassword,
        activo: dto.activo ?? true,
        roles: {
          create: roleEntities.map((role) => ({
            role: { connect: { id: role.id } },
          })),
        },
      },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    return this.sanitizeUser(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: {
        roles: {
          include: { role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => this.sanitizeUser(u));
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.sanitizeUser(user);
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const data: any = {};
    if (dto.nombre) data.nombre = dto.nombre;
    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (existing) throw new ConflictException('El correo ya esta en uso');
      data.email = dto.email;
    }
    if (dto.password) {
      data.password_hash = await bcrypt.hash(dto.password, 10);
    }
    if (dto.activo !== undefined) {
      data.activo = dto.activo;
    }

    if (dto.roles) {
      // Logic to update roles: delete old ones, connect new ones
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      
      const roleEntities = await Promise.all(
        dto.roles.map(async (roleName) => {
          const name = roleName.toUpperCase();
          let role = await this.prisma.role.findUnique({ where: { nombre: name } });
          if (!role) {
            role = await this.prisma.role.create({ data: { nombre: name } });
          }
          return role;
        }),
      );

      data.roles = {
        create: roleEntities.map((role) => ({
          role: { connect: { id: role.id } },
        })),
      };
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    return this.sanitizeUser(updated);
  }

  async remove(id: number) {
    // Soft delete
    return this.update(id, { activo: false });
  }

  private sanitizeUser(user: any) {
    const { password_hash, ...rest } = user;
    return {
      ...rest,
      roles: user.roles.map((ur: any) => ur.role.nombre),
    };
  }
}
