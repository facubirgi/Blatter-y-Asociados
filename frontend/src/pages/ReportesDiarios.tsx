import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { operacionService, type ReporteOperacionDto, type EstadisticasAnualesDto } from '../services/operacionService';
import { exportToCSV } from '../utils/csvExport';
import { MainLayout } from '../components/layout';

export default function ReportesDiarios() {
  // Estado
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [operacionesPagadas, setOperacionesPagadas] = useState<ReporteOperacionDto[]>([]);
  const [estadisticasAnuales, setEstadisticasAnuales] = useState<EstadisticasAnualesDto | null>(null);
  const [loadingPagadas, setLoadingPagadas] = useState(false);
  const [loadingAnuales, setLoadingAnuales] = useState(false);

  // Cargar datos al cambiar mes/año
  useEffect(() => {
    loadOperacionesPagadas();
    loadEstadisticasAnuales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, anio]);

  const loadOperacionesPagadas = async () => {
    try {
      setLoadingPagadas(true);
      const data = await operacionService.getOperacionesCompletadasMes(mes, anio);
      setOperacionesPagadas(data);
    } catch (error) {
      console.error('Error al cargar operaciones pagadas:', error);
      toast.error('No se pudieron cargar las operaciones pagadas');
    } finally {
      setLoadingPagadas(false);
    }
  };

  const loadEstadisticasAnuales = async () => {
    try {
      setLoadingAnuales(true);
      const data = await operacionService.getEstadisticasAnuales(anio);
      setEstadisticasAnuales(data);
    } catch (error) {
      console.error('Error al cargar estadísticas anuales:', error);
      toast.error('No se pudieron cargar las estadísticas anuales');
    } finally {
      setLoadingAnuales(false);
    }
  };

  const handleExportarCSV = () => {
    if (operacionesPagadas.length === 0) {
      toast.error('No hay operaciones para exportar');
      return;
    }

    const filename = `reporte_${mes.toString().padStart(2, '0')}_${anio}.csv`;
    const data = operacionesPagadas.map((op) => ({
      Cliente: op.clienteNombre || 'N/A',
      'Fecha Completado': op.fechaCompletado || 'N/A',
      'Monto Pagado': (op.montoTotal ?? 0).toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    }));

    exportToCSV(data, {
      filename,
      headers: ['Cliente', 'Fecha Completado', 'Monto Pagado'],
    });

    toast.success('Reporte exportado correctamente');
  };

  // Calcular totales
  const totalMes = operacionesPagadas.reduce((sum, op) => sum + (op.montoTotal ?? 0), 0);
  const totalAnual = estadisticasAnuales?.meses.reduce((sum, mes) => sum + (mes.totalHonorarios ?? 0), 0) || 0;

  // Renderizar skeleton
  function SkeletonRow() {
    return (
      <tr className="border-t border-gray-200 animate-pulse">
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
      </tr>
    );
  }

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
          <svg className="w-8 h-8 mr-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Reportes y Análisis
        </h2>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mes</label>
            <select
              value={mes}
              onChange={(e) => setMes(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const monthNum = i + 1;
                const monthName = new Date(2024, i, 1).toLocaleDateString('es-ES', { month: 'long' });
                return (
                  <option key={monthNum} value={monthNum}>
                    {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Año</label>
            <select
              value={anio}
              onChange={(e) => setAnio(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
            >
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Sección: Operaciones Pagadas */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Operaciones Pagadas del Mes</h3>
          <button
            onClick={handleExportarCSV}
            disabled={operacionesPagadas.length === 0 || loadingPagadas}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar CSV
          </button>
        </div>

        {loadingPagadas ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cliente</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Fecha Completado</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Monto Pagado</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        ) : operacionesPagadas.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sin operaciones completadas</h3>
            <p className="mt-1 text-sm text-gray-500">No hay operaciones con estado completado en este período.</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cliente</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Fecha Completado</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Monto Pagado</th>
                </tr>
              </thead>
              <tbody>
                {operacionesPagadas.map((op) => (
                  <tr key={op.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{op.clienteNombre || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {op.fechaCompletado
                        ? new Date(op.fechaCompletado).toLocaleDateString('es-ES')
                        : 'N/A'
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 font-semibold">
                      ${(op.montoTotal ?? 0).toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-right">
              <span className="text-sm font-semibold text-gray-900">
                Total: ${totalMes.toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Sección: Estadísticas Anuales */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Ingresos Mensuales (Honorarios) - {anio}</h3>
        </div>

        {loadingAnuales ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Mes</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Total Honorarios</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 12 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        ) : estadisticasAnuales ? (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Mes</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Total Honorarios</th>
                </tr>
              </thead>
              <tbody>
                {estadisticasAnuales.meses.map((mesData) => (
                  <tr key={mesData.mes} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{mesData.nombreMes}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 font-semibold">
                      ${mesData.totalHonorarios.toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-right">
              <span className="text-sm font-semibold text-gray-900">
                Total Anual: ${totalAnual.toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </>
        ) : null}
      </div>
    </MainLayout>
  );
}
