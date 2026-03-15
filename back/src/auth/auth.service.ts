import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { SessionTokenService } from './session-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionTokenService: SessionTokenService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<AuthenticatedUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (user && user.activo) {
      const isMatch = await bcrypt.compare(pass, user.password_hash);
      if (isMatch) {
        const roleName = user.roles?.[0]?.role?.nombre || 'VENDEDOR';
        return {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: roleName,
        };
      }
    }

    return null;
  }

  async login(loginDto: LoginDto) {
    const email =
      typeof loginDto.email === 'string'
        ? loginDto.email.trim().toLowerCase()
        : '';
    const pass = typeof loginDto.pass === 'string' ? loginDto.pass : '';

    if (!email || !pass) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const user = await this.validateUser(email, pass);
    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const session = this.sessionTokenService.issueToken(user.id, user.rol);

    return {
      message: 'Inicio de sesion exitoso',
      session: {
        token: session.token,
        expiresAt: session.expiresAt,
      },
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    };
  }
}
