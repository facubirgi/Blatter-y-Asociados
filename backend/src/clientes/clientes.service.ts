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

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
  ) {}

  async create(createClienteDto: CreateClienteDto, userId: string) {
    // Verificar si ya existe un cliente con ese CUIT
    const existingCliente = await this.clienteRepository.findOne({
      where: { cuit: createClienteDto.cuit },
    });

    if (existingCliente) {
      throw new ConflictException('Ya existe un cliente con ese CUIT');
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

    Object.assign(cliente, updateClienteDto);
    return await this.clienteRepository.save(cliente);
  }

  async remove(id: string, userId: string) {
    const cliente = await this.findOne(id, userId);
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
    const [total, activos, inactivos] = await Promise.all([
      this.clienteRepository.count({ where: { userId } }),
      this.clienteRepository.count({ where: { userId, activo: true } }),
      this.clienteRepository.count({ where: { userId, activo: false } }),
    ]);

    return {
      total,
      activos,
      inactivos,
    };
  }
}