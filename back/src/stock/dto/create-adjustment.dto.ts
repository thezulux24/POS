import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdjustmentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  productId: number;

  @ApiProperty({ description: 'Cantidad a ajustar (puede ser negativa para descontar)' })
  @IsNotEmpty()
  @IsInt()
  cantidad: number;

  @ApiProperty({ description: 'Motivo del ajuste, ej: "MERMA", "DONACION", "CORRECCION"' })
  @IsOptional()
  @IsString()
  motivo?: string;
}
