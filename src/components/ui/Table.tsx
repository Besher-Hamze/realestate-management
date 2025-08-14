import { ReactNode, useState, useMemo, useCallback } from 'react';

// Utility function for combining class names
function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (item: T, index: number) => ReactNode;
  className?: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'select' | 'date' | 'number';
  filterOptions?: { value: string; label: string; }[];
  sortValue?: (item: T) => string | number | Date;
  filterValue?: (item: T) => string;
  width?: string;
}

interface FilterState {
  [key: string]: string;
}

interface SortState {
  column: string | null;
  direction: 'asc' | 'desc';
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
  searchable?: boolean;
  searchPlaceholder?: string;
  showFilters?: boolean;
  initialSort?: { column: string; direction: 'asc' | 'desc' };
  pageSize?: number;
  showPagination?: boolean;
}

// Helper function to safely get nested values
function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return null;

  try {
    return path.split('.').reduce((current, key) => {
      if (current === null || current === undefined) return null;

      // Handle array notation like 'items[0]'
      if (key.includes('[') && key.includes(']')) {
        const arrayKey = key.substring(0, key.indexOf('['));
        const indexStr = key.substring(key.indexOf('[') + 1, key.indexOf(']'));
        const index = parseInt(indexStr);

        if (current[arrayKey] && Array.isArray(current[arrayKey]) && !isNaN(index)) {
          return current[arrayKey][index];
        }
        return null;
      }

      return current[key];
    }, obj);
  } catch {
    return null;
  }
}

// Extract text from JSX/React elements
function extractTextFromJSX(element: any): string {
  if (typeof element === 'string' || typeof element === 'number') {
    return String(element);
  }

  if (element && typeof element === 'object') {
    if (element.props) {
      if (typeof element.props.children === 'string' || typeof element.props.children === 'number') {
        return String(element.props.children);
      }

      if (Array.isArray(element.props.children)) {
        return element.props.children
          .map((child: any) => extractTextFromJSX(child))
          .filter(Boolean)
          .join(' ');
      }

      if (element.props.children) {
        return extractTextFromJSX(element.props.children);
      }
    }
  }

  return '';
}

// Normalize values for consistent comparison
function normalizeValue(value: any): any {
  if (value === null || value === undefined) return '';

  // Handle dates
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string' && !isNaN(Date.parse(value)) && value.includes('-')) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date.getTime();
  }

  // Handle numbers
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value.replace(/[^\d.-]/g, ''));
    if (!isNaN(num)) return num;
  }

  // Handle booleans
  if (typeof value === 'boolean') return value ? 1 : 0;

  // Handle objects
  if (typeof value === 'object') {
    if (value.name) return String(value.name).toLowerCase();
    if (value.title) return String(value.title).toLowerCase();
    if (value.label) return String(value.label).toLowerCase();
    if (value.value) return normalizeValue(value.value);
    return JSON.stringify(value).toLowerCase();
  }

  // Default to string
  return String(value).toLowerCase();
}

// Universal sort value extraction - robust and flexible
function getSortValue<T>(item: T, column: TableColumn<T>): any {
  try {
    // 1. Custom sort function (highest priority)
    if (column.sortValue) {
      return normalizeValue(column.sortValue(item));
    }

    // 2. Try direct property access
    const directValue = (item as any)[column.key];
    if (directValue !== undefined && directValue !== null) {
      return normalizeValue(directValue);
    }

    // 3. Try nested property access
    if (column.key.includes('.')) {
      const nestedValue = getNestedValue(item, column.key);
      if (nestedValue !== undefined && nestedValue !== null) {
        return normalizeValue(nestedValue);
      }
    }

    // 4. Try to extract from cell content
    try {
      const cellContent = column.cell(item, 0);

      if (typeof cellContent === 'string' || typeof cellContent === 'number') {
        return normalizeValue(cellContent);
      }

      // Extract text from JSX
      const text = extractTextFromJSX(cellContent);
      if (text) return normalizeValue(text);
    } catch {
      // Ignore cell extraction errors
    }

    // 5. Try all possible property names that might match
    const possibleKeys = [
      column.key.toLowerCase(),
      column.key.replace(/([A-Z])/g, '_$1').toLowerCase(),
      column.key.replace(/_/g, ''),
      `${column.key}Name`,
      `${column.key}Value`,
      `${column.key}Text`
    ];

    for (const key of possibleKeys) {
      const value = (item as any)[key];
      if (value !== undefined && value !== null) {
        return normalizeValue(value);
      }
    }

    return '';
  } catch (error) {
    return '';
  }
}

