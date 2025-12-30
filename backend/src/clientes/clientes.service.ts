import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './entities/clientes.entity';
import { Operacion } from '../operaciones/entities/operacion.entity';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Operacion)
    private readonly operacionRepository: Repository<Operacion>,
  ) {}

  async create(createClienteDto: CreateClienteDto, userId: string) {
    // Verificar si ya existe un cliente con ese CUIT
    const existingCliente = await this.clienteRepository.findOne({
      where: { cuit: createClienteDto.cuit },
    });

    if (existingCliente) {
      throw new ConflictException('Ya existe un cliente con ese CUIT');
    }

    // Validar que si es cliente fijo, tenga monto de mensualidad
    if (
      createClienteDto.esClienteFijo &&
      (!createClienteDto.montoMensualidad ||
        createClienteDto.montoMensualidad <= 0)
    ) {
      throw new BadRequestException(
        'Los clientes fijos deben tener un monto de mensualidad mayor a 0',
      );
    }

    const cliente = this.clienteRepository.create({
      ...createClienteDto,
      userId,
    });

    return await this.clienteRepository.save(cliente);
  }

  async findAll(userId: string, activo?: boolean) {
    const where: any = { userId };

    if (activo !== undefined) {
      where.activo = activo;
    }

    return await this.clienteRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const cliente = await this.clienteRepository.findOne({
      where: { id, userId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return cliente;
  }

  async update(id: string, updateClienteDto: UpdateClienteDto, userId: string) {
    const cliente = await this.findOne(id, userId);

    // Si se está actualizando el CUIT, verificar que no exista
    if (updateClienteDto.cuit && updateClienteDto.cuit !== cliente.cuit) {
      const existingCliente = await this.clienteRepository.findOne({
        where: { cuit: updateClienteDto.cuit },
      });

      if (existingCliente) {
        throw new ConflictException('Ya existe un cliente con ese CUIT');
      }
    }

    // Validar que si se marca como cliente fijo, tenga monto de mensualidad
    const esClienteFijo =
      updateClienteDto.esClienteFijo !== undefined
        ? updateClienteDto.esClienteFijo
        : cliente.esClienteFijo;

    const montoMensualidad =
      updateClienteDto.montoMensualidad !== undefined
        ? updateClienteDto.montoMensualidad
        : cliente.montoMensualidad;

    if (esClienteFijo && (!montoMensualidad || montoMensualidad <= 0)) {
      throw new BadRequestException(
        'Los clientes fijos deben tener un monto de mensualidad mayor a 0',
      );
    }

    Object.assign(cliente, updateClienteDto);
    return await this.clienteRepository.save(cliente);
  }

  async remove(id: string, userId: string) {
    const cliente = await this.findOne(id, userId);

    // Verificar si el cliente tiene operaciones asociadas
    const operacionesCount = await this.operacionRepository.count({
      where: { clienteId: id },
    });

    if (operacionesCount > 0) {
      throw new ConflictException(
        `No se puede eliminar el cliente porque tiene ${operacionesCount} operación(es) asociada(s). Primero debes eliminar o reasignar las operaciones.`,
      );
    }

    await this.clienteRepository.remove(cliente);
    return { message: 'Cliente eliminado correctamente' };
  }

  async toggleActivo(id: string, userId: string) {
    const cliente = await this.findOne(id, userId);
    cliente.activo = !cliente.activo;
    return await this.clienteRepository.save(cliente);
  }

  async search(query: string, userId: string) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('El término de búsqueda es requerido');
    }

    return await this.clienteRepository
      .createQueryBuilder('cliente')
      .where('cliente.userId = :userId', { userId })
      .andWhere(
        '(cliente.nombre ILIKE :query OR cliente.cuit ILIKE :query OR cliente.contacto ILIKE :query)',
        { query: `%${query}%` },
      )
      .orderBy('cliente.nombre', 'ASC')
      .getMany();
  }

  async getStats(userId: string) {
    const [total, activos, inactivos, clientesFijos] = await Promise.all([
      this.clienteRepository.count({ where: { userId } }),
      this.clienteRepository.count({ where: { userId, activo: true } }),
      this.clienteRepository.count({ where: { userId, activo: false } }),
      this.clienteRepository.count({
        where: { userId, esClienteFijo: true, activo: true },
      }),
    ]);

    return {
      total,
      activos,
      inactivos,
      clientesFijos,
    };
  }

  /**
   * Obtiene todos los clientes fijos activos de un usuario
   * Útil para generar operaciones mensuales automáticas
   */
  async getClientesFijos(userId: string): Promise<Cliente[]> {
    return await this.clienteRepository.find({
      where: {
        userId,
        esClienteFijo: true,
        activo: true,
      },
      order: { nombre: 'ASC' },
    });
  }
}
