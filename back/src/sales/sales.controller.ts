import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';

@ApiTags('Sales')
@ApiBearerAuth('session-token')
@ApiUnauthorizedResponse({ description: 'Token de sesion invalido o ausente.' })
@Controller('sales')
@UseGuards(SessionAuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.VENDEDOR)
  @ApiOperation({ summary: 'Registrar venta con detalle' })
  @ApiCreatedResponse({ description: 'Venta registrada exitosamente.' })
  @ApiBadRequestResponse({ description: 'Datos de venta invalidos.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createSaleDto: CreateSaleDto,
  ) {
    return this.salesService.create(user.id, createSaleDto);
  }

  @Get('reports/daily')
  @Roles(Role.ADMIN, Role.VENDEDOR)
  @ApiOperation({ summary: 'Reporte simple de ventas del dia' })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description:
      'Fecha en formato YYYY-MM-DD. Si no se envia usa el dia actual.',
    example: '2026-02-15',
  })
  @ApiOkResponse({ description: 'Reporte diario generado.' })
  @ApiBadRequestResponse({ description: 'Fecha invalida.' })
  @ApiQuery({
    name: 'vendedorId',
    required: false,
    type: Number,
    description:
      'Filtro por vendedor (solo ADMIN). Si no se envia, incluye todos.',
    example: 2,
  })
  @ApiForbiddenResponse({
    description:
      'Los vendedores solo pueden consultar sus propias ventas del dia.',
  })
  getDailyReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query('date') date?: string,
    @Query('vendedorId') vendedorId?: string,
  ) {
    return this.salesService.getDailyReport(user, date, vendedorId);
  }

  @Get('reports/vendors')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar vendedores activos para filtro de reportes' })
  @ApiOkResponse({ description: 'Listado de vendedores.' })
  @ApiForbiddenResponse({ description: 'Solo ADMIN puede listar vendedores.' })
  getReportVendors() {
    return this.salesService.getReportVendors();
  }

  @Get(':id/ticket')
  @Roles(Role.ADMIN, Role.VENDEDOR)
  @ApiOperation({ summary: 'Obtener ticket imprimible de una venta' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la venta' })
  @ApiOkResponse({ description: 'Ticket generado.' })
  @ApiBadRequestResponse({ description: 'ID invalido.' })
  getTicket(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.getTicket(id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.VENDEDOR)
  @ApiOperation({ summary: 'Obtener venta por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la venta' })
  @ApiOkResponse({ description: 'Venta encontrada.' })
  @ApiBadRequestResponse({ description: 'ID invalido.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }
}
