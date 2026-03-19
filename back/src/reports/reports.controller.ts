import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('reports')
@Controller('reports')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Obtener estadísticas principales para el dashboard (ADMIN)' })
  getStats() {
    return this.reportsService.getDashboardStats();
  }

  @Get('dashboard/sales-over-time')
  @ApiOperation({ summary: 'Obtener serie de tiempo de ventas (ADMIN)' })
  getSalesOverTime(@Query('days') days?: string) {
    return this.reportsService.getSalesOverTime(days ? parseInt(days) : 7);
  }

  @Get('dashboard/top-products')
  @ApiOperation({ summary: 'Obtener productos más vendidos (ADMIN)' })
  getTopProducts(@Query('limit') limit?: string) {
    return this.reportsService.getTopProducts(limit ? parseInt(limit) : 5);
  }

  @Get('dashboard/sales-by-period')
  @ApiOperation({ summary: 'Obtener ventas agregadas por día, semana o mes (ADMIN)' })
  getSalesByPeriod(
    @Query('period') period?: string,
    @Query('points') points?: string,
  ) {
    return this.reportsService.getSalesByPeriod(
      period,
      points ? parseInt(points) : undefined,
    );
  }

  @Get('dashboard/top-products-by-period')
  @ApiOperation({ summary: 'Obtener productos más vendidos para el período actual (ADMIN)' })
  getTopProductsByPeriod(
    @Query('period') period?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.getTopProductsByPeriod(
      period,
      limit ? parseInt(limit) : 5,
    );
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Obtener reporte detallado por fechas (ADMIN)' })
  getDetailedReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getDetailedReport(startDate, endDate);
  }
}
