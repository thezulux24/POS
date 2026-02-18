import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateSaleItemDto } from './create-sale-item.dto';

export class CreateSaleDto {
  @ApiPropertyOptional({
    description: 'ID del cliente activo (opcional)',
    example: 1,
    nullable: true,
  })
  clienteId?: number | null;

  @ApiProperty({
    description: 'Productos de la venta',
    type: [CreateSaleItemDto],
  })
  items!: CreateSaleItemDto[];

  @ApiPropertyOptional({
    description: 'Estado de la venta',
    example: 'COMPLETED',
  })
  estado?: string;
}
