'use client';

import { useMemo, useState } from 'react';
import { BarChart3, FileSpreadsheet, Upload } from 'lucide-react';

type Row = Record<string, string>;

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((value) => value.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((value) => value.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

export function ExcelChartGenerator() {
  const [rows, setRows] = useState<Row[]>([]);
  const columns = useMemo(() => Object.keys(rows[0] ?? {}), [rows]);

  async function handleUpload(file?: File) {
    if (!file) return;
    const text = await file.text();
    setRows(parseCsv(text));
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
        <div>
          <div className="flex items-center gap-2 font-black text-slate-950">
            <BarChart3 className="h-5 w-5 text-violet-700" /> Spreadsheet Quick View
          </div>
          <p className="mt-1 text-sm font-medium text-slate-600">Upload a CSV export to inspect columns and preview operational data before reporting.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-black text-white hover:bg-violet-800">
          <Upload className="h-4 w-4" /> Upload CSV
          <input className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => void handleUpload(event.target.files?.[0])} />
        </label>
      </div>
      {rows.length ? (
        <div className="overflow-x-auto p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-800"><FileSpreadsheet className="h-4 w-4" /> {rows.length} rows loaded</div>
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead><tr>{columns.map((column) => <th key={column} className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-left font-black text-slate-900">{column}</th>)}</tr></thead>
            <tbody>{rows.slice(0, 8).map((row, index) => <tr key={index}>{columns.map((column) => <td key={column} className="border-b border-slate-100 px-3 py-2 text-slate-700">{row[column]}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 text-sm font-medium text-slate-600">No spreadsheet loaded. Export CSV from your source system and upload it here for a quick preview.</div>
      )}
    </section>
  );
}
