// ServiceListFilter.tsx
import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { ServiceOrder, ServiceType } from '@/lib/types';

// Fixed serviceSubtypeOptions with correct values
const serviceSubtypeOptions: Record<ServiceType, { value: string; label: string }[]> = {
  maintenance: [
    { value: 'electrical', label: 'كهربائي' },
    { value: 'plumbing', label: 'سباكة' },
    { value: 'hvac', label: 'تكييف وتدفئة' },
    { value: 'appliance', label: 'أجهزة منزلية' },
    { value: 'structural', label: 'هيكلي' },
    { value: 'general', label: 'عام' },
    { value: 'general_cleaning', label: 'تنظيف عام' },
    { value: 'deep', label: 'تنظيف عميق' },
    { value: 'windows', label: 'تنظيف نوافذ' },
    { value: 'carpets', label: 'تنظيف سجاد' },
  ],
  financial: [
    { value: 'postpone_payment', label: 'تأجيل دفعة' },
    { value: 'advance_payment', label: 'تقديم دفعة' },
    { value: 'replace_check', label: 'استبدال شيك' },
    { value: 'other_financial', label: 'أخرى (مالية)' },
  ],
  administrative: [
    { value: 'cancel_contract', label: 'إلغاء عقد' },
    { value: 'renew_contract', label: 'تجديد عقد' },
    { value: 'change_unit', label: 'استبدال وحدة' },
    { value: 'eviction', label: 'إخلاء' },
    { value: 'other_administrative', label: 'أخرى (إدارية)' },
  ],
};

interface ServiceListFilterProps {
  services: ServiceOrder[];
  onFilterChange: (filtered: ServiceOrder[]) => void;
}

export function ServiceListFilter({ services, onFilterChange }: ServiceListFilterProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [subtypeFilter, setSubtypeFilter] = useState<string>('all');
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
    { value: 'type', label: 'حسب النوع' },
  ];

  // Get subtype options based on selected type
  const getSubtypeOptions = () => {
    if (typeFilter === 'all') return [];
    return [
      { value: 'all', label: 'جميع الأنواع الفرعية' },
      ...(serviceSubtypeOptions[typeFilter as ServiceType] || [])
    ];
  };

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

    // Apply subtype filter
    if (subtypeFilter !== 'all') {
      filtered = filtered.filter(service => service.serviceSubtype === subtypeFilter);
    }

    // Apply sorting
    if (sortOrder === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortOrder === 'status') {
      const statusPriority: Record<string, number> = {
        'pending': 1,
        'in-progress': 2,
        'completed': 3,
        'rejected': 4,
      };
      filtered.sort((a, b) => {
        return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
      });
    } else if (sortOrder === 'type') {
      filtered.sort((a, b) => a.serviceType.localeCompare(b.serviceType));
    }

    onFilterChange(filtered);
  };

  // Apply filters whenever any filter changes
  useEffect(() => {
    applyFilters();
  }, [statusFilter, typeFilter, subtypeFilter, sortOrder, services]);

  // Handle filter changes
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(e.target.value);
    setSubtypeFilter('all'); // Reset subtype when type changes
  };

  const handleSubtypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSubtypeFilter(e.target.value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value);
  };

  // Reset all filters
  const resetFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setSubtypeFilter('all');
    setSortOrder('newest');
  };

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all' || subtypeFilter !== 'all';

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border">
      <h3 className="text-sm font-medium text-gray-700 mb-3">فلترة وترتيب النتائج</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">


        {/* Type Filter */}
        <Select
          id="typeFilter"
          name="typeFilter"
          label="نوع الخدمة"
          value={typeFilter}
          onChange={handleTypeChange}
          options={typeOptions}
        />

        {/* Subtype Filter */}
        <Select
          id="subtypeFilter"
          name="subtypeFilter"
          label="النوع الفرعي"
          value={subtypeFilter}
          onChange={handleSubtypeChange}
          options={getSubtypeOptions()}
          disabled={typeFilter === 'all'}
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
            disabled={!hasActiveFilters}
          >
            إعادة تعيين
          </Button>
        </div>
      </div>

      {/* Filter Summary */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {hasActiveFilters ? (
            <span>تم تطبيق فلاتر نشطة</span>
          ) : (
            <span>عرض جميع النتائج</span>
          )}
        </div>
        <div className="text-sm text-gray-500">
          المجموع: {services.length} طلب
        </div>
      </div>
    </div>
  );
}
