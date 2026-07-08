/** Parse CSV text into row objects keyed by normalized header names. */
export function parseCSV(text) {
  const lines = text.trim().split('\n').filter((l) => l.trim());
  if (lines.length < 2) throw new Error('File must have a header row and at least one data row.');

  const headers = lines[0]
    .split(',')
    .map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_'));

  return lines.slice(1).map((line, idx) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] || '').replace(/^"|"$/g, '');
    });
    row._row = idx + 2;
    return row;
  });
}

export function downloadCsvTemplate({ headers, exampleRows, filename }) {
  const header = headers.join(',');
  const examples = (exampleRows || []).map((row) =>
    headers.map((h) => {
      const val = row[h] ?? '';
      return String(val).includes(',') ? `"${val}"` : val;
    }).join(','),
  );
  const blob = new Blob([[header, ...examples].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
