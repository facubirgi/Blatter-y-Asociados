import { useState, useEffect, type FormEvent } from 'react';
import { TipoOperacion, EstadoOperacion, type Operacion } from '../services/operacionService';
import { clienteService, type Cliente } from '../services/clienteService';

interface EditarOperacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: OperacionUpdateData) => Promise<void>;
  operacion: Operacion | null;
}

export interface OperacionUpdateData {
  tipo: TipoOperacion;
  monto: number;
  montoPagado: number;
  fechaInicio: string;
  clienteId: string;
}

export default function EditarOperacionModal({ isOpen, onClose, onSubmit, operacion }: EditarOperacionModalProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formData, setFormData] = useState<OperacionUpdateData>({
    tipo: TipoOperacion.DECLARACION_IMPUESTOS,
    monto: 0,
    montoPagado: 0,
    fechaInicio: '',
    clienteId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar clientes
  useEffect(() => {
    if (isOpen) {
      loadClientes();
    }
  }, [isOpen]);

  // Cargar datos de la operación cuando se abre el modal
  useEffect(() => {
    if (operacion && isOpen) {
      setFormData({
        tipo: operacion.tipo,
        monto: operacion.monto,
        montoPagado: operacion.montoPagado || 0,
        fechaInicio: operacion.fechaInicio,
        clienteId: operacion.clienteId,
      });
    }
  }, [operacion, isOpen]);

  const loadClientes = async () => {
    try {
      const data = await clienteService.getAll();
      setClientes(data.filter(c => c.activo));
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: (name === 'monto' || name === 'montoPagado') ? parseFloat(value) || 0 : value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!operacion) return;

    setError('');
    setLoading(true);

    try {
      await onSubmit(operacion.id, formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar la operación');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !operacion) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Editar Operación</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Cliente */}
          <div>
            <label htmlFor="clienteId" className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <select
              id="clienteId"
              name="clienteId"
              required
              value={formData.clienteId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent bg-white"
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Operación */}
          <div>
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Operación
            </label>
            <select
              id="tipo"
              name="tipo"
              required
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent bg-white"
            >
              <option value="">Seleccionar tipo</option>
              <option value={TipoOperacion.DECLARACION_IMPUESTOS}>Declaración de Impuestos</option>
              <option value={TipoOperacion.CONTABILIDAD_MENSUAL}>Contabilidad Mensual</option>
              <option value={TipoOperacion.ASESORIA}>Asesoría</option>
              <option value={TipoOperacion.LIQUIDACION_SUELDOS}>Liquidación de Sueldos</option>
              <option value={TipoOperacion.OTRO}>Otro</option>
            </select>
          </div>

          {/* Monto Total */}
          <div>
            <label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-1">
              Monto Total
            </label>
            <input
              type="number"
              id="monto"
              name="monto"
              required
              min="0"
              step="0.01"
              value={formData.monto}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          {/* Monto Pagado */}
          <div>
            <label htmlFor="montoPagado" className="block text-sm font-medium text-gray-700 mb-1">
              Monto Pagado
            </label>
            <input
              type="number"
              id="montoPagado"
              name="montoPagado"
              required
              min="0"
              max={formData.monto}
              step="0.01"
              value={formData.montoPagado}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-gray-500">
              Restante: ${(formData.monto - formData.montoPagado).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Estado Actual - Solo lectura */}
          {operacion && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-2">Estado Actual</p>
              <span
                className={`inline-block px-3 py-1 rounded-md text-sm font-medium ${
                  operacion.estado === EstadoOperacion.PENDIENTE
                    ? 'bg-orange-100 text-orange-700'
                    : operacion.estado === EstadoOperacion.EN_PROCESO
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {operacion.estado === EstadoOperacion.PENDIENTE
                  ? 'Pendiente'
                  : operacion.estado === EstadoOperacion.EN_PROCESO
                  ? 'En Proceso'
                  : 'Completado'}
              </span>
              <p className="mt-2 text-xs text-gray-600">
                El estado se actualiza automáticamente según el monto pagado
              </p>
            </div>
          )}

          {/* Fecha de Inicio */}
          <div>
            <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Inicio
            </label>
            <input
              type="date"
              id="fechaInicio"
              name="fechaInicio"
              required
              value={formData.fechaInicio}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4">
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
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
