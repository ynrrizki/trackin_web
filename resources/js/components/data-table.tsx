import { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { LucideIcon, FileWarning } from 'lucide-react';

export interface DataTableColumn<T> {
  key: string;               // unique key, can be path
  header: ReactNode;         // header label / node
  className?: string;        // optional th class
  cell?: (row: T) => ReactNode; // custom renderer
  accessor?: (row: T) => ReactNode; // fallback simple accessor
  width?: string;            // optional fixed width class e.g. 'w-32'
  align?: 'left' | 'right' | 'center';
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  /** Show skeleton rows when loading */
  loading?: boolean;
  /** number of skeleton rows */
  skeletonCount?: number;
  /** Optional extra header row (filters etc) */
  headerExtras?: ReactNode;
  /** Empty state icon */
  emptyIcon?: LucideIcon;
  /** Empty state title */
  emptyTitle?: ReactNode;
  /** Empty state description */
  emptyDescription?: ReactNode;
  /** ColSpan override for empty row */
  colSpan?: number;
  className?: string;
  tableClassName?: string;
}

/**
 * Generic reusable DataTable.
 * - Single place for empty state (icon + description)
 * - Skeleton rows for loading
 * - Simple column definition (header + cell renderer)
 */
export function DataTable<T>({
  data,
  columns,
  loading = false,
  skeletonCount = 5,
  headerExtras,
  emptyIcon: EmptyIcon = FileWarning,
  emptyTitle = 'Belum ada data',
  emptyDescription = 'Data akan muncul di sini setelah Anda menambahkannya.',
  colSpan,
  className,
  tableClassName,
}: DataTableProps<T>) {
  const totalColSpan = colSpan || columns.length || 1;

  return (
    <div className={cn('overflow-hidden rounded-lg border', className)}>
      <Table className={tableClassName}>
        <TableHeader>
          <TableRow>
            {columns.map(col => (
              <TableHead
                key={col.key}
                className={cn(col.className, col.width, col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
          {headerExtras}
        </TableHeader>
        <TableBody>
          {loading && Array.from({ length: skeletonCount }).map((_, i) => (
            <TableRow key={`skeleton-${i}`} className="animate-pulse">
              {columns.map(c => (
                <TableCell key={c.key} className="h-10">
                  <div className="h-3 w-3/4 rounded bg-muted" />
                </TableCell>
              ))}
            </TableRow>
          ))}

          {!loading && data.length === 0 && (
            <TableRow>
              <TableCell colSpan={totalColSpan} className="py-12 text-center">
                <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center gap-3 text-muted-foreground">
                  <div className="rounded-full border bg-background p-4 text-primary">
                    <EmptyIcon className="h-8 w-8" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-base font-medium text-foreground">{emptyTitle}</p>
                    <p className="text-xs leading-relaxed">{emptyDescription}</p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}

          {!loading && data.map((row, rIdx) => (
            <TableRow key={rIdx}>
              {columns.map(col => (
                <TableCell
                  key={col.key}
                  className={cn(
                    col.className,
                    col.width,
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center'
                  )}
                >
                  {col.cell ? col.cell(row) : col.accessor ? col.accessor(row) : null}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default DataTable;
