
/**
 * Convert array of objects to CSV format
 * Handles null/undefined values and escapes quotes
 */
export function toCsv(rows: any[]): string {
  if (!rows || rows.length === 0) {
    return '';
  }

  const headers = Object.keys(rows[0]);

  const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (
      stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n')
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  };

  const headerLine = headers.map(escapeCsvValue).join(',');

  const dataLines = rows.map((row) =>
    headers.map((header) => escapeCsvValue(row[header])).join(',')
  );

  return [headerLine, ...dataLines].join('\n');
}

/**
 * Generate CSV download response headers
 */
export function getCsvHeaders(filename: string): Record<string, string> {
  return {
    'Content-Type': 'text/csv',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'no-store',
  };
}
