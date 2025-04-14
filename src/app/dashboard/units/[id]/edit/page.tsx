'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Unit } from '@/lib/types';
import { unitsApi } from '@/lib/api';
import UnitForm from '@/components/units/UnitForm';

interface EditUnitPageProps {
  params: Promise<{
    id: string;
  }>;

}

export default function EditUnitPage({ params }: EditUnitPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [unit, setUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch unit details on component mount
  useEffect(() => {
    fetchUnit();
  }, [id]);

  // Fetch unit data
  const fetchUnit = async () => {
    try {
      setIsLoading(true);
      const response = await unitsApi.getById(id);

      if (response.success) {
        setUnit(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch unit details');
        router.push('/dashboard/units');
      }
    } catch (error) {
      console.error('Error fetching unit:', error);
      toast.error('An error occurred while fetching unit details');
      router.push('/dashboard/units');
    } finally {
      setIsLoading(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-10 w-10 text-primary-500 mb-4"
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
          <p className="text-gray-600">Loading unit details...</p>
        </div>
      </div>
    );
  }

  // Render not found state
  if (!unit) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Unit Not Found</h2>
        <p className="text-gray-600 mb-6">The unit you're looking for doesn't exist or you don't have permission to edit it.</p>
        <Link href="/dashboard/units">
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            Back to Units
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with breadcrumbs */}
      <div className="flex flex-col space-y-2">
        <nav className="text-sm text-gray-500 mb-2">
          <ol className="flex space-x-2">
            <li>
              <Link href="/dashboard" className="hover:text-primary-600">Dashboard</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <Link href="/dashboard/units" className="hover:text-primary-600">Units</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <Link href={`/dashboard/units/${id}`} className="hover:text-primary-600">{unit.unitNumber}</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">Edit</span>
            </li>
          </ol>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Edit Unit</h1>
        <p className="text-gray-600">Update the details for unit {unit.unitNumber}.</p>
      </div>

      {/* Unit Form */}
      <UnitForm
        isEdit
        initialData={unit}
        onSuccess={(updatedUnit) => {
          router.push(`/dashboard/units/${updatedUnit.id}`);
        }}
      />
    </div>
  );
}