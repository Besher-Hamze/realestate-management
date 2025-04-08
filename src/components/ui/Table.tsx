import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (item: T, index: number) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (item: T, index: number) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  headerClassName?: string;
  rowClassName?: (item: T, index: number) => string | undefined;
  onRowClick?: (item: T, index: number) => void;
  showHeader?: boolean;
  striped?: boolean;
  bordered?: boolean;
  compact?: boolean;
}

export default function Table<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No data available',
  className,
  headerClassName,
  rowClassName,
  onRowClick,
  showHeader = true,
  striped = true,
  bordered = false,
  compact = false,
}: TableProps<T>) {
  // Loading state
  if (isLoading) {
    return (
      <div className="w-full py-8 flex justify-center items-center">
        <svg
          className="animate-spin h-8 w-8 text-gray-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="w-full py-8 text-center text-gray-500">{emptyMessage}</div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table
        className={cn(
          'min-w-full divide-y divide-gray-200',
          bordered && 'border border-gray-200',
          compact ? 'table-fixed' : 'table-auto'
        )}
      >
        {showHeader && (
          <thead className={cn('bg-gray-50', headerClassName)}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr
              key={keyExtractor(item, index)}
              className={cn(
                striped && index % 2 === 0 ? 'bg-gray-50' : 'bg-white',
                onRowClick && 'cursor-pointer hover:bg-gray-100',
                rowClassName && rowClassName(item, index)
              )}
              onClick={onRowClick ? () => onRowClick(item, index) : undefined}
            >
              {columns.map((column) => (
                <td
                  key={`${keyExtractor(item, index)}-${column.key}`}
                  className={cn(
                    'px-6 py-4 whitespace-nowrap text-sm text-gray-500',
                    compact ? 'py-2' : 'py-4',
                    column.className
                  )}
                >
                  {column.cell(item, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}