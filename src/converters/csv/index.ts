export function csvToJson(csvText: string): string {
  const lines = csvText.split(/\r?\n/);
  if (lines.length === 0 || !lines[0].trim()) return '[]';

  const parseRow = (line: string) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const row = parseRow(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      obj[header || `column_${idx}`] = row[idx] || '';
    });
    data.push(obj);
  }
  return JSON.stringify(data, null, 2);
}

export function jsonToCsv(jsonText: string): string {
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch (e) {
    throw new Error('Invalid JSON format');
  }

  if (!Array.isArray(data)) {
    // If it's a single object, wrap it in an array
    if (typeof data === 'object' && data !== null) {
      data = [data];
    } else {
      throw new Error('JSON must be an array of objects or a single object');
    }
  }

  if (data.length === 0) return '';
  
  // Get all unique keys from all objects
  const headerSet = new Set<string>();
  data.forEach((item: any) => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach(key => headerSet.add(key));
    }
  });
  
  const headers = Array.from(headerSet);
  if (headers.length === 0) return '';

  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] === undefined || row[header] === null ? '' : String(row[header]);
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}
