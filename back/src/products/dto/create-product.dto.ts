import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: 'Codigo unico del producto',
    example: 'PROD-001',
    minLength: 2,
    maxLength: 40,
  })
  codigo!: string;

  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Coca Cola 400ml',
    minLength: 2,
    maxLength: 120,
  })
  nombre!: string;

  @ApiProperty({
    description: 'Precio del producto',
    oneOf: [{ type: 'number' }, { type: 'string' }],
    example: 2500,
  })
  precio!: number | string;

  @ApiPropertyOptional({
    description: 'Stock inicial',
    example: 100,
    minimum: 0,
    default: 0,
  })
  stock?: number;

  @ApiPropertyOptional({
    description: 'Stock minimo para alertas',
    example: 10,
    minimum: 0,
    default: 0,
  })
  min_stock?: number;

  @ApiProperty({
    description: 'ID de la categoria activa',
    example: 1,
  })
  categoryId!: number;

  @ApiPropertyOptional({
    description: 'ID del proveedor activo (opcional)',
    example: 1,
    nullable: true,
  })
  supplierId?: number | null;

  @ApiPropertyOptional({
    description: 'Estado activo del producto',
    default: true,
  })
  activo?: boolean;
}