// Universal filter value extraction
function getFilterValue<T>(item: T, column: TableColumn<T>): string {
  try {
    // 1. Custom filter function
    if (column.filterValue) {
      return String(column.filterValue(item));
    }

    // 2. Use the same logic as sort value but convert to string
    const sortValue = getSortValue(item, column);
    return String(sortValue);
  } catch {
    return '';
  }
}

// Sort icon component
function SortIcon({ direction }: { direction: 'asc' | 'desc' | null }) {
  return (
    <div className="flex flex-col ml-1">
      <svg
        className={cn(
          'w-3 h-3 -mb-1',
          direction === 'asc' ? 'text-blue-600' : 'text-gray-400'
        )}
        fill="currentColor"
        viewBox="0 0 12 12"
      >
        <path d="M6 2l4 4H2l4-4z" />
      </svg>
      <svg
        className={cn(
          'w-3 h-3',
          direction === 'desc' ? 'text-blue-600' : 'text-gray-400'
        )}
        fill="currentColor"
        viewBox="0 0 12 12"
      >
        <path d="M6 10L2 6h8l-4 4z" />
      </svg>
    </div>
  );
}

// Search input component
function SearchInput({
  value,
  onChange,
  placeholder = "Search..."
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative mb-4">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// Filter input component
function FilterInput<T>({
  column,
  value,
  onChange,
  data
}: {
  column: TableColumn<T>;
  value: string;
  onChange: (value: string) => void;
  data: T[];
}) {
  if (column.filterType === 'select' || column.filterOptions) {
    const options = column.filterOptions || [
      ...new Set(data.map(item => getFilterValue(item, column)).filter(Boolean))
    ].map(val => ({ value: val, label: val }));

    return (
      <select
        className="block w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={column.filterType || 'text'}
      className="block w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      placeholder={`Filter ${String(column.header)}...`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// Pagination component
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
}) {
  const pages = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      <div className="flex justify-between items-center w-full">
        <div className="text-sm text-gray-700">
          Showing {startItem} to {endItem} of {totalItems} results
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {pages.map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                'px-3 py-1 text-sm border rounded',
                page === currentPage
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'border-gray-300 hover:bg-gray-50'
              )}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
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
  searchable = false,
  searchPlaceholder = "Search...",
  showFilters = false,
  initialSort,
  pageSize,
  showPagination = false
}: TableProps<T>) {
  const [sortState, setSortState] = useState<SortState>({
    column: initialSort?.column || null,
    direction: initialSort?.direction || 'asc'
  });

  const [filters, setFilters] = useState<FilterState>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Handle sorting with error protection
  const handleSort = useCallback((columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column || column.sortable === false || columnKey === 'actions') return;

    setSortState(prev => {
      if (prev.column === columnKey) {
        // Cycle: asc -> desc -> none
        if (prev.direction === 'asc') {
          return { column: columnKey, direction: 'desc' };
        } else {
          return { column: null, direction: 'asc' };
        }
      } else {
        // New column - start with asc
        return { column: columnKey, direction: 'asc' };
      }
    });
  }, [columns]);

  // Handle filtering
  const handleFilterChange = useCallback((columnKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  // Process data: filter, search, sort - with comprehensive error handling
  const processedData = useMemo(() => {
    try {
      let result = [...data];

      // Apply search
      if (searchable && searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        result = result.filter(item => {
          try {
            return columns.some(column => {
              try {
                const value = getFilterValue(item, column);
                return value.toLowerCase().includes(searchLower);
              } catch {
                return false;
              }
            });
          } catch {
            return false;
          }
        });
      }

      // Apply column filters
      if (showFilters) {
        Object.entries(filters).forEach(([columnKey, filterValue]) => {
          if (filterValue) {
            const column = columns.find(col => col.key === columnKey);
            if (column) {
              result = result.filter(item => {
                try {
                  const itemValue = getFilterValue(item, column);

                  if (column.filterType === 'select') {
                    return itemValue === filterValue;
                  }

                  return itemValue.toLowerCase().includes(filterValue.toLowerCase());
                } catch {
                  return false;
                }
              });
            }
          }
        });
      }

      // Apply sorting with robust error handling
      if (sortState.column) {
        const column = columns.find(col => col.key === sortState.column);
        if (column) {
          result.sort((a, b) => {
            try {
              const aValue = getSortValue(a, column);
              const bValue = getSortValue(b, column);

              // Handle null/undefined/empty values
              if (aValue === '' && bValue === '') return 0;
              if (aValue === '') return 1;
              if (bValue === '') return -1;

              // Compare values
              let comparison = 0;
              if (typeof aValue === typeof bValue) {
                if (aValue < bValue) comparison = -1;
                else if (aValue > bValue) comparison = 1;
              } else {
                comparison = String(aValue).localeCompare(String(bValue));
              }

              return sortState.direction === 'asc' ? comparison : -comparison;
            } catch (error) {
              // If sorting fails, maintain original order
              return 0;
            }
          });
        }
      }

      return result;
    } catch (error) {
      // If everything fails, return original data
      console.warn('Data processing failed, returning original data:', error);
      return data;
    }
  }, [data, columns, searchTerm, filters, sortState, searchable, showFilters]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!showPagination || !pageSize) return processedData;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return processedData.slice(startIndex, endIndex);
  }, [processedData, currentPage, pageSize, showPagination]);

  const totalPages = pageSize ? Math.ceil(processedData.length / pageSize) : 1;

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full py-12 flex justify-center items-center">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Search */}
      {searchable && (
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={searchPlaceholder}
        />
      )}

      {/* Table */}
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className={cn(
          'min-w-full divide-y divide-gray-200',
          bordered && 'border border-gray-200'
        )}>
          {showHeader && (
            <thead className={cn('bg-gray-50', headerClassName)}>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                      column.sortable !== false && column.key !== 'actions' && 'cursor-pointer hover:bg-gray-100 select-none',
                      column.className
                    )}
                    style={column.width ? { width: column.width } : undefined}
                    onClick={() => column.key !== 'actions' && handleSort(column.key)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{column.header}</span>
                      {column.sortable !== false && column.key !== 'actions' && (
                        <SortIcon
                          direction={sortState.column === column.key ? sortState.direction : null}
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>

              {/* Filter row */}
              {showFilters && (
                <tr className="bg-gray-25">
                  {columns.map((column) => (
                    <th key={`filter-${column.key}`} className="px-6 py-2">
                      {column.filterable !== false && column.key !== 'actions' ? (
                        <FilterInput
                          column={column}
                          value={filters[column.key] || ''}
                          onChange={(value) => handleFilterChange(column.key, value)}
                          data={data}
                        />
                      ) : null}
                    </th>
                  ))}
                </tr>
              )}
            </thead>
          )}

          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr
                  key={keyExtractor(item, index)}
                  className={cn(
                    striped && index % 2 === 0 ? 'bg-gray-50' : 'bg-white',
                    onRowClick && 'cursor-pointer hover:bg-blue-50 transition-colors duration-150',
                    rowClassName?.(item, index)
                  )}
                  onClick={onRowClick ? () => onRowClick(item, index) : undefined}
                >
                  {columns.map((column) => (
                    <td
                      key={`${keyExtractor(item, index)}-${column.key}`}
                      className={cn(
                        'px-6 whitespace-nowrap text-sm text-gray-900',
                        compact ? 'py-2' : 'py-4',
                        column.className
                      )}
                    >
                      {column.cell(item, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && pageSize && processedData.length > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          totalItems={processedData.length}
        />
      )}
    </div>
  );
}