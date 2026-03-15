import type { User } from '@prisma/client';

export type AuthenticatedUser = Omit<
  User,
  'password_hash' | 'activo' | 'createdAt' | 'updatedAt'
> & {
  rol: string;
};

export interface SessionTokenPayload {
  userId: number;
  role: string;
  iat: number;
  exp: number;
}
