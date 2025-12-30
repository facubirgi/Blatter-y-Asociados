import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';

@ApiTags('Clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente creado exitosamente' })
  @ApiResponse({ status: 409, description: 'El CUIT ya existe' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  create(@Body() createClienteDto: CreateClienteDto, @GetUser() user: User) {
    return this.clientesService.create(createClienteDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los clientes del usuario' })
  @ApiQuery({
    name: 'activo',
    required: false,
    type: Boolean,
    description: 'Filtrar por estado activo/inactivo',
  })
  @ApiResponse({ status: 200, description: 'Lista de clientes' })
  findAll(@GetUser() user: User, @Query('activo') activo?: string) {
    const activoBoolean = activo !== undefined ? activo === 'true' : undefined;
    return this.clientesService.findAll(user.id, activoBoolean);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de clientes' })
  @ApiResponse({ status: 200, description: 'Estadísticas de clientes' })
  getStats(@GetUser() user: User) {
    return this.clientesService.getStats(user.id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar clientes por nombre, CUIT o contacto' })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Término de búsqueda',
  })
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda' })
  @ApiResponse({ status: 400, description: 'Término de búsqueda requerido' })
  search(@GetUser() user: User, @Query('q') query: string) {
    return this.clientesService.search(query, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cliente por ID' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.clientesService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un cliente' })
  @ApiResponse({ status: 200, description: 'Cliente actualizado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @ApiResponse({ status: 409, description: 'El CUIT ya existe' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClienteDto: UpdateClienteDto,
    @GetUser() user: User,
  ) {
    return this.clientesService.update(id, updateClienteDto, user.id);
  }

  @Patch(':id/toggle-activo')
  @ApiOperation({ summary: 'Activar/Desactivar un cliente' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  toggleActivo(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.clientesService.toggleActivo(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un cliente' })
  @ApiResponse({ status: 200, description: 'Cliente eliminado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.clientesService.remove(id, user.id);
  }
}
