import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Nombre de la categoria',
    example: 'Bebidas',
    minLength: 2,
    maxLength: 80,
  })
  nombre!: string;

  @ApiPropertyOptional({
    description: 'Estado activo de la categoria',
    default: true,
  })
  activo?: boolean;
}
