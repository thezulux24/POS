import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesion',
    description:
      'Valida credenciales y retorna informacion del usuario con token de sesion.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Inicio de sesion exitoso.',
  })
  @ApiBadRequestResponse({
    description: 'Peticion invalida.',
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciales invalidas.',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
