import { Test, TestingModule } from '@nestjs/testing';
import { ClientesService } from './clientes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './entities/clientes.entity';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Operacion } from '../operaciones/entities/operacion.entity';

describe('ClientesService', () => {
  let service: ClientesService;
  let repository: Repository<Cliente>;

  const mockUserId = 'user-123';
  const mockCliente: Cliente = {
    id: 'cliente-456',
    nombre: 'Empresa Test SA',
    cuit: '20-12345678-9',
    fechaAlta: new Date('2024-01-15'),
    contacto: 'juan.perez@gmail.com',
    activo: true,
    esClienteFijo: false,
    montoMensualidad: 0,
    condicionFiscal: 'RESPONSABLE_INSCRIPTO' as any,
    userId: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    usuario: {} as any,
  };

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockOperacionRepository = {
    count: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        {
          provide: getRepositoryToken(Cliente),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Operacion),
          useValue: mockOperacionRepository,
        },
      ],
    }).compile();

    service = module.get<ClientesService>(ClientesService);
    repository = module.get<Repository<Cliente>>(getRepositoryToken(Cliente));

    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateClienteDto = {
      nombre: 'Nueva Empresa SA',
      cuit: '30-98765432-1',
      fechaAlta: '2024-01-15',
      contacto: 'maria.garcia@gmail.com',
    };

    it('debe crear un cliente exitosamente', async () => {
      mockRepository.findOne.mockResolvedValue(null); // CUIT no existe
      mockRepository.create.mockReturnValue({ ...mockCliente, ...createDto });
      mockRepository.save.mockResolvedValue({ ...mockCliente, ...createDto });

      const result = await service.create(createDto, mockUserId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { cuit: createDto.cuit },
      });
      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        userId: mockUserId,
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result.cuit).toBe(createDto.cuit);
    });

    it('debe lanzar ConflictException si el CUIT ya existe', async () => {
      mockRepository.findOne.mockResolvedValue(mockCliente);

      await expect(service.create(createDto, mockUserId)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { cuit: createDto.cuit },
      });
    });
  });

  describe('findAll', () => {
    it('debe retornar todos los clientes del usuario', async () => {
      const clientes = [mockCliente];
      mockRepository.find.mockResolvedValue(clientes);

      const result = await service.findAll(mockUserId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(clientes);
    });

    it('debe filtrar por clientes activos', async () => {
      const clientesActivos = [mockCliente];
      mockRepository.find.mockResolvedValue(clientesActivos);

      const result = await service.findAll(mockUserId, true);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: mockUserId, activo: true },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(clientesActivos);
    });

    it('debe filtrar por clientes inactivos', async () => {
      const clientesInactivos = [{ ...mockCliente, activo: false }];
      mockRepository.find.mockResolvedValue(clientesInactivos);

      const result = await service.findAll(mockUserId, false);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: mockUserId, activo: false },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('debe retornar un cliente por ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockCliente);

      const result = await service.findOne(mockCliente.id, mockUserId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockCliente.id, userId: mockUserId },
      });
      expect(result).toEqual(mockCliente);
    });

    it('debe lanzar NotFoundException si el cliente no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe validar que el cliente pertenezca al usuario', async () => {
      mockRepository.findOne.mockResolvedValue(null); // No encuentra porque userId no coincide

      await expect(
        service.findOne(mockCliente.id, 'otro-usuario'),
      ).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockCliente.id, userId: 'otro-usuario' },
      });
    });
  });

  describe('update', () => {
    const updateDto: UpdateClienteDto = {
      nombre: 'Empresa Actualizada SA',
      contacto: 'nuevo.contacto@gmail.com',
    };

    it('debe actualizar un cliente exitosamente', async () => {
      mockRepository.findOne.mockResolvedValue(mockCliente);
      mockRepository.save.mockResolvedValue({
        ...mockCliente,
        ...updateDto,
      });

      const result = await service.update(
        mockCliente.id,
        updateDto,
        mockUserId,
      );

      expect(repository.save).toHaveBeenCalled();
      expect(result.nombre).toBe(updateDto.nombre);
      expect(result.contacto).toBe(updateDto.contacto);
    });

    it('debe actualizar el CUIT si no existe conflicto', async () => {
      const updateDtoWithCuit = {
        cuit: '30-11111111-1',
      };

      mockRepository.findOne
        .mockResolvedValueOnce(mockCliente) // findOne en update
        .mockResolvedValueOnce(null); // findOne para verificar CUIT

      mockRepository.save.mockResolvedValue({
        ...mockCliente,
        ...updateDtoWithCuit,
      });

      const result = await service.update(
        mockCliente.id,
        updateDtoWithCuit,
        mockUserId,
      );

      expect(result.cuit).toBe(updateDtoWithCuit.cuit);
    });

    it('debe lanzar ConflictException si el nuevo CUIT ya existe', async () => {
      const updateDtoWithCuit = {
        cuit: '30-99999999-9',
      };

      const otroCliente = {
        ...mockCliente,
        id: 'otro-cliente',
        cuit: '30-99999999-9',
      };

      mockRepository.findOne
        .mockResolvedValueOnce(mockCliente) // findOne en update
        .mockResolvedValueOnce(otroCliente); // findOne para verificar CUIT (existe)

      await expect(
        service.update(mockCliente.id, updateDtoWithCuit, mockUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('no debe validar CUIT si no cambió', async () => {
      const updateDtoSameCuit = {
        cuit: mockCliente.cuit,
        nombre: 'Nuevo Nombre',
      };

      mockRepository.findOne.mockResolvedValue(mockCliente);
      mockRepository.save.mockResolvedValue({
        ...mockCliente,
        nombre: updateDtoSameCuit.nombre,
      });

      await service.update(mockCliente.id, updateDtoSameCuit, mockUserId);

      // Solo debe llamarse una vez (en el findOne inicial)
      expect(repository.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('debe eliminar un cliente sin operaciones', async () => {
      mockRepository.findOne.mockResolvedValue(mockCliente);
      mockOperacionRepository.count.mockResolvedValue(0);
      mockRepository.remove.mockResolvedValue(mockCliente);

      const result = await service.remove(mockCliente.id, mockUserId);

      expect(mockOperacionRepository.count).toHaveBeenCalledWith({
        where: { clienteId: mockCliente.id },
      });
      expect(repository.remove).toHaveBeenCalledWith(mockCliente);
      expect(result.message).toBe('Cliente eliminado correctamente');
    });

    it('debe lanzar ConflictException si el cliente tiene operaciones', async () => {
      mockRepository.findOne.mockResolvedValue(mockCliente);
      mockOperacionRepository.count.mockResolvedValue(3);

      await expect(service.remove(mockCliente.id, mockUserId)).rejects.toThrow(
        ConflictException,
      );
      expect(mockOperacionRepository.count).toHaveBeenCalledWith({
        where: { clienteId: mockCliente.id },
      });
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el cliente no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid-id', mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('toggleActivo', () => {
    it('debe desactivar un cliente activo', async () => {
      mockRepository.findOne.mockResolvedValue(mockCliente);
      mockRepository.save.mockResolvedValue({
        ...mockCliente,
        activo: false,
      });

      const result = await service.toggleActivo(mockCliente.id, mockUserId);

      expect(result.activo).toBe(false);
      expect(repository.save).toHaveBeenCalled();
    });

    it('debe activar un cliente inactivo', async () => {
      const clienteInactivo = { ...mockCliente, activo: false };
      mockRepository.findOne.mockResolvedValue(clienteInactivo);
      mockRepository.save.mockResolvedValue({
        ...clienteInactivo,
        activo: true,
      });

      const result = await service.toggleActivo(mockCliente.id, mockUserId);

      expect(result.activo).toBe(true);
    });
  });

  describe('search', () => {
    it('debe buscar clientes por nombre', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockCliente]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.search('Empresa', mockUserId);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('cliente');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'cliente.userId = :userId',
        { userId: mockUserId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(result).toEqual([mockCliente]);
    });

    it('debe lanzar BadRequestException si query está vacío', async () => {
      await expect(service.search('', mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar BadRequestException si query es solo espacios', async () => {
      await expect(service.search('   ', mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe buscar por CUIT', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockCliente]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.search('20-12345678-9', mockUserId);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(cliente.nombre ILIKE :query OR cliente.cuit ILIKE :query OR cliente.contacto ILIKE :query)',
        { query: '%20-12345678-9%' },
      );
    });
  });

  describe('getStats', () => {
    it('debe retornar estadísticas de clientes', async () => {
      mockRepository.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(40) // activos
        .mockResolvedValueOnce(10) // inactivos
        .mockResolvedValueOnce(25); // clientesFijos

      const result = await service.getStats(mockUserId);

      expect(repository.count).toHaveBeenCalledTimes(4);
      expect(result).toEqual({
        total: 50,
        activos: 40,
        inactivos: 10,
        clientesFijos: 25,
      });
    });

    it('debe retornar 0 si no hay clientes', async () => {
      mockRepository.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getStats(mockUserId);

      expect(result).toEqual({
        total: 0,
        activos: 0,
        inactivos: 0,
        clientesFijos: 0,
      });
    });
  });
});
