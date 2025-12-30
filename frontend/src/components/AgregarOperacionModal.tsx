import { useState, useEffect, type FormEvent } from 'react';
import { TipoOperacion, EstadoOperacion } from '../services/operacionService';
import { clienteService, type Cliente } from '../services/clienteService';

interface AgregarOperacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OperacionFormData) => Promise<void>;
}

export interface OperacionFormData {
  tipo: TipoOperacion;
  monto: number;
  fechaInicio: string;
  clienteId: string;
  estado: EstadoOperacion;
}

export default function AgregarOperacionModal({ isOpen, onClose, onSubmit }: AgregarOperacionModalProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formData, setFormData] = useState<OperacionFormData>({
    tipo: TipoOperacion.DECLARACION_IMPUESTOS,
    monto: 0,
    fechaInicio: '',
    clienteId: '',
    estado: EstadoOperacion.PENDIENTE,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar clientes
  useEffect(() => {
    if (isOpen) {
      loadClientes();
    }
  }, [isOpen]);

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
    const newFormData = {
      ...formData,
      [name]: name === 'monto' ? parseFloat(value) || 0 : value,
    };

    // Si cambia el cliente o el tipo, autocompletar el monto si es cliente fijo con contabilidad mensual
    if (name === 'clienteId' || name === 'tipo') {
      const clienteId = name === 'clienteId' ? value : formData.clienteId;
      const tipo = name === 'tipo' ? value : formData.tipo;
      
      if (clienteId && tipo === TipoOperacion.CONTABILIDAD_MENSUAL) {
        const cliente = clientes.find(c => c.id === clienteId);
        if (cliente?.esClienteFijo && cliente.montoMensualidad > 0) {
          newFormData.monto = cliente.montoMensualidad;
        }
      }
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        tipo: TipoOperacion.DECLARACION_IMPUESTOS,
        monto: 0,
        fechaInicio: '',
        clienteId: '',
        estado: EstadoOperacion.PENDIENTE,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al agregar la operación');
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
          <h2 className="text-xl font-semibold text-gray-900">Agregar Operación</h2>
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
                    {cliente.esClienteFijo ? ` 💼 ($${cliente.montoMensualidad.toLocaleString('es-AR')}/mes)` : ''}
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

          {/* Fila 2: Monto, Fecha y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Monto */}
            <div>
              <label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-1">
                Monto
                {(() => {
                  const cliente = clientes.find(c => c.id === formData.clienteId);
                  return cliente?.esClienteFijo && formData.tipo === TipoOperacion.CONTABILIDAD_MENSUAL && (
                    <span className="ml-1 text-xs text-purple-600 font-normal">
                      (Mensualidad del cliente)
                    </span>
                  );
                })()}
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

            {/* Estado */}
            <div>
              <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                id="estado"
                name="estado"
                required
                value={formData.estado}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent bg-white"
              >
                <option value="">Seleccionar estado</option>
                <option value={EstadoOperacion.PENDIENTE}>Pendiente</option>
                <option value={EstadoOperacion.EN_PROCESO}>En Proceso</option>
                <option value={EstadoOperacion.COMPLETADO}>Completado</option>
              </select>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 mt-4">
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
              {loading ? 'Agregando...' : 'Agregar Operación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
