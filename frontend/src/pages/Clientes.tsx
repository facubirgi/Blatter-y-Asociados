import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { clienteService, type Cliente } from '../services/clienteService';
import AgregarClienteModal, {type ClienteFormData } from '../components/AgregarClienteModal';
import EditarClienteModal, { type ClienteUpdateData } from '../components/EditarClienteModal';
import { MainLayout } from '../components/layout';

export default function Clientes() {

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);

  // Cargar clientes
  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await clienteService.getAll();
      setClientes(data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  // Agregar cliente
  const handleAgregar = async (data: ClienteFormData) => {
    await clienteService.create(data);
    await loadClientes();
  };

  // Editar cliente
  const handleEditar = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setShowEditarModal(true);
  };

  const handleActualizar = async (id: string, data: ClienteUpdateData) => {
    await clienteService.update(id, data);
    await loadClientes();
    setShowEditarModal(false);
    setClienteSeleccionado(null);
  };

  // Eliminar cliente
  const handleEliminar = async (id: string) => {
    // Toast de confirmación
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-medium">¿Estás seguro de que deseas eliminar este cliente?</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              confirmarEliminarCliente(id);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
          >
            Eliminar
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

  const confirmarEliminarCliente = async (id: string) => {
    try {
      await clienteService.delete(id);
      await loadClientes();
      toast.success('Cliente eliminado exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar cliente:', error);
      // Mostrar el mensaje de error del servidor si está disponible
      const errorMessage = error?.response?.data?.message || 'No se pudo eliminar el cliente';
      toast.error(errorMessage, {
        duration: 5000,
        style: {
          maxWidth: '500px',
        },
      });
    }
  };

  return (
    <MainLayout>
      {/* Title and Action */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
          <svg className="w-8 h-8 mr-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Clientes
        </h2>
        <button
          onClick={() => setShowAgregarModal(true)}
          className="inline-flex items-center px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar Cliente
        </button>
      </div>

      {/* Clientes Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay clientes</h3>
          <p className="mt-1 text-sm text-gray-500">Comienza agregando un nuevo cliente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clientes.map((cliente) => (
            <div key={cliente.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Cliente Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{cliente.nombre}</h3>
                    <p className="text-sm text-gray-500">CUIT: {cliente.cuit}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditar(cliente)}
                    className="p-2 text-gray-600 hover:bg-yellow-50 hover:text-yellow-700 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEliminar(cliente.id)}
                    className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Cliente Info */}
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Contacto</p>
                  <p className="text-sm text-gray-900">{cliente.contacto}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fecha de Alta</p>
                  <p className="text-sm text-gray-900">
                    {new Date(cliente.fechaAlta).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                {/* Badge Cliente Fijo */}
                {cliente.esClienteFijo && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Mensualidad: ${cliente.montoMensualidad.toLocaleString('es-AR')}
                  </span>
                )}

                {/* Badge Condición Fiscal */}
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${
                  cliente.condicionFiscal === 'RESPONSABLE_INSCRIPTO'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {cliente.condicionFiscal === 'RESPONSABLE_INSCRIPTO' ? 'Resp. Inscripto' : 'Monotributista'}
                </span>

                {/* Badge Estado */}
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${
                  cliente.activo
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${cliente.activo ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  {cliente.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modales */}
      <AgregarClienteModal
        isOpen={showAgregarModal}
        onClose={() => setShowAgregarModal(false)}
        onSubmit={handleAgregar}
      />

      <EditarClienteModal
        isOpen={showEditarModal}
        cliente={clienteSeleccionado}
        onClose={() => {
          setShowEditarModal(false);
          setClienteSeleccionado(null);
        }}
        onSubmit={handleActualizar}
      />
    </MainLayout>
  );
}
