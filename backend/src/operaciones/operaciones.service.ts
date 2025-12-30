import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  LessThanOrEqual,
  MoreThanOrEqual,
  DataSource,
} from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Operacion,
  EstadoOperacion,
  TipoOperacion,
} from './entities/operacion.entity';
import { CreateOperacionDto } from './dto/create-operacion.dto';
import { UpdateOperacionDto } from './dto/update-operacion.dto';
import { ReporteOperacionDto } from './dto/reporte-operacion.dto';
import {
  EstadisticasAnualesDto,
  MesEstadisticaDto,
} from './dto/estadisticas-anuales.dto';
import { ClientesService } from '../clientes/clientes.service';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class OperacionesService {
  private readonly logger = new Logger(OperacionesService.name);

  constructor(
    @InjectRepository(Operacion)
    private readonly operacionRepository: Repository<Operacion>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly clientesService: ClientesService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createOperacionDto: CreateOperacionDto, userId: string) {
    // Verificar que el cliente existe y pertenece al usuario
    const cliente = await this.clientesService.findOne(
      createOperacionDto.clienteId,
      userId,
    );

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // Validar que la fecha de inicio no sea mayor a la fecha límite (si se proporciona fechaLimite)
    if (createOperacionDto.fechaLimite) {
      const fechaInicio = new Date(createOperacionDto.fechaInicio);
      const fechaLimite = new Date(createOperacionDto.fechaLimite);

      if (fechaInicio > fechaLimite) {
        throw new BadRequestException(
          'La fecha de inicio no puede ser mayor a la fecha límite',
        );
      }
    }

    const operacion = this.operacionRepository.create({
      ...createOperacionDto,
      userId,
    });

    return await this.operacionRepository.save(operacion);
  }

  async findAll(
    userId: string,
    estado?: EstadoOperacion,
    clienteId?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    // Validar y sanitizar parámetros de paginación
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit)); // Máximo 100 elementos
    const skip = (validPage - 1) * validLimit;

    const where: any = { userId };

    if (estado) {
      where.estado = estado;
    }

    if (clienteId) {
      where.clienteId = clienteId;
    }

    const [data, total] = await this.operacionRepository.findAndCount({
      where,
      order: { fechaLimite: 'ASC', createdAt: 'DESC' },
      relations: ['cliente'],
      skip,
      take: validLimit,
    });

    return {
      data,
      meta: {
        total,
        page: validPage,
        limit: validLimit,
        totalPages: Math.ceil(total / validLimit),
        hasNextPage: validPage < Math.ceil(total / validLimit),
        hasPreviousPage: validPage > 1,
      },
    };
  }

  async findOne(id: string, userId: string) {
    const operacion = await this.operacionRepository.findOne({
      where: { id, userId },
      relations: ['cliente'],
    });

    if (!operacion) {
      throw new NotFoundException('Operación no encontrada');
    }

    return operacion;
  }

  async update(
    id: string,
    updateOperacionDto: UpdateOperacionDto,
    userId: string,
  ) {
    const operacion = await this.findOne(id, userId);

    // Si se está cambiando el cliente, verificar que pertenece al usuario
    if (
      updateOperacionDto.clienteId &&
      updateOperacionDto.clienteId !== operacion.clienteId
    ) {
      await this.clientesService.findOne(updateOperacionDto.clienteId, userId);
    }

    // Si se está actualizando el monto pagado, validar y actualizar estado automáticamente
    if (updateOperacionDto.montoPagado !== undefined) {
      // Calcular monto considerando posibles actualizaciones
      const monto =
        updateOperacionDto.monto !== undefined
          ? Number(updateOperacionDto.monto)
          : Number(operacion.monto);
      const nuevoMontoPagado = Number(updateOperacionDto.montoPagado);

      // Validar que el monto pagado no exceda el monto total
      if (nuevoMontoPagado > monto) {
        throw new BadRequestException(
          `El monto pagado no puede exceder el monto total. Monto total: ${monto}`,
        );
      }

      // Actualizar estado automáticamente basado en el monto pagado
      if (nuevoMontoPagado === 0) {
        updateOperacionDto.estado = EstadoOperacion.PENDIENTE;
        delete updateOperacionDto.fechaCompletado;
      } else if (nuevoMontoPagado > 0 && nuevoMontoPagado < monto) {
        updateOperacionDto.estado = EstadoOperacion.EN_PROCESO;
        delete updateOperacionDto.fechaCompletado;
      } else if (nuevoMontoPagado >= monto) {
        updateOperacionDto.estado = EstadoOperacion.COMPLETADO;
        if (!updateOperacionDto.fechaCompletado && !operacion.fechaCompletado) {
          updateOperacionDto.fechaCompletado = new Date()
            .toISOString()
            .split('T')[0];
        }
      }
    }

    // Si se está marcando como completado manualmente, agregar fecha de completado si no existe
    if (
      updateOperacionDto.estado === EstadoOperacion.COMPLETADO &&
      !updateOperacionDto.fechaCompletado &&
      !operacion.fechaCompletado
    ) {
      updateOperacionDto.fechaCompletado = new Date()
        .toISOString()
        .split('T')[0];
    }

    // Validar fechas si se están actualizando
    if (updateOperacionDto.fechaInicio && updateOperacionDto.fechaLimite) {
      const fechaInicio = new Date(updateOperacionDto.fechaInicio);
      const fechaLimite = new Date(updateOperacionDto.fechaLimite);

      if (fechaInicio > fechaLimite) {
        throw new BadRequestException(
          'La fecha de inicio no puede ser mayor a la fecha límite',
        );
      }
    }

    Object.assign(operacion, updateOperacionDto);
    return await this.operacionRepository.save(operacion);
  }

  async remove(id: string, userId: string) {
    const operacion = await this.findOne(id, userId);
    await this.operacionRepository.remove(operacion);
    return { message: 'Operación eliminada correctamente' };
  }

  async cambiarEstado(id: string, estado: EstadoOperacion, userId: string) {
    const operacion = await this.findOne(id, userId);
    this.logger.log(
      `Cambiando estado de operación ${id} de ${operacion.estado} a ${estado}`,
    );
    this.logger.log(`  - fechaInicio: ${operacion.fechaInicio}`);
    this.logger.log(`  - updatedAt ANTES: ${operacion.updatedAt}`);

    operacion.estado = estado;

    // Si se marca como completado, agregar fecha y marcar como totalmente pagado
    if (estado === EstadoOperacion.COMPLETADO) {
      if (!operacion.fechaCompletado) {
        operacion.fechaCompletado = new Date();
        this.logger.log(`  - fechaCompletado: ${operacion.fechaCompletado}`);
      }
      // Marcar como totalmente pagado
      operacion.montoPagado = operacion.monto;
      this.logger.log(
        `  - montoPagado actualizado a: ${operacion.montoPagado}`,
      );
    }

    const resultado = await this.operacionRepository.save(operacion);
    this.logger.log(`  - updatedAt DESPUÉS: ${resultado.updatedAt}`);

    return resultado;
  }

  async registrarPago(id: string, montoPago: number, userId: string) {
    const operacion = await this.findOne(id, userId);

    // Validar que el pago no exceda el monto total
    const nuevoMontoPagado = Number(operacion.montoPagado) + Number(montoPago);
    if (nuevoMontoPagado > Number(operacion.monto)) {
      throw new BadRequestException(
        `El pago excede el monto total. Monto restante: ${Number(operacion.monto) - Number(operacion.montoPagado)}`,
      );
    }

    // Actualizar el monto pagado
    operacion.montoPagado = nuevoMontoPagado;

    // Si se pagó el total, marcar como completado
    if (nuevoMontoPagado >= Number(operacion.monto)) {
      operacion.estado = EstadoOperacion.COMPLETADO;
      if (!operacion.fechaCompletado) {
        operacion.fechaCompletado = new Date();
      }
    }

    return await this.operacionRepository.save(operacion);
  }

  async getProximosVencimientos(userId: string, dias: number = 7) {
    const hoy = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() + dias);

    return await this.operacionRepository.find({
      where: {
        userId,
        estado: EstadoOperacion.PENDIENTE,
        fechaLimite: Between(hoy, fechaLimite),
      },
      order: { fechaLimite: 'ASC' },
      relations: ['cliente'],
    });
  }

  async getVencidas(userId: string) {
    const hoy = new Date();

    return await this.operacionRepository.find({
      where: {
        userId,
        estado: EstadoOperacion.PENDIENTE,
        fechaLimite: LessThanOrEqual(hoy),
      },
      order: { fechaLimite: 'ASC' },
      relations: ['cliente'],
    });
  }

  async getStats(userId: string) {
    const [total, pendientes, enProceso, completadas, vencidas] =
      await Promise.all([
        this.operacionRepository.count({ where: { userId } }),
        this.operacionRepository.count({
          where: { userId, estado: EstadoOperacion.PENDIENTE },
        }),
        this.operacionRepository.count({
          where: { userId, estado: EstadoOperacion.EN_PROCESO },
        }),
        this.operacionRepository.count({
          where: { userId, estado: EstadoOperacion.COMPLETADO },
        }),
        this.operacionRepository.count({
          where: {
            userId,
            estado: EstadoOperacion.PENDIENTE,
            fechaLimite: LessThanOrEqual(new Date()),
          },
        }),
      ]);

    // Calcular montos totales por estado
    const [montoTotal, montoPendiente, montoEnProceso, montoCompletado] =
      await Promise.all([
        this.operacionRepository
          .createQueryBuilder('operacion')
          .select('SUM(operacion.monto)', 'total')
          .where('operacion.userId = :userId', { userId })
          .getRawOne()
          .then((result) => parseFloat(result?.total || 0)),
        this.operacionRepository
          .createQueryBuilder('operacion')
          .select('SUM(operacion.monto)', 'total')
          .where('operacion.userId = :userId', { userId })
          .andWhere('operacion.estado = :estado', {
            estado: EstadoOperacion.PENDIENTE,
          })
          .getRawOne()
          .then((result) => parseFloat(result?.total || 0)),
        this.operacionRepository
          .createQueryBuilder('operacion')
          .select('SUM(operacion.monto)', 'total')
          .where('operacion.userId = :userId', { userId })
          .andWhere('operacion.estado = :estado', {
            estado: EstadoOperacion.EN_PROCESO,
          })
          .getRawOne()
          .then((result) => parseFloat(result?.total || 0)),
        this.operacionRepository
          .createQueryBuilder('operacion')
          .select('SUM(operacion.monto)', 'total')
          .where('operacion.userId = :userId', { userId })
          .andWhere('operacion.estado = :estado', {
            estado: EstadoOperacion.COMPLETADO,
          })
          .getRawOne()
          .then((result) => parseFloat(result?.total || 0)),
      ]);

    return {
      total,
      pendientes,
      enProceso,
      completadas,
      vencidas,
      montoTotal,
      montoPendiente,
      montoEnProceso,
      montoCompletado,
    };
  }

  async getOperacionesPorMes(userId: string, mes: number, anio: number) {
    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 0);

    return await this.operacionRepository.find({
      where: {
        userId,
        fechaLimite: Between(fechaInicio, fechaFin),
      },
      order: { fechaLimite: 'ASC' },
      relations: ['cliente'],
    });
  }

  /**
   * Obtiene operaciones completadas en un mes específico (basado en fechaCompletado)
   * @param userId - ID del usuario
   * @param mes - Mes (1-12)
   * @param anio - Año (YYYY)
   * @returns Array de operaciones completadas con datos del cliente
   */
  async getOperacionesCompletadasMes(
    userId: string,
    mes: number,
    anio: number,
  ): Promise<ReporteOperacionDto[]> {
    // Validar parámetros
    if (mes < 1 || mes > 12) {
      throw new BadRequestException('El mes debe estar entre 1 y 12');
    }
    if (anio < 2020) {
      throw new BadRequestException('El año debe ser mayor o igual a 2020');
    }

    // Calcular rango de fechas del mes (formato string para evitar problemas de zona horaria)
    const primerDia = `${anio}-${String(mes).padStart(2, '0')}-01`;
    const ultimoDia = new Date(anio, mes, 0).getDate();
    const ultimoDiaMes = `${anio}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

    // Consulta con QueryBuilder para eficiencia
    const operaciones = await this.operacionRepository
      .createQueryBuilder('operacion')
      .select('operacion.id', 'id')
      .addSelect('operacion.monto', 'montoTotal')
      .addSelect('operacion.fecha_completado', 'fechaCompletado')
      .addSelect('cliente.nombre', 'clienteNombre')
      .innerJoin('operacion.cliente', 'cliente')
      .where('operacion.userId = :userId', { userId })
      .andWhere('operacion.estado = :estado', {
        estado: EstadoOperacion.COMPLETADO,
      })
      .andWhere('operacion.fecha_completado IS NOT NULL')
      .andWhere('operacion.fecha_completado >= :primerDia', { primerDia })
      .andWhere('operacion.fecha_completado <= :ultimoDiaMes', { ultimoDiaMes })
      .orderBy('operacion.fecha_completado', 'DESC')
      .addOrderBy('operacion.created_at', 'DESC')
      .getRawMany();

    // Mapear a DTO
    return operaciones.map((op) => {
      // Manejar fechaCompletado que puede venir como string o Date de la BD
      let fechaFormateada: string;
      if (typeof op.fechaCompletado === 'string') {
        // Ya viene en formato string YYYY-MM-DD desde la BD
        fechaFormateada = op.fechaCompletado;
      } else if (op.fechaCompletado instanceof Date) {
        // Es un objeto Date, convertirlo
        fechaFormateada = op.fechaCompletado.toISOString().split('T')[0];
      } else {
        // Valor inválido, usar fecha actual como fallback
        this.logger.warn(
          `Fecha completado inválida para operación ${op.id}: ${op.fechaCompletado}`,
        );
        fechaFormateada = new Date().toISOString().split('T')[0];
      }

      // Manejar montoTotal que puede ser null o string (DECIMAL viene como string desde PostgreSQL)
      let montoTotal: number;
      if (op.montoTotal === null || op.montoTotal === undefined) {
        this.logger.warn(`Monto total null para operación ${op.id}`);
        montoTotal = 0;
      } else {
        // Convertir string a número y redondear a 2 decimales
        const parsed = Number(op.montoTotal);
        if (isNaN(parsed)) {
          this.logger.warn(
            `Monto total inválido para operación ${op.id}: ${op.montoTotal}`,
          );
          montoTotal = 0;
        } else {
          montoTotal = Math.round(parsed * 100) / 100; // Redondear a 2 decimales
        }
      }

      return {
        id: op.id,
        clienteNombre: op.clienteNombre,
        fechaCompletado: fechaFormateada,
        montoTotal,
      };
    });
  }

  /**
   * Obtiene estadísticas anuales de honorarios agrupadas por mes
   * @param userId - ID del usuario
   * @param anio - Año (YYYY)
   * @returns Estadísticas con array de 12 meses
   */
  async getEstadisticasAnuales(
    userId: string,
    anio: number,
  ): Promise<EstadisticasAnualesDto> {
    // Validar parámetro
    if (anio < 2020) {
      throw new BadRequestException('El año debe ser mayor o igual a 2020');
    }

    // Nombres de meses en español
    const mesesNombres = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];

    // Obtener datos de todos los meses en paralelo
    const resultados = await Promise.all(
      Array.from({ length: 12 }, async (_, mesIndex) => {
        const mes = mesIndex + 1;
        const primerDia = `${anio}-${String(mes).padStart(2, '0')}-01`;
        const ultimoDia = new Date(anio, mes, 0).getDate();
        const ultimoDiaMes = `${anio}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

        const resultado = await this.operacionRepository
          .createQueryBuilder('operacion')
          .select('SUM(operacion.monto)', 'totalMonto')
          .where('operacion.userId = :userId', { userId })
          .andWhere('operacion.estado = :estado', {
            estado: EstadoOperacion.COMPLETADO,
          })
          .andWhere('operacion.fechaCompletado IS NOT NULL')
          .andWhere('operacion.fechaCompletado >= :primerDia', {
            primerDia,
          })
          .andWhere('operacion.fechaCompletado <= :ultimoDiaMes', {
            ultimoDiaMes,
          })
          .getRawOne();

        return {
          mes,
          nombreMes: mesesNombres[mesIndex],
          totalMonto: parseFloat(resultado?.totalMonto || 0),
        };
      }),
    );

    return {
      anio,
      meses: resultados,
    };
  }

  /**
   * CRON: Se ejecuta automáticamente el día 1 de cada mes a las 00:00
   * Genera mensualidades para todos los usuarios con clientes fijos
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async generarMensualidadesAutomatico() {
    this.logger.log('Ejecutando generación automática de mensualidades...');

    try {
      // Obtener todos los usuarios
      const usuarios = await this.userRepository.find();
      let totalGeneradas = 0;
      let totalUsuarios = 0;

      for (const usuario of usuarios) {
        try {
          const resultado = await this.generarMensualidades(usuario.id);
          if (resultado.generadas > 0) {
            totalGeneradas += resultado.generadas;
            totalUsuarios++;
            this.logger.log(
              `Usuario ${usuario.email}: ${resultado.generadas} mensualidades generadas`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Error generando mensualidades para usuario ${usuario.id}:`,
            error.message,
          );
        }
      }

      this.logger.log(
        `Generación automática completada: ${totalGeneradas} mensualidades para ${totalUsuarios} usuarios`,
      );
    } catch (error) {
      this.logger.error(
        'Error en generación automática de mensualidades:',
        error,
      );
    }
  }

  /**
   * Genera operaciones mensuales para todos los clientes fijos activos de un usuario
   * @param userId - ID del usuario
   * @param dia - Día (1-31), por defecto el día actual
   * @param mes - Mes (1-12), por defecto el mes actual
   * @param anio - Año (YYYY), por defecto el año actual
   * @returns Información sobre las operaciones generadas
   */
  async generarMensualidades(
    userId: string,
    dia?: number,
    mes?: number,
    anio?: number,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const fechaActual = new Date();
      const diaActual = dia || fechaActual.getDate();
      const mesActual = mes || fechaActual.getMonth() + 1;
      const anioActual = anio || fechaActual.getFullYear();

      // 1. Verificar si ya existen mensualidades para este día específico
      const fechaInicio = new Date(anioActual, mesActual - 1, diaActual);
      const fechaFinDia = new Date(
        anioActual,
        mesActual - 1,
        diaActual,
        23,
        59,
        59,
        999,
      );

      const mensualidadesExistentes = await this.operacionRepository
        .createQueryBuilder('op')
        .where('op.esMensualidad = :esMensualidad', { esMensualidad: true })
        .andWhere('op.userId = :userId', { userId })
        .andWhere('op.fechaInicio >= :fechaInicio', { fechaInicio })
        .andWhere('op.fechaInicio <= :fechaFin', { fechaFin: fechaFinDia })
        .getCount();

      if (mensualidadesExistentes > 0) {
        await queryRunner.rollbackTransaction();
        throw new BadRequestException(
          `Ya existen ${mensualidadesExistentes} mensualidades generadas para ${diaActual}/${mesActual}/${anioActual}`,
        );
      }

      // 2. Obtener clientes fijos del usuario
      const clientesFijos = await this.clientesService.getClientesFijos(userId);

      if (clientesFijos.length === 0) {
        await queryRunner.rollbackTransaction();
        return {
          generadas: 0,
          mensaje: 'No hay clientes fijos activos',
          dia: diaActual,
          mes: mesActual,
          anio: anioActual,
        };
      }

      // 3. Preparar operaciones en lote (BULK INSERT)
      const fechaLimite = new Date(anioActual, mesActual - 1, diaActual); // Mismo día como límite

      const operaciones = clientesFijos.map((cliente) => {
        // Convertir DECIMAL a número (TypeORM devuelve DECIMALs como strings)
        const monto = Number(cliente.montoMensualidad) || 0;

        // Validar que el monto es un número válido
        if (isNaN(monto) || monto < 0) {
          this.logger.warn(
            `Cliente ${cliente.nombre} (${cliente.id}) tiene un monto de mensualidad inválido: ${cliente.montoMensualidad}`,
          );
        }

        return this.operacionRepository.create({
          tipo: TipoOperacion.CONTABILIDAD_MENSUAL,
          descripcion: `Mensualidad ${diaActual}/${mesActual}/${anioActual}`,
          monto,
          esMensualidad: true,
          fechaInicio,
          fechaLimite,
          clienteId: cliente.id,
          userId,
          estado: EstadoOperacion.PENDIENTE,
          montoPagado: 0,
        });
      });

      // 4. Insertar en lote usando query builder (más rápido que save)
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(Operacion)
        .values(operaciones)
        .execute();

      await queryRunner.commitTransaction();

      this.logger.log(
        `Generadas ${clientesFijos.length} mensualidades para usuario ${userId} (${diaActual}/${mesActual}/${anioActual})`,
      );

      return {
        generadas: clientesFijos.length,
        dia: diaActual,
        mes: mesActual,
        anio: anioActual,
        clientes: clientesFijos.map((c) => ({ id: c.id, nombre: c.nombre })),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      // Log detallado del error
      this.logger.error(
        `Error al generar mensualidades para usuario ${userId}`,
      );
      this.logger.error(`Mensaje: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);

      // Si es un BadRequestException (validación), lo propagamos tal cual
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Para otros errores, proporcionamos más contexto
      throw new BadRequestException(
        `Error al generar mensualidades: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Corrige los montos de las operaciones de mensualidad que tienen monto 0
   * y deberían tener el monto de mensualidad del cliente
   */
  async fixMontosMensualidades(userId: string) {
    try {
      // Buscar operaciones de mensualidad con monto 0
      const operacionesConMontoInvalido = await this.operacionRepository
        .createQueryBuilder('op')
        .leftJoinAndSelect('op.cliente', 'cliente')
        .where('op.userId = :userId', { userId })
        .andWhere('op.esMensualidad = :esMensualidad', { esMensualidad: true })
        .andWhere('op.monto = :monto', { monto: 0 })
        .andWhere('cliente.montoMensualidad > :montoMin', { montoMin: 0 })
        .getMany();

      if (operacionesConMontoInvalido.length === 0) {
        return {
          actualizadas: 0,
          mensaje:
            'No hay operaciones de mensualidad con monto 0 para corregir',
        };
      }

      // Actualizar cada operación
      const operacionesActualizadas: Array<{
        id: string;
        cliente: string;
        montoAnterior: number;
        montoNuevo: number;
      }> = [];
      for (const operacion of operacionesConMontoInvalido) {
        operacion.monto = Number(operacion.cliente.montoMensualidad);
        await this.operacionRepository.save(operacion);
        operacionesActualizadas.push({
          id: operacion.id,
          cliente: operacion.cliente.nombre,
          montoAnterior: 0,
          montoNuevo: operacion.monto,
        });
      }

      this.logger.log(
        `Se corrigieron ${operacionesActualizadas.length} operaciones de mensualidad para el usuario ${userId}`,
      );

      return {
        actualizadas: operacionesActualizadas.length,
        mensaje: `Se actualizaron ${operacionesActualizadas.length} operaciones de mensualidad`,
        operaciones: operacionesActualizadas,
      };
    } catch (error) {
      this.logger.error(
        `Error al corregir montos de mensualidades: ${error.message}`,
      );
      throw error;
    }
  }
}
