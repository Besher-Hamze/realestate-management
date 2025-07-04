'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Building } from '@/lib/types';
import { buildingsApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import BuildingList from '@/components/buildings/BuildingList';
import { useAuth } from '@/contexts/AuthContext';

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      setIsLoading(true);
      const response = await buildingsApi.getAll();
      if (response.data) {
        setBuildings(response.data);
      } else {
        toast.error(response.message || 'فشل في جلب المباني');
      }
    } catch (error) {
      console.error('خطأ في جلب المباني:', error);
      toast.error('حدث خطأ أثناء جلب المباني');
    } finally {
      setIsLoading(false);
    }
  };

  // التعامل مع حذف المبنى
  const handleDelete = (id: number) => {
    setBuildings((prevBuildings) => prevBuildings.filter((building) => building.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* العنوان مع أزرار الإجراءات */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">المباني</h1>
        {canEdit && <Link href="/dashboard/buildings/create">
          <Button
            variant="primary"
            leftIcon={
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            إضافة مبنى
          </Button>
        </Link>}
      </div>

      {/* قائمة المباني */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <BuildingList
          buildings={buildings}
          isLoading={isLoading}
          onDelete={handleDelete}
          refetch={fetchBuildings}
        />
      </div>
    </div>
  );
}