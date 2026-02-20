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
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  type ProductFilters,
  type ProviderFilters,
  ProductsService,
} from './products.service';

@ApiTags('Products')
@ApiBearerAuth('session-token')
@ApiUnauthorizedResponse({ description: 'Token de sesion invalido o ausente.' })
@Controller('products')
@UseGuards(SessionAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear producto' })
  @ApiCreatedResponse({ description: 'Producto creado exitosamente.' })
  @ApiBadRequestResponse({ description: 'Datos de producto invalidos.' })
  @ApiForbiddenResponse({ description: 'Solo ADMIN puede crear productos.' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get('search')
  @Roles(Role.ADMIN, Role.VENDEDOR)
  @ApiOperation({ summary: 'Busqueda rapida de productos para terminal' })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Texto de busqueda',
  })
  @ApiQuery({ name: 'limit', required: false, type: String, example: '20' })
  @ApiOkResponse({ description: 'Productos encontrados.' })
  @ApiBadRequestResponse({ description: 'Parametros invalidos.' })
  search(@Query('q') query?: string, @Query('limit') limit?: string) {
    const parsedLimit = this.parseOptionalInt(limit, 'limit');
    return this.productsService.search(query, parsedLimit);
  }

  @Get('providers')
  @Roles(Role.ADMIN, Role.VENDEDOR)
  @ApiOperation({ summary: 'Listar proveedores para productos' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: String,
    example: 'false',
  })
  @ApiOkResponse({ description: 'Listado de proveedores.' })
  @ApiBadRequestResponse({ description: 'Filtros invalidos.' })
  findProviders(
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const filters: ProviderFilters = {
      search,
      includeInactive: this.parseBoolean(includeInactive),
    };

    return this.productsService.findProviders(filters);
  }

  @Get()
  @Roles(Role.ADMIN, Role.VENDEDOR)
  @ApiOperation({ summary: 'Listar productos' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: String,
    example: 'false',
  })
  @ApiQuery({
    name: 'onlyWithStock',
    required: false,
    type: String,
    example: 'true',
  })
  @ApiOkResponse({ description: 'Listado de productos.' })
  @ApiBadRequestResponse({ description: 'Filtros invalidos.' })
  findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('includeInactive') includeInactive?: string,
    @Query('onlyWithStock') onlyWithStock?: string,
  ) {
    const filters: ProductFilters = {
      search,
      categoryId: this.parseOptionalInt(categoryId, 'categoryId'),
      includeInactive: this.parseBoolean(includeInactive),
      onlyWithStock: this.parseBoolean(onlyWithStock),
    };

    return this.productsService.findAll(filters);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.VENDEDOR)
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del producto' })
  @ApiOkResponse({ description: 'Producto encontrado.' })
  @ApiBadRequestResponse({ description: 'ID invalido.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del producto' })
  @ApiOkResponse({ description: 'Producto actualizado.' })
  @ApiBadRequestResponse({ description: 'Datos invalidos.' })
  @ApiForbiddenResponse({
    description: 'Solo ADMIN puede actualizar productos.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar producto (soft delete)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del producto' })
  @ApiOkResponse({ description: 'Producto marcado como inactivo.' })
  @ApiBadRequestResponse({ description: 'ID invalido.' })
  @ApiForbiddenResponse({ description: 'Solo ADMIN puede eliminar productos.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
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

  private parseOptionalInt(value?: string, field = 'id'): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException(
        `El campo ${field} debe ser un entero positivo`,
      );
    }

    return parsed;
  }
}
