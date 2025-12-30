import { api } from './api';
import type { Cliente } from './clienteService';

export const TipoOperacion = {
  DECLARACION_IMPUESTOS: 'DECLARACION_IMPUESTOS',
  CONTABILIDAD_MENSUAL: 'CONTABILIDAD_MENSUAL',
  ASESORIA: 'ASESORIA',
  LIQUIDACION_SUELDOS: 'LIQUIDACION_SUELDOS',
  OTRO: 'OTRO',
} as const;

export type TipoOperacion = typeof TipoOperacion[keyof typeof TipoOperacion];

export const EstadoOperacion = {
  PENDIENTE: 'PENDIENTE',
  EN_PROCESO: 'EN_PROCESO',
  COMPLETADO: 'COMPLETADO',
} as const;

export type EstadoOperacion = typeof EstadoOperacion[keyof typeof EstadoOperacion];

export interface Operacion {
  id: string;
  tipo: TipoOperacion;
  descripcion: string | null;
  monto: number;
  montoPagado: number;
  esMensualidad: boolean;
  estado: EstadoOperacion;
  fechaLimite: string | null;
  fechaInicio: string;
  fechaCompletado: string | null;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
  cliente: Cliente;
  clienteId: string;
  userId: string;
}

export interface CreateOperacionDto {
  tipo: TipoOperacion;
  monto: number;
  fechaInicio: string;
  clienteId: string;
  estado: EstadoOperacion;
  descripcion?: string;
  fechaLimite?: string;
  notas?: string;
}

export interface UpdateOperacionDto {
  tipo?: TipoOperacion;
  descripcion?: string;
  monto?: number;
  montoPagado?: number;
  fechaLimite?: string;
  fechaInicio?: string;
  clienteId?: string;
  notas?: string;
}

export interface OperacionStats {
  total: number;
  pendientes: number;
  enProceso: number;
  completadas: number;
  vencidas: number;
  montoTotal: number;
  montoPendiente: number;
  montoEnProceso: number;
  montoCompletado: number;
}

export interface GenerarMensualesDto {
  mes?: number;
  anio?: number;
}

export interface GenerarMensualesResponse {
  generadas: number;
  mes: number;
  anio: number;
  mensaje?: string;
  clientes?: Array<{ id: string; nombre: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ReporteOperacionDto {
  id: string;
  clienteNombre: string;
  fechaCompletado: string;
  montoTotal: number;
}

export interface MesEstadisticaDto {
  mes: number;
  nombreMes: string;
  totalMonto: number;
}

export interface EstadisticasAnualesDto {
  anio: number;
  meses: MesEstadisticaDto[];
}

export const operacionService = {
  async getAll(
    estado?: EstadoOperacion,
    clienteId?: string,
    page?: number,
    limit?: number
  ): Promise<PaginatedResponse<Operacion>> {
    const params = new URLSearchParams();
    if (estado) params.append('estado', estado);
    if (clienteId) params.append('clienteId', clienteId);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    const url = `/api/operaciones${params.toString() ? '?' + params.toString() : ''}`;
    const response = await api.get<PaginatedResponse<Operacion>>(url);
    return response.data;
  },

  async getById(id: string): Promise<Operacion> {
    const response = await api.get<Operacion>(`/api/operaciones/${id}`);
    return response.data;
  },

  async create(data: CreateOperacionDto): Promise<Operacion> {
    const response = await api.post<Operacion>('/api/operaciones', data);
    return response.data;
  },

  async update(id: string, data: UpdateOperacionDto): Promise<Operacion> {
    const response = await api.patch<Operacion>(`/api/operaciones/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/operaciones/${id}`);
  },

  async cambiarEstado(id: string, estado: EstadoOperacion): Promise<Operacion> {
    const response = await api.patch<Operacion>(`/api/operaciones/${id}/estado?estado=${estado}`);
    return response.data;
  },

  async registrarPago(id: string, montoPago: number): Promise<Operacion> {
    const response = await api.patch<Operacion>(`/api/operaciones/${id}/pago`, { montoPago });
    return response.data;
  },

  async getStats(): Promise<OperacionStats> {
    const response = await api.get<OperacionStats>('/api/operaciones/stats');
    return response.data;
  },

  async getProximosVencimientos(dias: number = 7): Promise<Operacion[]> {
    const response = await api.get<Operacion[]>(`/api/operaciones/proximos-vencimientos?dias=${dias}`);
    return response.data;
  },

  async getVencidas(): Promise<Operacion[]> {
    const response = await api.get<Operacion[]>('/api/operaciones/vencidas');
    return response.data;
  },

  async getOperacionesPorMes(mes: number, anio: number): Promise<Operacion[]> {
    const response = await api.get<Operacion[]>(`/api/operaciones/mes/${mes}/anio/${anio}`);
    return response.data;
  },

  async generarOperacionesMensuales(dto?: GenerarMensualesDto): Promise<GenerarMensualesResponse> {
    const response = await api.post<GenerarMensualesResponse>('/api/operaciones/generar-mensuales', dto || {});
    return response.data;
  },

  async getOperacionesCompletadasMes(mes: number, anio: number): Promise<ReporteOperacionDto[]> {
    const response = await api.get<ReporteOperacionDto[]>(
      `/api/operaciones/reportes/mes-completado/${mes}/anio/${anio}`
    );
    return response.data;
  },

  async getEstadisticasAnuales(anio: number): Promise<EstadisticasAnualesDto> {
    const response = await api.get<EstadisticasAnualesDto>(
      `/api/operaciones/reportes/estadisticas-anuales/${anio}`
    );
    return response.data;
  },

  // Funciones auxiliares
  getTipoOperacionLabel(tipo: TipoOperacion): string {
    const labels: Record<TipoOperacion, string> = {
      [TipoOperacion.DECLARACION_IMPUESTOS]: 'Declaración de Impuestos',
      [TipoOperacion.CONTABILIDAD_MENSUAL]: 'Contabilidad Mensual',
      [TipoOperacion.ASESORIA]: 'Asesoría',
      [TipoOperacion.LIQUIDACION_SUELDOS]: 'Liquidación de Sueldos',
      [TipoOperacion.OTRO]: 'Otro',
    };
    return labels[tipo];
  },

  getEstadoOperacionLabel(estado: EstadoOperacion): string {
    const labels: Record<EstadoOperacion, string> = {
      [EstadoOperacion.PENDIENTE]: 'Pendiente',
      [EstadoOperacion.EN_PROCESO]: 'En Proceso',
      [EstadoOperacion.COMPLETADO]: 'Completado',
    };
    return labels[estado];
  },
};
