/**
 * DataTable — Unified sortable table for all portal data views.
 *
 * Replaces one-off table implementations across admin, employer, staff, and instructor portals.
 * Handles loading skeletons, empty state, sorting, and row click.
 *
 * Usage:
 *   <DataTable
 *     columns={[
 *       { key: 'name', label: 'Name', sortable: true },
 *       { key: 'status', label: 'Status', render: (row) => <Badge>{row.status}</Badge> },
 *     ]}
 *     rows={students}
 *     loading={isLoading}
 *     onRowClick={(row) => router.push(`/students/${row.id}`)}
 *     emptyMessage="No students enrolled yet."
 *   />
 */

'use client';

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from './EmptyState';

export interface DataTableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  /** Custom cell renderer. Receives the full row object. */
  render?: (row: T) => React.ReactNode;
  /** Tailwind classes applied to both th and td for this column */
  className?: string;
  /** Tailwind classes applied to th only */
  headerClassName?: string;
}

interface DataTableProps<T extends { id?: string | number }> {
  columns: DataTableColumn<T>[];
  rows: T[];
  loading?: boolean;
  /** Number of skeleton rows shown while loading */
  skeletonRows?: number;
  emptyMessage?: string;
  emptyTitle?: string;
  onRowClick?: (row: T) => void;
  /** Tailwind class for the table wrapper */
  className?: string;
  /** Default sort column key */
  defaultSortKey?: string;
  defaultSortDir?: 'asc' | 'desc';
  /** Controlled sort — if provided, disables internal sort state */
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string, dir: 'asc' | 'desc') => void;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  rows,
  loading = false,
  skeletonRows = 5,
  emptyMessage,
  emptyTitle,
  onRowClick,
  className,
  defaultSortKey,
  defaultSortDir = 'asc',
  sortKey: controlledSortKey,
  sortDir: controlledSortDir,
  onSort,
}: DataTableProps<T>) {
  const [internalSortKey, setInternalSortKey] = useState<string | undefined>(defaultSortKey);
  const [internalSortDir, setInternalSortDir] = useState<'asc' | 'desc'>(defaultSortDir);

  const isControlled = controlledSortKey !== undefined;
  const activeSortKey = isControlled ? controlledSortKey : internalSortKey;
  const activeSortDir = isControlled ? (controlledSortDir ?? 'asc') : internalSortDir;

  function handleSort(key: string) {
    const newDir = activeSortKey === key && activeSortDir === 'asc' ? 'desc' : 'asc';
    if (isControlled) {
      onSort?.(key, newDir);
    } else {
      setInternalSortKey(key);
      setInternalSortDir(newDir);
    }
  }

  const sortedRows = useMemo(() => {
    if (!activeSortKey || isControlled) return rows;
    return [...rows].sort((a, b) => {
      const av = (a as Record<string, unknown>)[activeSortKey];
      const bv = (b as Record<string, unknown>)[activeSortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return activeSortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, activeSortKey, activeSortDir, isControlled]);

  return (
    <div className={cn('w-full overflow-x-auto rounded-xl border border-slate-200', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap',
                  col.sortable && 'cursor-pointer select-none hover:text-slate-900',
                  col.className,
                  col.headerClassName,
                )}
                onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    activeSortKey === String(col.key) ? (
                      activeSortDir === 'asc'
                        ? <ChevronUp className="w-3.5 h-3.5 text-brand-blue-600" />
                        : <ChevronDown className="w-3.5 h-3.5 text-brand-blue-600" />
                    ) : (
                      <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                    )
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {columns.map((col) => (
                  <td key={String(col.key)} className={cn('px-4 py-3', col.className)}>
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : sortedRows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState
                  title={emptyTitle}
                  description={emptyMessage}
                  className="py-12"
                />
              </td>
            </tr>
          ) : (
            sortedRows.map((row, i) => (
              <tr
                key={row.id ?? i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-slate-50',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn('px-4 py-3 text-slate-700', col.className)}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[String(col.key)] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
