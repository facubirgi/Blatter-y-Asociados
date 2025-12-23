import { useState, type FormEvent } from 'react';
import type { CondicionFiscal } from '../services/clienteService';

interface AgregarClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClienteFormData) => Promise<void>;
}

export interface ClienteFormData {
  nombre: string;
  cuit: string;
  fechaAlta: string;
  contacto: string;
  esClienteFijo?: boolean;
  montoMensualidad?: number;
  condicionFiscal?: CondicionFiscal;
}

export default function AgregarClienteModal({ isOpen, onClose, onSubmit }: AgregarClienteModalProps) {
  const [formData, setFormData] = useState<ClienteFormData>({
    nombre: '',
    cuit: '',
    fechaAlta: '',
    contacto: '',
    esClienteFijo: false,
    montoMensualidad: 0,
    condicionFiscal: 'RESPONSABLE_INSCRIPTO',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData({
      ...formData,
      [name]: type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : type === 'number'
        ? Number(value)
        : value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        nombre: '',
        cuit: '',
        fechaAlta: '',
        contacto: '',
        esClienteFijo: false,
        montoMensualidad: 0,
        condicionFiscal: 'RESPONSABLE_INSCRIPTO',
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al agregar el cliente');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">Agregar Nuevo Cliente</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre Completo - Ocupa 2 columnas */}
            <div className="md:col-span-2">
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                required
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                placeholder="Ej: Juan Pérez González"
              />
            </div>

            {/* CUIT */}
            <div>
              <label htmlFor="cuit" className="block text-sm font-medium text-gray-700 mb-1">
                CUIT <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="cuit"
                name="cuit"
                required
                value={formData.cuit}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                placeholder="XX-XXXXXXXX-X"
                pattern="\d{2}-\d{8}-\d{1}"
              />
            </div>

            {/* Fecha de Alta */}
            <div>
              <label htmlFor="fechaAlta" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Alta <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="fechaAlta"
                name="fechaAlta"
                required
                value={formData.fechaAlta}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
              />
            </div>

            {/* Contacto */}
            <div>
              <label htmlFor="contacto" className="block text-sm font-medium text-gray-700 mb-1">
                Email o Teléfono <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="contacto"
                name="contacto"
                required
                value={formData.contacto}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                placeholder="email@example.com"
              />
            </div>

            {/* Condición Fiscal */}
            <div>
              <label htmlFor="condicionFiscal" className="block text-sm font-medium text-gray-700 mb-1">
                Condición Fiscal
              </label>
              <select
                id="condicionFiscal"
                name="condicionFiscal"
                value={formData.condicionFiscal}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
              >
                <option value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</option>
                <option value="MONOTRIBUTISTA">Monotributista</option>
              </select>
            </div>

            {/* Cliente Fijo (Mensualidad) - Ocupa 2 columnas */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                <input
                  type="checkbox"
                  id="esClienteFijo"
                  name="esClienteFijo"
                  checked={formData.esClienteFijo}
                  onChange={handleChange}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="esClienteFijo" className="text-sm font-medium text-gray-700">
                  Cliente Fijo (Mensualidad)
                </label>
              </div>
            </div>

            {/* Monto Mensualidad (solo si es cliente fijo) */}
            {formData.esClienteFijo && (
              <div className="md:col-span-2">
                <label htmlFor="montoMensualidad" className="block text-sm font-medium text-gray-700 mb-1">
                  Monto Mensualidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="montoMensualidad"
                  name="montoMensualidad"
                  required={formData.esClienteFijo}
                  min="0"
                  step="0.01"
                  value={formData.montoMensualidad}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se generarán operaciones mensuales automáticamente
                </p>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Agregando...' : 'Agregar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
