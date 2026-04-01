import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  nombre: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'Formato de email invalido' })
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ description: 'Nombres de los roles, ej: ["VENDEDOR"]' })
  @IsNotEmpty({ message: 'Al menos un rol es obligatorio' })
  roles: string[];

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
