import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { type Operacion } from '../services/operacionService';
import { MainLayout } from '../components/layout';

// Tipo para operaciones con metadata de fecha
interface OperacionConFecha extends Operacion {
  fechaAgregadoReporte?: string;
}

export default function ReportesDiarios() {

  const [operacionesReporte, setOperacionesReporte] = useState<OperacionConFecha[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);

  // Cargar operaciones del reporte desde localStorage
  useEffect(() => {
    const reporteGuardado = localStorage.getItem('reporteDiario');
    if (reporteGuardado) {
      setOperacionesReporte(JSON.parse(reporteGuardado));
    }
  }, []);

  // Eliminar operación del reporte
  const handleEliminar = (id: string) => {
    const nuevasOperaciones = operacionesReporte.filter(op => op.id !== id);
    setOperacionesReporte(nuevasOperaciones);
    localStorage.setItem('reporteDiario', JSON.stringify(nuevasOperaciones));

    // Emitir evento para notificar a otras páginas
    window.dispatchEvent(new Event('reporteActualizado'));
  };

  // Limpiar todo el reporte
  const handleLimpiarReporte = () => {
    // Toast de confirmación
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-medium">¿Estás seguro de que deseas limpiar todo el reporte diario?</p>
        <p className="text-sm text-gray-600">Se eliminarán {operacionesReporte.length} operaciones del reporte</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              confirmarLimpiarReporte();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
          >
            Limpiar
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

  const confirmarLimpiarReporte = () => {
    setOperacionesReporte([]);
    localStorage.removeItem('reporteDiario');

    // Emitir evento para notificar a otras páginas
    window.dispatchEvent(new Event('reporteActualizado'));

    // Notificación de éxito
    toast.success('Reporte limpiado exitosamente');
  };

  // Abrir modal de exportación
  const handleExportarReporte = () => {
    if (operacionesReporte.length === 0) {
      toast.error('No hay operaciones para exportar');
      return;
    }
    setShowExportModal(true);
  };

  // Exportar reporte a CSV con filtro de fecha
  const exportarCSV = (operaciones: OperacionConFecha[], nombreArchivo: string) => {
    try {
      const montoTotalFiltrado = operaciones.reduce((total, op) => total + Number(op.monto), 0);

      // Obtener fecha y hora de generación
      const ahora = new Date();
      const fechaGeneracion = ahora.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const horaGeneracion = ahora.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Calcular totales por tipo de operación
      const totalesPorTipo: { [key: string]: { cantidad: number; monto: number } } = {};
      operaciones.forEach(op => {
        const tipo = op.tipo;
        if (!totalesPorTipo[tipo]) {
          totalesPorTipo[tipo] = { cantidad: 0, monto: 0 };
        }
        totalesPorTipo[tipo].cantidad++;
        totalesPorTipo[tipo].monto += Number(op.monto);
      });

      // Mapear nombres de tipos
      const nombresTipos: { [key: string]: string } = {
        'DECLARACION_IMPUESTOS': 'Declaración de Impuestos',
        'CONTABILIDAD_MENSUAL': 'Contabilidad Mensual',
        'ASESORIA': 'Asesoría',
        'LIQUIDACION_SUELDOS': 'Liquidación de Sueldos',
        'OTRO': 'Otro'
      };

      // Crear contenido CSV mejorado
      const csvLines = [
        // Encabezado de la empresa
        '"BLATTER Y ASOCIADOS - Estudio Contable"',
        '"Reporte de Operaciones Completadas"',
        `"Fecha de generación: ${fechaGeneracion} - ${horaGeneracion}"`,
        '', // Línea vacía

        // Encabezados de columnas
        'N°,Cliente,CUIT,Tipo de Operación,Monto,Monto Pagado,Saldo,Fecha Inicio,Fecha Completado,Fecha Agregado al Reporte',

        // Datos de operaciones
        ...operaciones.map((op, index) => {
          const tipoOperacion = nombresTipos[op.tipo] || op.tipo;
          const saldo = Number(op.monto) - Number(op.montoPagado);

          return [
            index + 1,
            `"${op.cliente.nombre}"`,
            `"${op.cliente.cuit}"`,
            `"${tipoOperacion}"`,
            Number(op.monto).toFixed(2),
            Number(op.montoPagado).toFixed(2),
            saldo.toFixed(2),
            op.fechaInicio,
            op.fechaCompletado || 'N/A',
            op.fechaAgregadoReporte || 'N/A'
          ].join(',');
        }),

        '', // Línea vacía
        '', // Línea vacía

        // Resumen por tipo de operación
        '"RESUMEN POR TIPO DE OPERACIÓN"',
        'Tipo,Cantidad,Monto Total',
        ...Object.entries(totalesPorTipo).map(([tipo, datos]) => {
          const nombreTipo = nombresTipos[tipo] || tipo;
          return `"${nombreTipo}",${datos.cantidad},"$${datos.monto.toFixed(2)}"`;
        }),

        '', // Línea vacía
        '', // Línea vacía

        // Total general
        '"TOTAL GENERAL"',
        `"Total de Operaciones",${operaciones.length}`,
        `"Monto Total","$${montoTotalFiltrado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`,

        '', // Línea vacía
        `"Generado desde el sistema CRM Contable - Blatter y Asociados"`
      ];

      const csvContent = csvLines.join('\n');

      // Crear blob y descargar
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', nombreArchivo);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Reporte exportado exitosamente');
      setShowExportModal(false);
    } catch (error) {
      console.error('Error al exportar reporte:', error);
      toast.error('No se pudo exportar el reporte');
    }
  };

  // Exportar reporte diario (hoy)
  const handleExportarDiario = () => {
    const hoy = new Date().toISOString().split('T')[0];
    const operacionesHoy = operacionesReporte.filter(op => {
      if (!op.fechaAgregadoReporte) return false;
      return op.fechaAgregadoReporte === hoy;
    });

    if (operacionesHoy.length === 0) {
      toast.error('No hay operaciones agregadas hoy');
      return;
    }

    exportarCSV(operacionesHoy, `reporte-diario-${hoy}.csv`);
  };

  // Exportar reporte semanal (últimos 7 días)
  const handleExportarSemanal = () => {
    const hoy = new Date();
    const hace7Dias = new Date(hoy);
    hace7Dias.setDate(hoy.getDate() - 7);

    const operacionesSemana = operacionesReporte.filter(op => {
      if (!op.fechaAgregadoReporte) return false;
      const fechaOp = new Date(op.fechaAgregadoReporte);
      return fechaOp >= hace7Dias && fechaOp <= hoy;
    });

    if (operacionesSemana.length === 0) {
      toast.error('No hay operaciones en los últimos 7 días');
      return;
    }

    const fechaHoy = hoy.toISOString().split('T')[0];
    exportarCSV(operacionesSemana, `reporte-semanal-${fechaHoy}.csv`);
  };

  // Exportar reporte mensual (últimos 30 días)
  const handleExportarMensual = () => {
    const hoy = new Date();
    const hace30Dias = new Date(hoy);
    hace30Dias.setDate(hoy.getDate() - 30);

    const operacionesMes = operacionesReporte.filter(op => {
      if (!op.fechaAgregadoReporte) return false;
      const fechaOp = new Date(op.fechaAgregadoReporte);
      return fechaOp >= hace30Dias && fechaOp <= hoy;
    });

    if (operacionesMes.length === 0) {
      toast.error('No hay operaciones en los últimos 30 días');
      return;
    }

    const fechaHoy = hoy.toISOString().split('T')[0];
    exportarCSV(operacionesMes, `reporte-mensual-${fechaHoy}.csv`);
  };

  // Calcular monto total con memoización (conversión explícita a número)
  const montoTotal = useMemo(
    () => operacionesReporte.reduce((total, op) => total + Number(op.monto), 0),
    [operacionesReporte]
  );

  return (
    <MainLayout>
          {/* Title and Actions */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <svg className="w-8 h-8 mr-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Reportes Diarios
            </h2>
            {operacionesReporte.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={handleExportarReporte}
                  className="inline-flex items-center px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exportar CSV
                </button>
                <button
                  onClick={handleLimpiarReporte}
                  className="inline-flex items-center px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Limpiar Reporte
                </button>
              </div>
            )}
          </div>

          {/* Summary Card */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-8 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Monto Total del Reporte</p>
                    <p className="text-4xl font-bold text-green-600">
                      ${montoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 ml-15 mt-1">
                  {operacionesReporte.length} {operacionesReporte.length === 1 ? 'operación' : 'operaciones'} completadas
                </p>
              </div>
            </div>
          </div>

          {/* Operations List */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Operaciones Completadas</h3>
            {operacionesReporte.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay operaciones en el reporte</h3>
                <p className="mt-1 text-sm text-gray-500">Agrega operaciones completadas desde la sección de Operaciones.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo de Operación
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {operacionesReporte.map((op) => (
                        <tr key={op.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{op.cliente.nombre}</div>
                                <div className="text-xs text-gray-500">CUIT: {op.cliente.cuit}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {op.tipo === 'DECLARACION_IMPUESTOS' && 'Declaración de Impuestos'}
                              {op.tipo === 'CONTABILIDAD_MENSUAL' && 'Contabilidad Mensual'}
                              {op.tipo === 'ASESORIA' && 'Asesoría'}
                              {op.tipo === 'LIQUIDACION_SUELDOS' && 'Liquidación de Sueldos'}
                              {op.tipo === 'OTRO' && 'Otro'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-green-600">
                              ${op.monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEliminar(op.id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Eliminar del reporte"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Modal de Exportación */}
          {showExportModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Exportar Reporte</h3>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-6">
                  Selecciona el rango de fechas para exportar el reporte:
                </p>

                <div className="space-y-3">
                  {/* Opción Diario */}
                  <button
                    onClick={handleExportarDiario}
                    className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Reporte Diario</p>
                        <p className="text-xs text-gray-500">Operaciones agregadas hoy</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Opción Semanal */}
                  <button
                    onClick={handleExportarSemanal}
                    className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Reporte Semanal</p>
                        <p className="text-xs text-gray-500">Últimos 7 días</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Opción Mensual */}
                  <button
                    onClick={handleExportarMensual}
                    className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Reporte Mensual</p>
                        <p className="text-xs text-gray-500">Últimos 30 días</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-full mt-6 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
    </MainLayout>
  );
}
