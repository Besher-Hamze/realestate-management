import { ReactNode, useState, useMemo } from 'react';

// Simple className utility
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (item: T, index: number) => ReactNode;
  className?: string;
  // Optional sorting configuration - but columns are sortable by default
  sortable?: boolean;
  sortValue?: (item: T) => string | number | Date;
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

type SortState = {
  column: string | null;
  direction: 'asc' | 'desc';
};

// Smart value extraction and parsing
function getValueFromObject(obj: any, key: string): any {
  // Handle nested properties like 'unit.unitNumber' or 'user.fullName'
  const keys = key.split('.');
  let value = obj;

  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return null;
    }
  }

  return value;
}

// Enhanced value parsing for different data types
function parseForSorting(value: any): { type: 'date' | 'number' | 'text', parsed: any } {
  if (value === null || value === undefined) {
    return { type: 'text', parsed: '' };
  }

  // Handle Date objects
  if (value instanceof Date) {
    return { type: 'date', parsed: value.getTime() };
  }

  // Handle numbers
  if (typeof value === 'number') {
    return { type: 'number', parsed: value };
  }

  const stringValue = String(value).trim();

  // Try to parse as date (ISO format, common formats)
  if (stringValue.match(/^\d{4}-\d{2}-\d{2}/) || stringValue.match(/^\d{2}\/\d{2}\/\d{4}/)) {
    const dateValue = new Date(stringValue);
    if (!isNaN(dateValue.getTime())) {
      return { type: 'date', parsed: dateValue.getTime() };
    }
  }

  // Try to parse as number (including currencies, percentages)
  const cleanNumber = stringValue.replace(/[,\s$%]/g, '').replace(/[^\d.-]/g, '');
  if (cleanNumber && !isNaN(Number(cleanNumber))) {
    return { type: 'number', parsed: Number(cleanNumber) };
  }

  // Default to text sorting (case-insensitive)
  return { type: 'text', parsed: stringValue.toLowerCase() };
}

// Sort icon component
function SortIcon({ direction }: { direction: 'asc' | 'desc' | null }) {
  return (
    <span className="mr-2 inline-flex flex-col">
      <svg
        className={cn(
          'w-3 h-3 -mb-0.5',
          direction === 'asc' ? 'text-blue-600' : 'text-gray-300'
        )}
        fill="currentColor"
        viewBox="0 0 12 12"
      >
        <path d="M6 2l4 4H2l4-4z" />
      </svg>
      <svg
        className={cn(
          'w-3 h-3',
          direction === 'desc' ? 'text-blue-600' : 'text-gray-300'
        )}
        fill="currentColor"
        viewBox="0 0 12 12"
      >
        <path d="M6 10L2 6h8l-4 4z" />
      </svg>
    </span>
  );
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
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: 'asc'
  });

  // Handle column sorting
  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);

    // Skip sorting for action columns or if explicitly disabled
    if (column && column.sortable === false) return;
    if (columnKey === 'actions') return;

    setSortState(prev => {
      if (prev.column === columnKey) {
        // Same column - cycle through: asc -> desc -> none
        if (prev.direction === 'asc') {
          return { column: columnKey, direction: 'desc' };
        } else {
          return { column: null, direction: 'asc' };
        }
      } else {
        // New column - start with ascending
        return { column: columnKey, direction: 'asc' };
      }
    });
  };

  // Sort the data
  const sortedData = useMemo(() => {
    if (!sortState.column || !data.length) return data;

    const column = columns.find(col => col.key === sortState.column);
    if (!column) return data;

    const sorted = [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      // Use custom sort function if provided
      if (column.sortValue) {
        aValue = column.sortValue(a);
        bValue = column.sortValue(b);
      } else {
        // Auto-extract value using column key
        aValue = getValueFromObject(a, column.key);
        bValue = getValueFromObject(b, column.key);
      }

      // Parse values for comparison
      const aParsed = parseForSorting(aValue);
      const bParsed = parseForSorting(bValue);

      // Compare parsed values
      let result = 0;
      if (aParsed.parsed < bParsed.parsed) result = -1;
      else if (aParsed.parsed > bParsed.parsed) result = 1;

      return sortState.direction === 'desc' ? -result : result;
    });

    return sorted;
  }, [data, columns, sortState]);

  // Check if column should be sortable
  const isColumnSortable = (column: TableColumn<T>) => {
    return column.sortable !== false && column.key !== 'actions';
  };

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
          compact ? 'table-fixed' : 'table-auto',
        )}
      >
        {showHeader && (
          <thead className={cn('bg-gray-50', headerClassName)}>
            <tr>
              {columns.map((column) => {
                const sortable = isColumnSortable(column);
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      'px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider',
                      sortable && 'cursor-pointer hover:bg-gray-100 select-none transition-colors duration-150',
                      column.className
                    )}
                    onClick={() => sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center justify-end">
                      <span>{column.header}</span>
                      {sortable && (
                        <SortIcon
                          direction={sortState.column === column.key ? sortState.direction : null}
                        />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
        )}
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((item, index) => (
            <tr
              key={keyExtractor(item, index)}
              className={cn(
                striped && index % 2 === 0 ? 'bg-gray-50' : 'bg-white',
                onRowClick && 'cursor-pointer hover:bg-gray-100 transition-colors',
                rowClassName && rowClassName(item, index)
              )}
              onClick={onRowClick ? () => onRowClick(item, index) : undefined}
            >
              {columns.map((column) => (
                <td
                  key={`${keyExtractor(item, index)}-${column.key}`}
                  className={cn(
                    'px-6 whitespace-nowrap text-sm text-gray-500',
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

