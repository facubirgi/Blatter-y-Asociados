import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { operacionService, type Operacion, EstadoOperacion } from '../services/operacionService';
import AgregarOperacionModal, { type OperacionFormData } from '../components/AgregarOperacionModal';
import EditarOperacionModal, { type OperacionUpdateData } from '../components/EditarOperacionModal';
import { MainLayout } from '../components/layout';

// Componente Skeleton Loading para las cards
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
          <div>
            <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
          <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
          <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
      <div className="mb-3">
        <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-40"></div>
      </div>
      <div className="mb-3 grid grid-cols-3 gap-3">
        <div>
          <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
        <div>
          <div className="h-3 bg-gray-200 rounded w-12 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
        <div>
          <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
      <div className="mb-3">
        <div className="h-3 bg-gray-200 rounded w-12 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-24"></div>
      </div>
      <div className="flex justify-between">
        <div className="h-3 bg-gray-200 rounded w-24"></div>
        <div className="h-3 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  );
}

export default function Operaciones() {

  const [operaciones, setOperaciones] = useState<Operacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [operacionSeleccionada, setOperacionSeleccionada] = useState<Operacion | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    enProceso: 0,
    completadas: 0,
    montoPendiente: 0, // Monto total a cobrar de operaciones pendientes
    montoEnProceso: 0, // Monto total a cobrar de operaciones en proceso
  });

  // Cargar operaciones y estadísticas
  const loadData = async (page: number = currentPage) => {
    try {
      setLoading(true);
      const [operacionesResponse, statsData] = await Promise.all([
        operacionService.getAll(undefined, undefined, page, 20),
        operacionService.getStats()
      ]);

      // Ordenar operaciones por estado: Pendientes -> En Proceso -> Completadas
      const operacionesOrdenadas = operacionesResponse.data.sort((a, b) => {
        const ordenEstado = {
          [EstadoOperacion.PENDIENTE]: 1,
          [EstadoOperacion.EN_PROCESO]: 2,
          [EstadoOperacion.COMPLETADO]: 3,
        };
        return ordenEstado[a.estado] - ordenEstado[b.estado];
      });

      // Calcular monto total de operaciones pendientes
      const montoPendiente = operacionesResponse.data
        .filter(op => op.estado === EstadoOperacion.PENDIENTE)
        .reduce((total, op) => total + op.monto, 0);

      // Calcular monto total de operaciones en proceso
      const montoEnProceso = operacionesResponse.data
        .filter(op => op.estado === EstadoOperacion.EN_PROCESO)
        .reduce((total, op) => total + op.monto, 0);

      setOperaciones(operacionesOrdenadas);
      setTotalPages(operacionesResponse.meta.totalPages);
      setCurrentPage(operacionesResponse.meta.page);
      setStats({
        total: statsData.total,
        pendientes: statsData.pendientes,
        enProceso: statsData.enProceso,
        completadas: statsData.completadas,
        montoPendiente: montoPendiente,
        montoEnProceso: montoEnProceso,
      });
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Agregar operación
  const handleAgregar = async (data: OperacionFormData) => {
    try {
      await operacionService.create(data);
      await loadData(currentPage);
      toast.success('Operación creada exitosamente');
    } catch (error) {
      console.error('Error al crear operación:', error);
      toast.error('No se pudo crear la operación');
    }
  };

  // Editar operación
  const handleEditar = (operacion: Operacion) => {
    setOperacionSeleccionada(operacion);
    setShowEditarModal(true);
  };

  const handleActualizar = async (id: string, data: OperacionUpdateData) => {
    try {
      await operacionService.update(id, data);
      await loadData(currentPage);
      setShowEditarModal(false);
      setOperacionSeleccionada(null);
      toast.success('Operación actualizada exitosamente');
    } catch (error) {
      console.error('Error al actualizar operación:', error);
      toast.error('No se pudo actualizar la operación');
    }
  };

  // Eliminar operación con actualización optimista
  const handleEliminar = async (id: string) => {
    // Usar toast.promise para confirmación
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-medium">¿Estás seguro de que deseas eliminar esta operación?</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              confirmarEliminar(id);
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

  const confirmarEliminar = async (id: string) => {
    // Guardar estado previo para rollback
    const operacionesPrevias = [...operaciones];
    const statsPrevias = {...stats};

    // Actualización optimista - UI inmediata
    setOperaciones(prev => prev.filter(op => op.id !== id));
    setStats(prev => ({
      ...prev,
      total: prev.total - 1,
    }));

    try {
      await operacionService.delete(id);
      // Si tiene éxito, recalcular montos desde el servidor
      const statsData = await operacionService.getStats();
      setStats(prev => ({
        ...prev,
        pendientes: statsData.pendientes,
        enProceso: statsData.enProceso,
        completadas: statsData.completadas,
      }));
      toast.success('Operación eliminada exitosamente');
    } catch (error) {
      // Rollback en caso de error
      setOperaciones(operacionesPrevias);
      setStats(statsPrevias);
      console.error('Error al eliminar operación:', error);
      toast.error('No se pudo eliminar la operación');
    }
  };


  // Generar operaciones mensuales para clientes fijos
  const handleGenerarMensuales = async () => {
    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const anio = hoy.getFullYear();

    try {
      const response = await operacionService.generarOperacionesMensuales({ mes, anio });

      if (response.generadas === 0) {
        toast.success(response.mensaje || 'No hay clientes fijos para generar mensualidades');
      } else {
        toast.success(`✓ Se generaron ${response.generadas} operaciones mensuales para ${mes}/${anio}`);
      }

      // Recargar lista de operaciones
      await loadData(currentPage);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al generar operaciones mensuales';
      toast.error(errorMessage);
      console.error('Error al generar mensualidades:', error);
    }
  };

  // No es necesario filtrar operaciones ya que el sistema usa el backend para reportes

  // Generar números de página para mostrar (optimizado)
  const getPageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow + 2) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Siempre mostrar primera página
      pages.push(1);

      if (currentPage <= 3) {
        // Cerca del inicio
        for (let i = 2; i <= Math.min(maxPagesToShow, totalPages - 1); i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Cerca del final
        pages.push('...');
        for (let i = totalPages - maxPagesToShow + 1; i <= totalPages - 1; i++) {
          if (i > 1) pages.push(i);
        }
        pages.push(totalPages);
      } else {
        // En el medio
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  return (
    <MainLayout>
          {/* Title and Action */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <svg className="w-8 h-8 mr-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Operaciones
            </h2>
            <div className="flex gap-3">
              <button
                onClick={handleGenerarMensuales}
                className="inline-flex items-center px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                title="Generar operaciones mensuales para clientes fijos"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Generar Mensualidades
              </button>
              <button
                onClick={() => setShowAgregarModal(true)}
                className="inline-flex items-center px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar Operación
              </button>
            </div>
          </div>

          {/* Operations List */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Operaciones de Clientes</h3>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : operaciones.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay operaciones</h3>
                <p className="mt-1 text-sm text-gray-500">Comienza agregando una nueva operación.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {operaciones.map((op) => (
                  <div key={op.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    {/* Cliente */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Cliente</p>
                          <p className="text-base font-semibold text-gray-900">{op.cliente.nombre}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditar(op)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEliminar(op.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Tipo de Operación */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Tipo de Operación</p>
                      <p className="text-sm text-gray-900">{operacionService.getTipoOperacionLabel(op.tipo)}</p>
                    </div>

                    {/* Monto */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Monto</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ${op.monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    {/* Estado - Solo lectura */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Estado</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-md text-sm font-medium ${
                          op.estado === EstadoOperacion.PENDIENTE
                            ? 'bg-orange-100 text-orange-700'
                            : op.estado === EstadoOperacion.EN_PROCESO
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {operacionService.getEstadoOperacionLabel(op.estado)}
                      </span>
                    </div>

                    {/* Fecha de creación */}
                    <div className="text-xs text-gray-500">
                      <span>Inicio: {new Date(op.fechaInicio).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginación */}
            {!loading && operaciones.length > 0 && totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => loadData(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>

                <div className="flex gap-1">
                  {getPageNumbers.map((page, index) =>
                    typeof page === 'number' ? (
                      <button
                        key={`page-${page}`}
                        onClick={() => loadData(page)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          page === currentPage
                            ? 'bg-gray-800 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span key={`ellipsis-${index}`} className="px-2 py-2 text-gray-500">
                        {page}
                      </span>
                    )
                  )}
                </div>

                <button
                  onClick={() => loadData(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>

      {/* Modales */}
      <AgregarOperacionModal
        isOpen={showAgregarModal}
        onClose={() => setShowAgregarModal(false)}
        onSubmit={handleAgregar}
      />

      <EditarOperacionModal
        isOpen={showEditarModal}
        operacion={operacionSeleccionada}
        onClose={() => {
          setShowEditarModal(false);
          setOperacionSeleccionada(null);
        }}
        onSubmit={handleActualizar}
        onOperacionCompletada={async () => {
          // Recargar operaciones después de marcar como completada
          await loadData(currentPage);
        }}
      />
    </MainLayout>
  );
}
