import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Correo del usuario',
    example: 'admin@pos.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Contrasena en texto plano',
    example: 'test123',
  })
  pass!: string;
}
