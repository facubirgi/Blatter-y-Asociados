import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  operacionService,
  TipoOperacion,
  EstadoOperacion,
  type Operacion,
  type CreateOperacionDto,
  type UpdateOperacionDto,
  type OperacionStats,
  type PaginatedResponse,
} from './operacionService';
import { api } from './api';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('operacionService', () => {
  const mockOperacion: Operacion = {
    id: 'op-123',
    tipo: TipoOperacion.DECLARACION_IMPUESTOS,
    descripcion: 'Declaración mensual',
    monto: 10000,
    montoPagado: 3000,
    estado: EstadoOperacion.EN_PROCESO,
    fechaInicio: '2025-01-01',
    fechaLimite: '2025-01-31',
    fechaCompletado: null,
    notas: null,
    clienteId: 'cliente-456',
    userId: 'user-123',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    cliente: {
      id: 'cliente-456',
      nombre: 'Cliente Test SA',
      cuit: '20-12345678-9',
      email: 'cliente@test.com',
      telefono: '1234567890',
      direccion: 'Calle Test 123',
      contacto: 'Juan Test',
      activo: true,
      userId: 'user-123',
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('debe obtener todas las operaciones paginadas', async () => {
      const mockResponse: PaginatedResponse<Operacion> = {
        data: [mockOperacion],
        meta: {
          total: 25,
          page: 1,
          limit: 20,
          totalPages: 2,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse });

      const result = await operacionService.getAll();

      expect(api.get).toHaveBeenCalledWith('/api/operaciones');
      expect(result).toEqual(mockResponse);
      expect(result.data).toHaveLength(1);
    });

    it('debe filtrar por estado', async () => {
      const mockResponse: PaginatedResponse<Operacion> = {
        data: [mockOperacion],
        meta: {
          total: 10,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse });

      await operacionService.getAll(EstadoOperacion.EN_PROCESO);

      expect(api.get).toHaveBeenCalledWith('/api/operaciones?estado=EN_PROCESO');
    });

    it('debe incluir parámetros de paginación', async () => {
      const mockResponse: PaginatedResponse<Operacion> = {
        data: [],
        meta: {
          total: 0,
          page: 2,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: true,
        },
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse });

      await operacionService.getAll(undefined, undefined, 2, 10);

      expect(api.get).toHaveBeenCalledWith('/api/operaciones?page=2&limit=10');
    });
  });

  describe('getById', () => {
    it('debe obtener una operación por ID', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockOperacion });

      const result = await operacionService.getById('op-123');

      expect(api.get).toHaveBeenCalledWith('/api/operaciones/op-123');
      expect(result).toEqual(mockOperacion);
    });
  });

  describe('create', () => {
    it('debe crear una nueva operación', async () => {
      const createDto: CreateOperacionDto = {
        tipo: TipoOperacion.CONTABILIDAD_MENSUAL,
        monto: 5000,
        fechaInicio: '2025-02-01',
        clienteId: 'cliente-456',
        estado: EstadoOperacion.PENDIENTE,
      };

      const newOperacion = { ...mockOperacion, ...createDto };
      vi.mocked(api.post).mockResolvedValue({ data: newOperacion });

      const result = await operacionService.create(createDto);

      expect(api.post).toHaveBeenCalledWith('/api/operaciones', createDto);
      expect(result.tipo).toBe(createDto.tipo);
      expect(result.monto).toBe(createDto.monto);
    });
  });

  describe('update', () => {
    it('debe actualizar una operación existente', async () => {
      const updateDto: UpdateOperacionDto = {
        descripcion: 'Descripción actualizada',
        monto: 15000,
      };

      const updatedOperacion = { ...mockOperacion, ...updateDto };
      vi.mocked(api.patch).mockResolvedValue({ data: updatedOperacion });

      const result = await operacionService.update('op-123', updateDto);

      expect(api.patch).toHaveBeenCalledWith('/api/operaciones/op-123', updateDto);
      expect(result.descripcion).toBe(updateDto.descripcion);
      expect(result.monto).toBe(updateDto.monto);
    });

    it('debe actualizar el monto pagado', async () => {
      const updateDto: UpdateOperacionDto = {
        montoPagado: 7000,
      };

      const updatedOperacion = { ...mockOperacion, montoPagado: 7000 };
      vi.mocked(api.patch).mockResolvedValue({ data: updatedOperacion });

      const result = await operacionService.update('op-123', updateDto);

      expect(result.montoPagado).toBe(7000);
    });
  });

  describe('delete', () => {
    it('debe eliminar una operación', async () => {
      vi.mocked(api.delete).mockResolvedValue({});

      await operacionService.delete('op-123');

      expect(api.delete).toHaveBeenCalledWith('/api/operaciones/op-123');
    });
  });

  describe('cambiarEstado', () => {
    it('debe cambiar el estado de una operación', async () => {
      const updatedOperacion = { ...mockOperacion, estado: EstadoOperacion.COMPLETADO };
      vi.mocked(api.patch).mockResolvedValue({ data: updatedOperacion });

      const result = await operacionService.cambiarEstado('op-123', EstadoOperacion.COMPLETADO);

      expect(api.patch).toHaveBeenCalledWith('/api/operaciones/op-123/estado?estado=COMPLETADO');
      expect(result.estado).toBe(EstadoOperacion.COMPLETADO);
    });
  });

  describe('registrarPago', () => {
    it('debe registrar un pago parcial', async () => {
      const montoPago = 2000;
      const updatedOperacion = { ...mockOperacion, montoPagado: 5000 };
      vi.mocked(api.patch).mockResolvedValue({ data: updatedOperacion });

      const result = await operacionService.registrarPago('op-123', montoPago);

      expect(api.patch).toHaveBeenCalledWith('/api/operaciones/op-123/pago', { montoPago });
      expect(result.montoPagado).toBe(5000);
    });

    it('debe marcar como completado al pagar el total', async () => {
      const montoPago = 7000; // Completa el pago
      const updatedOperacion = {
        ...mockOperacion,
        montoPagado: 10000,
        estado: EstadoOperacion.COMPLETADO,
        fechaCompletado: '2025-01-20',
      };
      vi.mocked(api.patch).mockResolvedValue({ data: updatedOperacion });

      const result = await operacionService.registrarPago('op-123', montoPago);

      expect(result.montoPagado).toBe(10000);
      expect(result.estado).toBe(EstadoOperacion.COMPLETADO);
      expect(result.fechaCompletado).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('debe obtener estadísticas de operaciones', async () => {
      const mockStats: OperacionStats = {
        total: 100,
        pendientes: 30,
        enProceso: 40,
        completadas: 25,
        vencidas: 5,
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockStats });

      const result = await operacionService.getStats();

      expect(api.get).toHaveBeenCalledWith('/api/operaciones/stats');
      expect(result).toEqual(mockStats);
    });
  });

  describe('getProximosVencimientos', () => {
    it('debe obtener operaciones próximas a vencer (7 días por defecto)', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [mockOperacion] });

      const result = await operacionService.getProximosVencimientos();

      expect(api.get).toHaveBeenCalledWith('/api/operaciones/proximos-vencimientos?dias=7');
      expect(result).toHaveLength(1);
    });

    it('debe permitir especificar días personalizados', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [mockOperacion] });

      await operacionService.getProximosVencimientos(15);

      expect(api.get).toHaveBeenCalledWith('/api/operaciones/proximos-vencimientos?dias=15');
    });
  });

  describe('getVencidas', () => {
    it('debe obtener operaciones vencidas', async () => {
      const operacionVencida = {
        ...mockOperacion,
        fechaLimite: '2024-12-31',
        estado: EstadoOperacion.PENDIENTE,
      };

      vi.mocked(api.get).mockResolvedValue({ data: [operacionVencida] });

      const result = await operacionService.getVencidas();

      expect(api.get).toHaveBeenCalledWith('/api/operaciones/vencidas');
      expect(result).toHaveLength(1);
    });
  });

  describe('getOperacionesPorMes', () => {
    it('debe obtener operaciones de un mes específico', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [mockOperacion] });

      const result = await operacionService.getOperacionesPorMes(1, 2025);

      expect(api.get).toHaveBeenCalledWith('/api/operaciones/mes/1/anio/2025');
      expect(result).toHaveLength(1);
    });
  });

  describe('getTipoOperacionLabel', () => {
    it('debe retornar el label correcto para cada tipo', () => {
      expect(operacionService.getTipoOperacionLabel(TipoOperacion.DECLARACION_IMPUESTOS))
        .toBe('Declaración de Impuestos');
      expect(operacionService.getTipoOperacionLabel(TipoOperacion.CONTABILIDAD_MENSUAL))
        .toBe('Contabilidad Mensual');
      expect(operacionService.getTipoOperacionLabel(TipoOperacion.ASESORIA))
        .toBe('Asesoría');
      expect(operacionService.getTipoOperacionLabel(TipoOperacion.LIQUIDACION_SUELDOS))
        .toBe('Liquidación de Sueldos');
      expect(operacionService.getTipoOperacionLabel(TipoOperacion.OTRO))
        .toBe('Otro');
    });
  });

  describe('getEstadoOperacionLabel', () => {
    it('debe retornar el label correcto para cada estado', () => {
      expect(operacionService.getEstadoOperacionLabel(EstadoOperacion.PENDIENTE))
        .toBe('Pendiente');
      expect(operacionService.getEstadoOperacionLabel(EstadoOperacion.EN_PROCESO))
        .toBe('En Proceso');
      expect(operacionService.getEstadoOperacionLabel(EstadoOperacion.COMPLETADO))
        .toBe('Completado');
    });
  });
});
