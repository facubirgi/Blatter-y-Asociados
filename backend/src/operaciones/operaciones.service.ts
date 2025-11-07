import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Operacion, EstadoOperacion } from './entities/operacion.entity';
import { CreateOperacionDto } from './dto/create-operacion.dto';
import { UpdateOperacionDto } from './dto/update-operacion.dto';
import { ClientesService } from '../clientes/clientes.service';

@Injectable()
export class OperacionesService {
  constructor(
    @InjectRepository(Operacion)
    private readonly operacionRepository: Repository<Operacion>,
    private readonly clientesService: ClientesService,
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
      const montoTotal = updateOperacionDto.monto !== undefined
        ? Number(updateOperacionDto.monto)
        : Number(operacion.monto);
      const nuevoMontoPagado = Number(updateOperacionDto.montoPagado);

      // Validar que el monto pagado no exceda el monto total
      if (nuevoMontoPagado > montoTotal) {
        throw new BadRequestException(
          `El monto pagado no puede exceder el monto total. Monto total: ${montoTotal}`,
        );
      }

      // Actualizar estado automáticamente basado en el monto pagado
      if (nuevoMontoPagado === 0) {
        updateOperacionDto.estado = EstadoOperacion.PENDIENTE;
        delete updateOperacionDto.fechaCompletado;
      } else if (nuevoMontoPagado > 0 && nuevoMontoPagado < montoTotal) {
        updateOperacionDto.estado = EstadoOperacion.EN_PROCESO;
        delete updateOperacionDto.fechaCompletado;
      } else if (nuevoMontoPagado >= montoTotal) {
        updateOperacionDto.estado = EstadoOperacion.COMPLETADO;
        if (!updateOperacionDto.fechaCompletado && !operacion.fechaCompletado) {
          updateOperacionDto.fechaCompletado = new Date().toISOString().split('T')[0];
        }
      }
    }

    // Si se está marcando como completado manualmente, agregar fecha de completado si no existe
    if (
      updateOperacionDto.estado === EstadoOperacion.COMPLETADO &&
      !updateOperacionDto.fechaCompletado &&
      !operacion.fechaCompletado
    ) {
      updateOperacionDto.fechaCompletado = new Date().toISOString().split('T')[0];
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
    operacion.estado = estado;

    // Si se marca como completado, agregar fecha
    if (estado === EstadoOperacion.COMPLETADO && !operacion.fechaCompletado) {
      operacion.fechaCompletado = new Date();
    }

    return await this.operacionRepository.save(operacion);
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
}