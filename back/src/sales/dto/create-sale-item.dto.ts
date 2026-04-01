import { ApiProperty } from '@nestjs/swagger';

export class CreateSaleItemDto {
  @ApiProperty({
    description: 'ID del producto',
    example: 1,
  })
  productId!: number;

  @ApiProperty({
    description: 'Cantidad a vender',
    example: 2,
    minimum: 1,
  })
  cantidad!: number;
}
