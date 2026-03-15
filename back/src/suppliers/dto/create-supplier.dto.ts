import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  nombre: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  contacto?: string;

  @ApiProperty()
  @IsOptional()
  @IsEmail({}, { message: 'Formato de email invalido' })
  email?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
