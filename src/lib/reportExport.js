import * as XLSX from 'xlsx';

export function downloadExcel(sheetData, filename, sheetName = 'Report') {
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const colWidths = sheetData[0]?.map((_, ci) =>
    Math.min(60, Math.max(12, ...sheetData.map(row => String(row[ci] ?? '').length)))
  ) ?? [];
  ws['!cols'] = colWidths.map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export function downloadCsv(sheetData, filename) {
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename.replace(/\.xlsx$/, '')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function filterRowsByColumns(reportId, rows, selectedKeys, getColumnsForReport) {
  if (!selectedKeys?.length || !rows.length) return rows;
  const colDefs = getColumnsForReport(reportId);
  if (!colDefs.length) return rows;
  const indices = colDefs
    .map((c, i) => ({ key: c.key, i }))
    .filter(({ key }) => selectedKeys.includes(key))
    .map(({ i }) => i);
  return rows.map(row => indices.map(i => row[i]));
}

export function buildReportFilename(baseFilename, dateFrom, dateTo, format = 'xlsx') {
  const rangeLabel = dateFrom === '2000-01-01' ? 'AllTime' : `${dateFrom}_to_${dateTo}`;
  const ext = format === 'csv' ? 'csv' : 'xlsx';
  return baseFilename.replace(/\.xlsx$/, `_${rangeLabel}.${ext}`);
}

export function downloadReportRows(rows, baseFilename, sheetName, format, dateFrom, dateTo) {
  const filename = buildReportFilename(baseFilename, dateFrom, dateTo, format);
  if (format === 'csv') {
    downloadCsv(rows, filename);
  } else {
    downloadExcel(rows, filename, sheetName);
  }
}
