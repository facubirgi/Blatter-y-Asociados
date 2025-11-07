import { useState, type FormEvent } from 'react';

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
}

export default function AgregarClienteModal({ isOpen, onClose, onSubmit }: AgregarClienteModalProps) {
  const [formData, setFormData] = useState<ClienteFormData>({
    nombre: '',
    cuit: '',
    fechaAlta: '',
    contacto: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Agregar Nuevo Cliente</h2>
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
          <p className="text-sm text-gray-600 mb-4">
            Completa la información del cliente para agregarlo a tu base de datos
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Nombre Completo */}
          <div>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
              placeholder="XX-XXXXXXXX-X"
              pattern="\d{2}-\d{8}-\d{1}"
            />
            <p className="text-xs text-gray-500 mt-1">Formato: XX-XXXXXXXX-X</p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
              placeholder="email@example.com o +52 555 1234"
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
              {loading ? 'Agregando...' : 'Agregar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
