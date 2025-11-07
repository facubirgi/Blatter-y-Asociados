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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OperacionesService } from './operaciones.service';
import { CreateOperacionDto } from './dto/create-operacion.dto';
import { UpdateOperacionDto } from './dto/update-operacion.dto';
import { RegistrarPagoDto } from './dto/registrar-pago.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';
import { EstadoOperacion } from './entities/operacion.entity';

@ApiTags('Operaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('operaciones')
export class OperacionesController {
  constructor(private readonly operacionesService: OperacionesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva operación' })
  @ApiResponse({ status: 201, description: 'Operación creada exitosamente' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(
    @Body() createOperacionDto: CreateOperacionDto,
    @GetUser() user: User,
  ) {
    return this.operacionesService.create(createOperacionDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las operaciones del usuario' })
  @ApiQuery({
    name: 'estado',
    required: false,
    enum: EstadoOperacion,
    description: 'Filtrar por estado',
  })
  @ApiQuery({
    name: 'clienteId',
    required: false,
    type: String,
    description: 'Filtrar por cliente',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Elementos por página (default: 20, max: 100)',
  })
  @ApiResponse({ status: 200, description: 'Lista de operaciones paginadas' })
  findAll(
    @GetUser() user: User,
    @Query('estado') estado?: EstadoOperacion,
    @Query('clienteId') clienteId?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.operacionesService.findAll(user.id, estado, clienteId, page, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de operaciones' })
  @ApiResponse({ status: 200, description: 'Estadísticas de operaciones' })
  getStats(@GetUser() user: User) {
    return this.operacionesService.getStats(user.id);
  }

  @Get('proximos-vencimientos')
  @ApiOperation({ summary: 'Obtener operaciones próximas a vencer' })
  @ApiQuery({
    name: 'dias',
    required: false,
    type: Number,
    description: 'Número de días (default: 7)',
  })
  @ApiResponse({
    status: 200,
    description: 'Operaciones próximas a vencer',
  })
  getProximosVencimientos(
    @GetUser() user: User,
    @Query('dias', new ParseIntPipe({ optional: true })) dias?: number,
  ) {
    return this.operacionesService.getProximosVencimientos(
      user.id,
      dias || 7,
    );
  }

  @Get('vencidas')
  @ApiOperation({ summary: 'Obtener operaciones vencidas' })
  @ApiResponse({ status: 200, description: 'Operaciones vencidas' })
  getVencidas(@GetUser() user: User) {
    return this.operacionesService.getVencidas(user.id);
  }

  @Get('mes/:mes/anio/:anio')
  @ApiOperation({ summary: 'Obtener operaciones de un mes específico' })
  @ApiResponse({ status: 200, description: 'Operaciones del mes' })
  getOperacionesPorMes(
    @GetUser() user: User,
    @Param('mes', ParseIntPipe) mes: number,
    @Param('anio', ParseIntPipe) anio: number,
  ) {
    return this.operacionesService.getOperacionesPorMes(user.id, mes, anio);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una operación por ID' })
  @ApiResponse({ status: 200, description: 'Operación encontrada' })
  @ApiResponse({ status: 404, description: 'Operación no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.operacionesService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una operación' })
  @ApiResponse({ status: 200, description: 'Operación actualizada' })
  @ApiResponse({ status: 404, description: 'Operación no encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOperacionDto: UpdateOperacionDto,
    @GetUser() user: User,
  ) {
    return this.operacionesService.update(id, updateOperacionDto, user.id);
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Cambiar el estado de una operación' })
  @ApiQuery({
    name: 'estado',
    required: true,
    enum: EstadoOperacion,
    description: 'Nuevo estado',
  })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 404, description: 'Operación no encontrada' })
  cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('estado') estado: EstadoOperacion,
    @GetUser() user: User,
  ) {
    return this.operacionesService.cambiarEstado(id, estado, user.id);
  }

  @Patch(':id/pago')
  @ApiOperation({ summary: 'Registrar un pago parcial o total para una operación' })
  @ApiResponse({ status: 200, description: 'Pago registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'El pago excede el monto total' })
  @ApiResponse({ status: 404, description: 'Operación no encontrada' })
  registrarPago(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() registrarPagoDto: RegistrarPagoDto,
    @GetUser() user: User,
  ) {
    return this.operacionesService.registrarPago(
      id,
      registrarPagoDto.montoPago,
      user.id,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una operación' })
  @ApiResponse({ status: 200, description: 'Operación eliminada' })
  @ApiResponse({ status: 404, description: 'Operación no encontrada' })
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.operacionesService.remove(id, user.id);
  }
}