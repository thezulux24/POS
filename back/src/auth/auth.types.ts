import type { Role, User } from '@prisma/client';

export type AuthenticatedUser = Omit<
  User,
  'password_hash' | 'activo' | 'createdAt' | 'updatedAt'
> & {
  rol: Role;
};

export interface SessionTokenPayload {
  userId: number;
  role: Role;
  iat: number;
  exp: number;
}
