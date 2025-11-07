import { useState, type FormEvent } from 'react';
import { type Operacion } from '../services/operacionService';

interface RegistrarPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (montoPago: number) => Promise<void>;
  operacion: Operacion | null;
}

export default function RegistrarPagoModal({ isOpen, onClose, onSubmit, operacion }: RegistrarPagoModalProps) {
  const [montoPago, setMontoPago] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !operacion) return null;

  const montoRestante = operacion.monto - operacion.montoPagado;
  const porcentajePagado = (operacion.montoPagado / operacion.monto) * 100;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (montoPago <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (montoPago > montoRestante) {
      setError(`El monto excede lo que falta pagar: $${montoRestante.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`);
      return;
    }

    setLoading(true);

    try {
      await onSubmit(montoPago);
      setMontoPago(0);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Registrar Pago</h2>
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

          {/* Info de la operación */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cliente:</span>
              <span className="text-sm font-medium text-gray-900">{operacion.cliente.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Monto Total:</span>
              <span className="text-sm font-semibold text-gray-900">
                ${operacion.monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pagado:</span>
              <span className="text-sm font-semibold text-green-600">
                ${operacion.montoPagado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Restante:</span>
              <span className="text-sm font-semibold text-orange-600">
                ${montoRestante.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progreso de Pago</span>
              <span>{porcentajePagado.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${porcentajePagado}%` }}
              ></div>
            </div>
          </div>

          {/* Monto del pago */}
          <div>
            <label htmlFor="montoPago" className="block text-sm font-medium text-gray-700 mb-1">
              Monto del Pago
            </label>
            <input
              type="number"
              id="montoPago"
              required
              min="0.01"
              step="0.01"
              max={montoRestante}
              value={montoPago || ''}
              onChange={(e) => setMontoPago(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-gray-500">
              Máximo: ${montoRestante.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Botones de acceso rápido */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMontoPago(montoRestante / 2)}
              className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => setMontoPago(montoRestante * 0.75)}
              className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              75%
            </button>
            <button
              type="button"
              onClick={() => setMontoPago(montoRestante)}
              className="px-3 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Total
            </button>
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
              disabled={loading || montoPago <= 0}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registrando...' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
