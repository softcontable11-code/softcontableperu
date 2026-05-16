import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T, index: number) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  totals?: React.ReactNode;
  emptyMessage?: string;
  loading?: boolean;
  headerClassName?: string;
  rowClassName?: string;
}

export function DataTable<T>({ 
  columns, 
  data, 
  totals, 
  emptyMessage = "No hay datos disponibles.", 
  loading,
  headerClassName,
  rowClassName
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto bg-app-surface border border-app-border rounded-lg shadow-sm">
      <table className="w-full text-xs text-left border-collapse">
        <thead className="sticky top-0 z-20">
          <tr className={cn("bg-app-surface text-app-muted uppercase tracking-wider text-[10px] border-b border-app-border", headerClassName)}>
            {columns.map((col, i) => (
              <th key={i} className={cn("p-2.5 font-bold", i < columns.length - 1 && "border-r border-app-border/50", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={cn(
              "hover:bg-pld-blue/[0.04] transition-colors border-b border-app-border/30",
              i % 2 === 1 && "bg-app-hover/30",
              rowClassName
            )}>
              {columns.map((col, j) => (
                <td key={j} className={cn("p-2.5", j < columns.length - 1 && "border-r border-app-border/20", col.className)}>
                  {typeof col.accessor === 'function' ? col.accessor(row, i) : (row[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {totals && (
          <tfoot className="sticky bottom-0 z-20 font-black border-t-2 border-pld-blue/30 bg-app-surface">
            {totals}
          </tfoot>
        )}
      </table>
      {!loading && data.length === 0 && (
        <div className="p-16 text-center text-app-muted">
          <p className="text-xs font-bold uppercase tracking-widest opacity-50">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
