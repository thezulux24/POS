import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@ApiTags('Customers')
@ApiBearerAuth('session-token')
@ApiUnauthorizedResponse({ description: 'Token de sesion invalido o ausente.' })
@Controller('customers')
@UseGuards(SessionAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles('ADMIN', 'VENDEDOR')
  @ApiOperation({ summary: 'Crear cliente' })
  @ApiCreatedResponse({ description: 'Cliente creado exitosamente.' })
  @ApiBadRequestResponse({ description: 'Datos de cliente invalidos.' })
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @Roles('ADMIN', 'VENDEDOR')
  @ApiOperation({ summary: 'Listar clientes' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: String,
    example: 'false',
  })
  @ApiOkResponse({ description: 'Listado de clientes.' })
  @ApiBadRequestResponse({ description: 'Parametros invalidos.' })
  findAll(
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.customersService.findAll({
      search,
      includeInactive: this.parseBoolean(includeInactive),
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'VENDEDOR')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del cliente' })
  @ApiOkResponse({ description: 'Cliente encontrado.' })
  @ApiBadRequestResponse({ description: 'ID invalido.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'VENDEDOR')
  @ApiOperation({ summary: 'Actualizar cliente' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del cliente' })
  @ApiOkResponse({ description: 'Cliente actualizado.' })
  @ApiBadRequestResponse({ description: 'Datos invalidos.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar cliente (soft delete)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del cliente' })
  @ApiOkResponse({ description: 'Cliente marcado como inactivo.' })
  @ApiBadRequestResponse({ description: 'ID invalido.' })
  @ApiForbiddenResponse({ description: 'Solo ADMIN puede eliminar clientes.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.remove(id);
  }

  private parseBoolean(value?: string): boolean | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    throw new BadRequestException('Parametro booleano invalido');
  }
}
