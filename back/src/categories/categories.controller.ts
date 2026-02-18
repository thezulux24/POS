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
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@ApiBearerAuth('session-token')
@ApiUnauthorizedResponse({ description: 'Token de sesion invalido o ausente.' })
@Controller('categories')
@UseGuards(SessionAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear categoria' })
  @ApiCreatedResponse({ description: 'Categoria creada exitosamente.' })
  @ApiBadRequestResponse({ description: 'Datos de categoria invalidos.' })
  @ApiForbiddenResponse({ description: 'Solo ADMIN puede crear categorias.' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.VENDEDOR)
  @ApiOperation({ summary: 'Listar categorias' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: String,
    example: 'false',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'Bebidas',
  })
  @ApiOkResponse({ description: 'Listado de categorias.' })
  @ApiBadRequestResponse({ description: 'Parametros de filtro invalidos.' })
  findAll(
    @Query('includeInactive') includeInactive?: string,
    @Query('search') search?: string,
  ) {
    return this.categoriesService.findAll({
      includeInactive: this.parseBoolean(includeInactive),
      search,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.VENDEDOR)
  @ApiOperation({ summary: 'Obtener categoria por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la categoria' })
  @ApiOkResponse({ description: 'Categoria encontrada.' })
  @ApiBadRequestResponse({ description: 'ID invalido.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar categoria' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la categoria' })
  @ApiOkResponse({ description: 'Categoria actualizada.' })
  @ApiBadRequestResponse({ description: 'Datos invalidos.' })
  @ApiForbiddenResponse({
    description: 'Solo ADMIN puede actualizar categorias.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar categoria (soft delete)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la categoria' })
  @ApiOkResponse({ description: 'Categoria marcada como inactiva.' })
  @ApiBadRequestResponse({ description: 'ID invalido.' })
  @ApiForbiddenResponse({
    description: 'Solo ADMIN puede eliminar categorias.',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }

  private parseBoolean(value?: string): boolean {
    if (value === undefined) {
      return false;
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
