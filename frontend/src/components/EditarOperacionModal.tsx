import { useState, useEffect, type FormEvent } from 'react';
import { TipoOperacion, EstadoOperacion, type Operacion, operacionService } from '../services/operacionService';
import { clienteService, type Cliente } from '../services/clienteService';
import toast from 'react-hot-toast';

interface EditarOperacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: OperacionUpdateData) => Promise<void>;
  operacion: Operacion | null;
  onOperacionCompletada?: () => void;
}

export interface OperacionUpdateData {
  tipo: TipoOperacion;
  ingresosBrutos: number;
  honorarios: number;
  fechaInicio: string;
  clienteId: string;
}

export default function EditarOperacionModal({ isOpen, onClose, onSubmit, operacion, onOperacionCompletada }: EditarOperacionModalProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formData, setFormData] = useState<OperacionUpdateData>({
    tipo: TipoOperacion.DECLARACION_IMPUESTOS,
    ingresosBrutos: 0,
    honorarios: 0,
    fechaInicio: '',
    clienteId: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingPagado, setLoadingPagado] = useState(false);
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
        ingresosBrutos: operacion.ingresosBrutos,
        honorarios: operacion.honorarios,
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
      [name]: (name === 'ingresosBrutos' || name === 'honorarios') ? parseFloat(value) || 0 : value,
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

  const handleMarcarComoPagado = async () => {
    if (!operacion) return;

    // Confirmación
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-medium">¿Marcar esta operación como completada?</p>
        <p className="text-sm text-gray-600">La operación se marcará como completada.</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              confirmarMarcarComoPagado();
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
          >
            Confirmar
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      style: {
        background: '#fff',
        color: '#000',
        maxWidth: '400px',
      },
    });
  };

  const confirmarMarcarComoPagado = async () => {
    if (!operacion) return;

    setLoadingPagado(true);
    try {
      await operacionService.cambiarEstado(operacion.id, EstadoOperacion.COMPLETADO);

      if (onOperacionCompletada) {
        onOperacionCompletada();
      }

      toast.success('✓ Operación marcada como completada.');

      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al marcar como pagada');
    } finally {
      setLoadingPagado(false);
    }
  };

  if (!isOpen || !operacion) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
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
        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Fila 1: Cliente y Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          </div>

          {/* Fila 2: Honorarios */}
          <div>
            {/* Honorarios */}
            <div>
              <label htmlFor="honorarios" className="block text-sm font-medium text-gray-700 mb-1">
                Honorarios
              </label>
              <input
                type="number"
                id="honorarios"
                name="honorarios"
                required
                min="0"
                step="0.01"
                value={formData.honorarios}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Fila compacta: Monto Total y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Monto Total (Calculado) - Compacto */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Monto Total</p>
              <p className="text-lg font-semibold text-gray-900">
                ${formData.honorarios.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">= Honorarios</p>
            </div>

            {/* Estado Actual - Compacto */}
            {operacion && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Estado Actual</p>
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
                <p className="mt-1 text-xs text-gray-500">Actualizado automáticamente</p>
              </div>
            )}
          </div>

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
          <div className="flex justify-between items-center gap-3 pt-3 border-t border-gray-200 mt-4">
            {/* Botón de Marcar como Pagado - Solo si no está completado */}
            {operacion && operacion.estado !== EstadoOperacion.COMPLETADO && (
              <button
                type="button"
                onClick={handleMarcarComoPagado}
                disabled={loadingPagado}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {loadingPagado ? 'Marcando...' : 'Marcar como Pagado'}
              </button>
            )}

            {/* Botones de Cancelar y Guardar */}
            <div className="flex gap-3 ml-auto">
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
          </div>
        </form>
      </div>
    </div>
  );
}
