import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('stock')
@Controller('stock')
@UseGuards(SessionAuthGuard, RolesGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('adjust')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Realizar ajuste manual de stock (ADMIN)' })
  adjust(@Body() dto: CreateAdjustmentDto) {
    return this.stockService.adjust(dto);
  }

  @Get('movements')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Consultar movimientos de stock (ADMIN)' })
  getMovements(@Query('productId') productId?: string) {
    return this.stockService.getMovements(productId ? parseInt(productId) : undefined);
  }
}
