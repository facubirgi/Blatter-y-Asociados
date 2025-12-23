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
import { GenerarMensualesDto } from './dto/generar-mensuales.dto';
import { ReporteOperacionDto } from './dto/reporte-operacion.dto';
import { EstadisticasAnualesDto } from './dto/estadisticas-anuales.dto';
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

  @Get('reportes/mes-completado/:mes/anio/:anio')
  @ApiOperation({
    summary: 'Obtener operaciones completadas en un mes específico',
    description:
      'Retorna operaciones con estado COMPLETADO cuya fechaCompletado cae EN el mes seleccionado. ' +
      'Útil para reportes mensuales de operaciones pagadas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Array de operaciones completadas del mes',
    type: [ReporteOperacionDto],
  })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  getOperacionesCompletadasMes(
    @GetUser() user: User,
    @Param('mes', ParseIntPipe) mes: number,
    @Param('anio', ParseIntPipe) anio: number,
  ) {
    return this.operacionesService.getOperacionesCompletadasMes(
      user.id,
      mes,
      anio,
    );
  }

  @Get('reportes/estadisticas-anuales/:anio')
  @ApiOperation({
    summary: 'Obtener estadísticas anuales de honorarios',
    description:
      'Retorna array de 12 meses con suma de honorarios de operaciones COMPLETADO. ' +
      'Útil para visualizar ingresos mensuales del año.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas anuales con desglose por mes',
    type: EstadisticasAnualesDto,
  })
  @ApiResponse({ status: 400, description: 'Año inválido' })
  getEstadisticasAnuales(
    @GetUser() user: User,
    @Param('anio', ParseIntPipe) anio: number,
  ) {
    return this.operacionesService.getEstadisticasAnuales(user.id, anio);
  }

  @Post('generar-mensuales')
  @ApiOperation({
    summary: 'Generar operaciones mensuales para clientes fijos',
    description:
      'Genera automáticamente operaciones mensuales para todos los clientes fijos activos del usuario. ' +
      'Si no se especifica día/mes/año, genera para la fecha actual. ' +
      'Valida que no existan mensualidades duplicadas para el día específico.',
  })
  @ApiResponse({
    status: 201,
    description: 'Mensualidades generadas exitosamente',
    schema: {
      example: {
        generadas: 5,
        dia: 12,
        mes: 12,
        anio: 2025,
        clientes: [
          { id: 'uuid-1', nombre: 'Cliente 1' },
          { id: 'uuid-2', nombre: 'Cliente 2' },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Ya existen mensualidades para este día o datos inválidos',
  })
  @ApiResponse({
    status: 200,
    description: 'No hay clientes fijos activos',
    schema: {
      example: {
        generadas: 0,
        mensaje: 'No hay clientes fijos activos',
        dia: 12,
        mes: 12,
        anio: 2025,
      },
    },
  })
  generarOperacionesMensuales(
    @GetUser() user: User,
    @Body() dto?: GenerarMensualesDto,
  ) {
    return this.operacionesService.generarMensualidades(
      user.id,
      dto?.dia,
      dto?.mes,
      dto?.anio,
    );
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