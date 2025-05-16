import { useState } from 'react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { ServiceOrder, ServiceType } from '@/lib/types';

interface ServiceListFilterProps {
  services: ServiceOrder[];
  onFilterChange: (filtered: ServiceOrder[]) => void;
}

export default function ServiceListFilter({ services, onFilterChange }: ServiceListFilterProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('newest');

  // Status options
  const statusOptions = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'in-progress', label: 'قيد التنفيذ' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'rejected', label: 'مرفوض' },
  ];

  // Service type options
  const typeOptions = [
    { value: 'all', label: 'جميع الأنواع' },
    { value: 'maintenance', label: 'صيانة' },
    { value: 'financial', label: 'مالي' },
    { value: 'administrative', label: 'إداري' },
  ];

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'الأحدث أولاً' },
    { value: 'oldest', label: 'الأقدم أولاً' },
    { value: 'status', label: 'حسب الحالة' },
  ];

  // Apply filters and sort whenever any filter changes
  const applyFilters = () => {
    let filtered = [...services];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(service => service.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(service => service.serviceType === typeFilter);
    }

    // Apply sorting
    if (sortOrder === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortOrder === 'status') {
      // Define a priority order for statuses
      const statusPriority: Record<string, number> = {
        'pending': 1,
        'in-progress': 2,
        'completed': 3,
        'rejected': 4,
      };
      
      filtered.sort((a, b) => {
        return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
      });
    }

    onFilterChange(filtered);
  };

  // Handle filter changes
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setTimeout(applyFilters, 0);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(e.target.value);
    setTimeout(applyFilters, 0);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value);
    setTimeout(applyFilters, 0);
  };

  // Reset all filters
  const resetFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setSortOrder('newest');
    setTimeout(() => onFilterChange(services), 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status Filter */}
        <Select
          id="statusFilter"
          name="statusFilter"
          label="تصفية حسب الحالة"
          value={statusFilter}
          onChange={handleStatusChange}
          options={statusOptions}
        />

        {/* Type Filter */}
        <Select
          id="typeFilter"
          name="typeFilter"
          label="تصفية حسب النوع"
          value={typeFilter}
          onChange={handleTypeChange}
          options={typeOptions}
        />

        {/* Sort Order */}
        <Select
          id="sortOrder"
          name="sortOrder"
          label="ترتيب حسب"
          value={sortOrder}
          onChange={handleSortChange}
          options={sortOptions}
        />

        {/* Reset Button */}
        <div className="flex items-end">
          <Button 
            variant="outline" 
            onClick={resetFilters}
            fullWidth
          >
            إعادة تعيين الفلاتر
          </Button>
        </div>
      </div>
    </div>
  );
}
