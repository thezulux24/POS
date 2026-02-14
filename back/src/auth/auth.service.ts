import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (user && user.activo) {
            const isMatch = await bcrypt.compare(pass, user.password_hash);
            if (isMatch) {
                const { password_hash, ...result } = user;
                return result;
            }
        }
        return null;
    }

    async login(loginDto: { email: string; pass: string }) {
        const user = await this.validateUser(loginDto.email, loginDto.pass);
        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }
        return {
            message: 'Inicio de sesión exitoso',
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
            },
        };
    }
}
