import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Nombre del cliente',
    example: 'Juan Perez',
    minLength: 2,
    maxLength: 120,
  })
  nombre!: string;

  @ApiProperty({
    description: 'Documento o NIT del cliente',
    example: '123456789',
    minLength: 5,
    maxLength: 30,
  })
  documento!: string;

  @ApiPropertyOptional({
    description: 'Telefono del cliente',
    example: '3151112233',
    maxLength: 30,
    nullable: true,
  })
  telefono?: string | null;

  @ApiPropertyOptional({
    description: 'Correo del cliente',
    example: 'juan@email.com',
    nullable: true,
  })
  email?: string | null;

  @ApiPropertyOptional({
    description: 'Estado activo del cliente',
    default: true,
  })
  activo?: boolean;
}
