import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SessionTokenService } from './session-token.service';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Global()
@Module({
  providers: [AuthService, SessionTokenService, SessionAuthGuard, RolesGuard],
  controllers: [AuthController],
  exports: [AuthService, SessionTokenService, SessionAuthGuard, RolesGuard],
})
export class AuthModule {}
