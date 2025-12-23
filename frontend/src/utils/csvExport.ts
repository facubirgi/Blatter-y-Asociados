export interface CSVExportOptions {
  filename: string;
  headers: string[];
}

/**
 * Exporta datos a un archivo CSV
 * @param data - Array de objetos con los datos a exportar
 * @param options - Opciones de exportación (nombre de archivo y headers)
 */
export function exportToCSV(
  data: Record<string, any>[],
  options: CSVExportOptions,
): void {
  if (data.length === 0) {
    console.warn('No hay datos para exportar');
    return;
  }

  // Construir header
  const headerRow = options.headers.join(',');

  // Construir filas de datos
  const dataRows = data.map((row) =>
    options.headers
      .map((header) => {
        const value = row[header];
        // Escapar comillas y envolver strings con espacios/comas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      })
      .join(','),
  );

  // Combinar header + datos
  const csv = [headerRow, ...dataRows].join('\n');

  // Crear blob y descargar
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = options.filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
