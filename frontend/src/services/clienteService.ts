import { api } from './api';

export type CondicionFiscal = 'RESPONSABLE_INSCRIPTO' | 'MONOTRIBUTISTA';

export interface Cliente {
  id: string;
  nombre: string;
  cuit: string;
  fechaAlta: string;
  contacto: string;
  activo: boolean;
  esClienteFijo: boolean;
  montoMensualidad: number;
  condicionFiscal: CondicionFiscal;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreateClienteDto {
  nombre: string;
  cuit: string;
  fechaAlta: string;
  contacto: string;
  esClienteFijo?: boolean;
  montoMensualidad?: number;
  condicionFiscal?: CondicionFiscal;
}

export interface UpdateClienteDto {
  nombre?: string;
  cuit?: string;
  fechaAlta?: string;
  contacto?: string;
  activo?: boolean;
  esClienteFijo?: boolean;
  montoMensualidad?: number;
  condicionFiscal?: CondicionFiscal;
}

export interface ClienteStats {
  total: number;
  activos: number;
  inactivos: number;
  clientesFijos: number;
}

export const clienteService = {
  async getAll(): Promise<Cliente[]> {
    const response = await api.get<Cliente[]>('/api/clientes');
    return response.data;
  },

  async getById(id: string): Promise<Cliente> {
    const response = await api.get<Cliente>(`/api/clientes/${id}`);
    return response.data;
  },

  async create(data: CreateClienteDto): Promise<Cliente> {
    const response = await api.post<Cliente>('/api/clientes', data);
    return response.data;
  },

  async update(id: string, data: UpdateClienteDto): Promise<Cliente> {
    const response = await api.patch<Cliente>(`/api/clientes/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/clientes/${id}`);
  },

  async toggleActivo(id: string): Promise<Cliente> {
    const response = await api.patch<Cliente>(`/api/clientes/${id}/toggle-activo`);
    return response.data;
  },

  async search(query: string): Promise<Cliente[]> {
    const response = await api.get<Cliente[]>(`/api/clientes/search?q=${query}`);
    return response.data;
  },

  async getStats(): Promise<ClienteStats> {
    const response = await api.get<ClienteStats>('/api/clientes/stats');
    return response.data;
  },
};
