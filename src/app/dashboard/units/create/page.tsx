'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import UnitForm from '@/components/units/UnitForm';

export default function CreateUnitPage() {
  const searchParams = useSearchParams();
  const [buildingId, setBuildingId] = useState<number | undefined>(undefined);
  
  useEffect(() => {
    // Check if buildingId is provided in URL
    const buildingIdParam = searchParams.get('buildingId');
    if (buildingIdParam) {
      setBuildingId(parseInt(buildingIdParam, 10));
    }
  }, [searchParams]);

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
              <span className="text-gray-700">Create</span>
            </li>
          </ol>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Create New Unit</h1>
        <p className="text-gray-600">Add a new unit to a building.</p>
      </div>
      
      {/* Unit Form */}
      <UnitForm preSelectedBuildingId={buildingId} />
    </div>
  );
}