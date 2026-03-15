import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import type { SessionTokenPayload } from './auth.types';

@Injectable()
export class SessionTokenService {
  private readonly sessionSecret =
    process.env.SESSION_SECRET ?? 'pos-dev-session-secret-change-me';
  private readonly sessionTtlSeconds = Number(
    process.env.SESSION_TTL_SECONDS ?? 60 * 60 * 8,
  );

  issueToken(userId: number, role: string) {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + this.sessionTtlSeconds;
    const payload: SessionTokenPayload = { userId, role, iat, exp };
    const payloadSegment = this.base64UrlEncode(JSON.stringify(payload));
    const signatureSegment = this.sign(payloadSegment);

    return {
      token: `${payloadSegment}.${signatureSegment}`,
      expiresAt: new Date(exp * 1000).toISOString(),
    };
  }

  verifyToken(token: string): SessionTokenPayload {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Sesion invalida');
    }

    const [payloadSegment, signatureSegment] = token.split('.');
    if (!payloadSegment || !signatureSegment) {
      throw new UnauthorizedException('Sesion invalida');
    }

    const expectedSignature = this.sign(payloadSegment);
    const providedBuffer = Buffer.from(signatureSegment);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Sesion invalida');
    }

    const payload = this.decodePayload(payloadSegment);
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp <= now) {
      throw new UnauthorizedException('Sesion expirada');
    }

    return payload;
  }

  private decodePayload(payloadSegment: string): SessionTokenPayload {
    try {
      const decoded = JSON.parse(
        this.base64UrlDecode(payloadSegment),
      ) as Partial<SessionTokenPayload>;
      if (
        typeof decoded.userId !== 'number' ||
        !Number.isInteger(decoded.userId) ||
        typeof decoded.role !== 'string' ||
        typeof decoded.iat !== 'number' ||
        typeof decoded.exp !== 'number'
      ) {
        throw new UnauthorizedException('Sesion invalida');
      }

      return decoded as SessionTokenPayload;
    } catch {
      throw new UnauthorizedException('Sesion invalida');
    }
  }

  private sign(payloadSegment: string): string {
    return createHmac('sha256', this.sessionSecret)
      .update(payloadSegment)
      .digest('base64url');
  }

  private base64UrlEncode(value: string): string {
    return Buffer.from(value, 'utf8').toString('base64url');
  }

  private base64UrlDecode(value: string): string {
    return Buffer.from(value, 'base64url').toString('utf8');
  }
}
