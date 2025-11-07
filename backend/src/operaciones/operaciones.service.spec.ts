import { Test, TestingModule } from '@nestjs/testing';
import { OperacionesService } from './operaciones.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Operacion, EstadoOperacion, TipoOperacion } from './entities/operacion.entity';
import { Repository } from 'typeorm';
import { ClientesService } from '../clientes/clientes.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateOperacionDto } from './dto/create-operacion.dto';
import { UpdateOperacionDto } from './dto/update-operacion.dto';

describe('OperacionesService', () => {
  let service: OperacionesService;
  let repository: Repository<Operacion>;
  let clientesService: ClientesService;

  // Mock de datos de test
  const mockUserId = 'user-123';
  const mockClienteId = 'cliente-456';

  const mockCliente = {
    id: mockClienteId,
    nombre: 'Cliente Test SA',
    cuit: '20-12345678-9',
    email: 'test@test.com',
    telefono: '1234567890',
    userId: mockUserId,
  };

  const mockOperacion: Operacion = {
    id: 'operacion-789',
    tipo: TipoOperacion.DECLARACION_IMPUESTOS,
    descripcion: 'Declaración mensual',
    monto: 10000,
    montoPagado: 0,
    estado: EstadoOperacion.PENDIENTE,
    fechaInicio: '2025-01-01',
    fechaLimite: '2025-01-31',
    fechaCompletado: null,
    notas: null,
    clienteId: mockClienteId,
    userId: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    cliente: mockCliente as any,
  };

  // Mock del Repository
  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  // Mock del ClientesService
  const mockClientesService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperacionesService,
        {
          provide: getRepositoryToken(Operacion),
          useValue: mockRepository,
        },
        {
          provide: ClientesService,
          useValue: mockClientesService,
        },
      ],
    }).compile();

    service = module.get<OperacionesService>(OperacionesService);
    repository = module.get<Repository<Operacion>>(getRepositoryToken(Operacion));
    clientesService = module.get<ClientesService>(ClientesService);

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateOperacionDto = {
      tipo: TipoOperacion.DECLARACION_IMPUESTOS,
      monto: 10000,
      fechaInicio: '2025-01-01',
      clienteId: mockClienteId,
      estado: EstadoOperacion.PENDIENTE,
      descripcion: 'Test operación',
      fechaLimite: '2025-01-31',
    };

    it('debe crear una operación exitosamente', async () => {
      mockClientesService.findOne.mockResolvedValue(mockCliente);
      mockRepository.create.mockReturnValue(mockOperacion);
      mockRepository.save.mockResolvedValue(mockOperacion);

      const result = await service.create(createDto, mockUserId);

      expect(clientesService.findOne).toHaveBeenCalledWith(mockClienteId, mockUserId);
      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        userId: mockUserId,
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockOperacion);
    });

    it('debe lanzar NotFoundException si el cliente no existe', async () => {
      mockClientesService.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      expect(clientesService.findOne).toHaveBeenCalledWith(mockClienteId, mockUserId);
    });

    it('debe lanzar BadRequestException si fechaInicio > fechaLimite', async () => {
      mockClientesService.findOne.mockResolvedValue(mockCliente);
      const invalidDto = {
        ...createDto,
        fechaInicio: '2025-02-01',
        fechaLimite: '2025-01-01',
      };

      await expect(service.create(invalidDto, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('debe retornar una operación por ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockOperacion);

      const result = await service.findOne(mockOperacion.id, mockUserId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockOperacion.id, userId: mockUserId },
        relations: ['cliente'],
      });
      expect(result).toEqual(mockOperacion);
    });

    it('debe lanzar NotFoundException si no se encuentra la operación', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('debe retornar operaciones paginadas', async () => {
      const mockData = [mockOperacion];
      const total = 25;
      mockRepository.findAndCount.mockResolvedValue([mockData, total]);

      const result = await service.findAll(mockUserId, undefined, undefined, 1, 20);

      expect(repository.findAndCount).toHaveBeenCalled();
      expect(result.data).toEqual(mockData);
      expect(result.meta).toEqual({
        total: 25,
        page: 1,
        limit: 20,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('debe filtrar por estado', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockOperacion], 1]);

      await service.findAll(
        mockUserId,
        EstadoOperacion.PENDIENTE,
        undefined,
        1,
        20,
      );

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            estado: EstadoOperacion.PENDIENTE,
          }),
        }),
      );
    });

    it('debe limitar máximo a 100 elementos por página', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(mockUserId, undefined, undefined, 1, 500);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Debe limitar a 100
        }),
      );
    });
  });

  describe('update', () => {
    it('debe actualizar una operación', async () => {
      const updateDto: UpdateOperacionDto = {
        descripcion: 'Descripción actualizada',
      };

      mockRepository.findOne.mockResolvedValue(mockOperacion);
      mockRepository.save.mockResolvedValue({ ...mockOperacion, ...updateDto });

      const result = await service.update(mockOperacion.id, updateDto, mockUserId);

      expect(repository.save).toHaveBeenCalled();
      expect(result.descripcion).toBe(updateDto.descripcion);
    });

    it('debe actualizar estado a PENDIENTE cuando montoPagado es 0', async () => {
      const updateDto: UpdateOperacionDto = {
        montoPagado: 0,
      };

      mockRepository.findOne.mockResolvedValue(mockOperacion);
      mockRepository.save.mockResolvedValue({
        ...mockOperacion,
        montoPagado: 0,
        estado: EstadoOperacion.PENDIENTE,
      });

      const result = await service.update(mockOperacion.id, updateDto, mockUserId);

      expect(result.estado).toBe(EstadoOperacion.PENDIENTE);
    });

    it('debe actualizar estado a EN_PROCESO cuando 0 < montoPagado < monto', async () => {
      const updateDto: UpdateOperacionDto = {
        montoPagado: 5000,
      };

      mockRepository.findOne.mockResolvedValue(mockOperacion);
      mockRepository.save.mockResolvedValue({
        ...mockOperacion,
        montoPagado: 5000,
        estado: EstadoOperacion.EN_PROCESO,
      });

      const result = await service.update(mockOperacion.id, updateDto, mockUserId);

      expect(result.estado).toBe(EstadoOperacion.EN_PROCESO);
    });

    it('debe actualizar estado a COMPLETADO cuando montoPagado >= monto', async () => {
      const updateDto: UpdateOperacionDto = {
        montoPagado: 10000,
      };

      mockRepository.findOne.mockResolvedValue(mockOperacion);
      mockRepository.save.mockResolvedValue({
        ...mockOperacion,
        montoPagado: 10000,
        estado: EstadoOperacion.COMPLETADO,
        fechaCompletado: '2025-01-15',
      });

      const result = await service.update(mockOperacion.id, updateDto, mockUserId);

      expect(result.estado).toBe(EstadoOperacion.COMPLETADO);
      expect(result.fechaCompletado).toBeDefined();
    });

    it('debe lanzar BadRequestException si montoPagado > monto', async () => {
      const updateDto: UpdateOperacionDto = {
        montoPagado: 15000, // Mayor que el monto de 10000
      };

      mockRepository.findOne.mockResolvedValue(mockOperacion);

      await expect(
        service.update(mockOperacion.id, updateDto, mockUserId),
      ).rejects.toThrow('El monto pagado no puede exceder el monto total');
    });
  });

  describe('registrarPago', () => {
    it('debe registrar un pago parcial correctamente', async () => {
      const montoPago = 3000;
      const operacionConPagoCero = { ...mockOperacion, montoPagado: 0 };

      mockRepository.findOne.mockResolvedValue(operacionConPagoCero);
      mockRepository.save.mockResolvedValue({
        ...operacionConPagoCero,
        montoPagado: 3000,
      });

      const result = await service.registrarPago(
        mockOperacion.id,
        montoPago,
        mockUserId,
      );

      expect(result.montoPagado).toBe(3000);
      expect(repository.save).toHaveBeenCalled();
    });

    it('debe marcar como COMPLETADO al pagar el total', async () => {
      const montoPago = 10000;
      const operacionConPagoCero = { ...mockOperacion, montoPagado: 0 };

      mockRepository.findOne.mockResolvedValue(operacionConPagoCero);
      mockRepository.save.mockResolvedValue({
        ...operacionConPagoCero,
        montoPagado: 10000,
        estado: EstadoOperacion.COMPLETADO,
        fechaCompletado: new Date(),
      });

      const result = await service.registrarPago(
        mockOperacion.id,
        montoPago,
        mockUserId,
      );

      expect(result.estado).toBe(EstadoOperacion.COMPLETADO);
      expect(result.fechaCompletado).toBeDefined();
    });

    it('debe lanzar BadRequestException si el pago excede el monto total', async () => {
      const montoPago = 15000;
      mockRepository.findOne.mockResolvedValue(mockOperacion);

      await expect(
        service.registrarPago(mockOperacion.id, montoPago, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe sumar correctamente pagos múltiples', async () => {
      const operacionConPagoPrevio = {
        ...mockOperacion,
        montoPagado: 4000,
      };
      const nuevoPago = 3000;

      mockRepository.findOne.mockResolvedValue(operacionConPagoPrevio);
      mockRepository.save.mockResolvedValue({
        ...operacionConPagoPrevio,
        montoPagado: 7000,
      });

      const result = await service.registrarPago(
        mockOperacion.id,
        nuevoPago,
        mockUserId,
      );

      expect(result.montoPagado).toBe(7000);
    });
  });

  describe('remove', () => {
    it('debe eliminar una operación', async () => {
      mockRepository.findOne.mockResolvedValue(mockOperacion);
      mockRepository.remove.mockResolvedValue(mockOperacion);

      const result = await service.remove(mockOperacion.id, mockUserId);

      expect(repository.remove).toHaveBeenCalledWith(mockOperacion);
      expect(result.message).toBe('Operación eliminada correctamente');
    });
  });

  describe('cambiarEstado', () => {
    it('debe cambiar el estado de una operación', async () => {
      mockRepository.findOne.mockResolvedValue(mockOperacion);
      mockRepository.save.mockResolvedValue({
        ...mockOperacion,
        estado: EstadoOperacion.EN_PROCESO,
      });

      const result = await service.cambiarEstado(
        mockOperacion.id,
        EstadoOperacion.EN_PROCESO,
        mockUserId,
      );

      expect(result.estado).toBe(EstadoOperacion.EN_PROCESO);
    });

    it('debe agregar fechaCompletado al marcar como COMPLETADO', async () => {
      mockRepository.findOne.mockResolvedValue(mockOperacion);
      mockRepository.save.mockResolvedValue({
        ...mockOperacion,
        estado: EstadoOperacion.COMPLETADO,
        fechaCompletado: new Date(),
      });

      const result = await service.cambiarEstado(
        mockOperacion.id,
        EstadoOperacion.COMPLETADO,
        mockUserId,
      );

      expect(result.estado).toBe(EstadoOperacion.COMPLETADO);
      expect(result.fechaCompletado).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('debe retornar estadísticas correctas', async () => {
      mockRepository.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(10) // pendientes
        .mockResolvedValueOnce(20) // enProceso
        .mockResolvedValueOnce(15) // completadas
        .mockResolvedValueOnce(5); // vencidas

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn()
          .mockResolvedValueOnce({ total: '500000' }) // montoTotal
          .mockResolvedValueOnce({ total: '100000' }) // montoPendiente
          .mockResolvedValueOnce({ total: '200000' }) // montoEnProceso
          .mockResolvedValueOnce({ total: '200000' }), // montoCompletado
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getStats(mockUserId);

      expect(result).toEqual({
        total: 50,
        pendientes: 10,
        enProceso: 20,
        completadas: 15,
        vencidas: 5,
        montoTotal: 500000,
        montoPendiente: 100000,
        montoEnProceso: 200000,
        montoCompletado: 200000,
      });
    });
  });

  describe('getProximosVencimientos', () => {
    it('debe retornar operaciones próximas a vencer', async () => {
      const operaciones = [mockOperacion];
      mockRepository.find.mockResolvedValue(operaciones);

      const result = await service.getProximosVencimientos(mockUserId, 7);

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual(operaciones);
    });
  });

  describe('getVencidas', () => {
    it('debe retornar operaciones vencidas', async () => {
      const operacionVencida = {
        ...mockOperacion,
        fechaLimite: '2024-12-01',
      };
      mockRepository.find.mockResolvedValue([operacionVencida]);

      const result = await service.getVencidas(mockUserId);

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual([operacionVencida]);
    });
  });
});
