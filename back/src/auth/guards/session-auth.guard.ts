import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth.types';
import { SessionTokenService } from '../session-token.service';
import { PrismaService } from '../../prisma/prisma.service';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly sessionTokenService: SessionTokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Falta token de sesion');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const payload = this.sessionTokenService.verifyToken(token);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
      },
    });

    if (!user || !user.activo) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    request.user = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    };

    return true;
  }
}
