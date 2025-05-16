'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { RealEstateUnit, UnitStatus, Building } from '@/lib/types';
import { unitsApi, buildingsApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import UnitList from '@/components/units/UnitList';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import { UNIT_STATUS_OPTIONS, UNIT_TYPE_OPTIONS } from '@/constants/options';

export default function UnitsPage() {
  const [units, setUnits] = useState<RealEstateUnit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<RealEstateUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);

  // خيارات تصفية الحالة
  const statusOptions = [
    { value: 'all', label: 'جميع الحالات' },
    ...UNIT_STATUS_OPTIONS
  ];

  // خيارات تصفية نوع الوحدة
  const typeOptions = [
    { value: 'all', label: 'جميع الأنواع' },
    ...UNIT_TYPE_OPTIONS
  ];

  // جلب الوحدات والمباني عند تحميل المكون
  useEffect(() => {
    fetchUnits();
    fetchBuildings();
  }, []);

  // تطبيق التصفية عند تغيير الوحدات أو مرشحات التصفية
  useEffect(() => {
    applyFilters();
  }, [units, statusFilter, typeFilter, buildingFilter]);

  // جلب بيانات الوحدات
  const fetchUnits = async () => {
    try {
      setIsLoading(true);
      const response = await unitsApi.getAll();

      if (response.success) {
        setUnits(response.data);
      } else {
        toast.error(response.message || 'فشل في جلب الوحدات');
      }
    } catch (error) {
      console.error('خطأ في جلب الوحدات:', error);
      toast.error('حدث خطأ أثناء جلب الوحدات');
    } finally {
      setIsLoading(false);
    }
  };

  // جلب بيانات المباني
  const fetchBuildings = async () => {
    try {
      setIsLoadingBuildings(true);
      const response = await buildingsApi.getAll();

      if (response.success) {
        setBuildings(response.data);
      } else {
        toast.error(response.message || 'فشل في جلب المباني');
      }
    } catch (error) {
      console.error('خطأ في جلب المباني:', error);
      toast.error('حدث خطأ أثناء جلب المباني');
    } finally {
      setIsLoadingBuildings(false);
    }
  };

  // إنشاء خيارات المباني للقائمة المنسدلة
  const buildingOptions = [
    { value: 'all', label: 'جميع المباني' },
    ...buildings.map((building) => ({
      value: building.id.toString(),
      label: `${building.buildingNumber} - ${building.name}`,
    }))
  ];

  // تطبيق التصفية على الوحدات
  const applyFilters = () => {
    let filtered = [...units];

    // تطبيق تصفية الحالة
    if (statusFilter !== 'all') {
      filtered = filtered.filter((unit) => unit.status === statusFilter);
    }

    // تطبيق تصفية نوع الوحدة
    if (typeFilter !== 'all') {
      filtered = filtered.filter((unit) => unit.unitType === typeFilter);
    }

    // تطبيق تصفية المبنى
    if (buildingFilter !== 'all') {
      filtered = filtered.filter((unit) => unit.buildingId.toString() === buildingFilter);
    }

    setFilteredUnits(filtered);
  };

  // التعامل مع تغيير تصفية الحالة
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  // التعامل مع تغيير تصفية نوع الوحدة
  const handleTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(e.target.value);
  };

  // التعامل مع تغيير تصفية المبنى
  const handleBuildingFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBuildingFilter(e.target.value);
  };

  // التعامل مع حذف الوحدة
  const handleDelete = (id: number) => {
    setUnits((prevUnits) => prevUnits.filter((unit) => unit.id !== id));
  };

  // بطاقات الإحصائيات
  const getStatusCount = (status: UnitStatus) => {
    return units.filter(unit => unit.status === status).length;
  };

  return (
    <div className="space-y-6">
      {/* الترويسة مع أزرار الإجراءات */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">الوحدات العقارية</h1>
        <Link href="/dashboard/units/create">
          <Button
            variant="primary"
            leftIcon={
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            إضافة وحدة
          </Button>
        </Link>
      </div>

      {/* بطاقات ملخص الحالة */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-green-800">متاحة</h3>
                <p className="text-2xl font-bold text-green-900">{getStatusCount('available')}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-blue-800">مؤجرة</h3>
                <p className="text-2xl font-bold text-blue-900">{getStatusCount('rented')}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-yellow-800">تحت الصيانة</h3>
                <p className="text-2xl font-bold text-yellow-900">{getStatusCount('maintenance')}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* المرشحات */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="w-full">
            <Select
              label="الحالة"
              id="statusFilter"
              name="statusFilter"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              options={statusOptions}
              fullWidth
            />
          </div>
          <div className="w-full">
            <Select
              label="نوع الوحدة"
              id="typeFilter"
              name="typeFilter"
              value={typeFilter}
              onChange={handleTypeFilterChange}
              options={typeOptions}
              fullWidth
            />
          </div>
          <div className="w-full">
            <Select
              label="المبنى"
              id="buildingFilter"
              name="buildingFilter"
              value={buildingFilter}
              onChange={handleBuildingFilterChange}
              options={buildingOptions}
              disabled={isLoadingBuildings}
              fullWidth
              helpText={isLoadingBuildings ? 'جاري تحميل المباني...' : undefined}
            />
          </div>
        </div>
      </div>

      {/* قائمة الوحدات */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <UnitList
          units={filteredUnits}
          isLoading={isLoading}
          onDelete={handleDelete}
          refetch={fetchUnits}
        />
      </div>
    </div>
  );
}