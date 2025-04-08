'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Building, Unit } from '@/lib/types';
import { buildingsApi, unitsApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Table, { TableColumn } from '@/components/ui/Table';
import { formatDate } from '@/lib/utils';

interface BuildingDetailPageProps {
  params: {
    id: string;
  };
}

export default function BuildingDetailPage({ params }: BuildingDetailPageProps) {
  const id = params.id;
  const router = useRouter();

  const [building, setBuilding] = useState<Building | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnitsLoading, setIsUnitsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch building details on component mount
  useEffect(() => {
    fetchBuilding();
  }, [id]);

  // Fetch building data
  const fetchBuilding = async () => {
    try {
      setIsLoading(true);
      const response = await buildingsApi.getById(id);

      if (response.success) {
        setBuilding(response.data);
        fetchUnits();
      } else {
        toast.error(response.message || 'Failed to fetch building details');
      }
    } catch (error) {
      console.error('Error fetching building:', error);
      toast.error('An error occurred while fetching building details');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch units for this building
  const fetchUnits = async () => {
    try {
      setIsUnitsLoading(true);
      const response = await unitsApi.getByBuildingId(id);

      if (response.success) {
        setUnits(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch building units');
      }
    } catch (error) {
      console.error('Error fetching units:', error);
      toast.error('An error occurred while fetching building units');
    } finally {
      setIsUnitsLoading(false);
    }
  };

  // Delete building
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await buildingsApi.delete(id);

      if (response.success) {
        toast.success('Building deleted successfully');
        router.push('/dashboard/buildings');
      } else {
        toast.error(response.message || 'Failed to delete building');
        setDeleteModalOpen(false);
      }
    } catch (error) {
      console.error('Error deleting building:', error);
      toast.error('An error occurred while deleting the building');
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Define columns for the units table
  const unitColumns: TableColumn<Unit>[] = [
    {
      key: 'unitNumber',
      header: 'Unit Number',
      cell: (unit) => <span className="font-medium text-gray-900">{unit.unitNumber}</span>,
    },
    {
      key: 'floor',
      header: 'Floor',
      cell: (unit) => <span className="text-gray-700">{unit.floor}</span>,
    },
    {
      key: 'area',
      header: 'Area (m²)',
      cell: (unit) => <span className="text-gray-700">{unit.area}</span>,
    },
    {
      key: 'bedrooms',
      header: 'Bedrooms',
      cell: (unit) => <span className="text-gray-700">{unit.bedrooms}</span>,
    },
    {
      key: 'bathrooms',
      header: 'Bathrooms',
      cell: (unit) => <span className="text-gray-700">{unit.bathrooms}</span>,
    },
    {
      key: 'price',
      header: 'Price',
      cell: (unit) => <span className="text-gray-900 font-medium">${unit.price}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (unit) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${unit.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }`}
        >
          {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (unit) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/units/${unit.id}`}>
            <Button size="sm" variant="outline">View</Button>
          </Link>
          <Link href={`/dashboard/units/${unit.id}/edit`}>
            <Button size="sm" variant="outline">Edit</Button>
          </Link>
        </div>
      ),
    },
  ];

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
          <p className="text-gray-600">Loading building details...</p>
        </div>
      </div>
    );
  }

  // Render not found state
  if (!building) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Building Not Found</h2>
        <p className="text-gray-600 mb-6">The building you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link href="/dashboard/buildings">
          <Button>Back to Buildings</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with breadcrumbs and actions */}
      <div className="flex flex-col space-y-4">
        <nav className="text-sm text-gray-500 mb-2">
          <ol className="flex space-x-2">
            <li>
              <Link href="/dashboard" className="hover:text-primary-600">Dashboard</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <Link href="/dashboard/buildings" className="hover:text-primary-600">Buildings</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">{building.name}</span>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{building.name}</h1>
          <div className="flex space-x-3">
            <Link href={`/dashboard/units/create?buildingId=${building.id}`}>
              <Button
                variant="primary"
                leftIcon={
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                Add Unit
              </Button>
            </Link>
            <Link href={`/dashboard/buildings/${building.id}/edit`}>
              <Button variant="outline">Edit Building</Button>
            </Link>
            <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>Delete</Button>
          </div>
        </div>
      </div>

      {/* Building Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Building Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Building Type</h3>
                <p className="mt-1 text-base text-gray-900 capitalize">
                  {building.buildingType}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Units</h3>
                <p className="mt-1 text-base text-gray-900">
                  {building.totalUnits}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Address</h3>
                <p className="mt-1 text-base text-gray-900">
                  {building.address}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                <p className="mt-1 text-base text-gray-900">
                  {formatDate(building.createdAt)}
                </p>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-base text-gray-900">
                  {building.description || 'No description provided'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Available Units</h3>
                <p className="mt-1 text-2xl font-semibold text-green-600">
                  {units.filter(unit => unit.status === 'available').length}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Rented Units</h3>
                <p className="mt-1 text-2xl font-semibold text-blue-600">
                  {units.filter(unit => unit.status === 'rented').length}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Units List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Units</h2>
          <Link href={`/dashboard/units/create?buildingId=${building.id}`}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              Add Unit
            </Button>
          </Link>
        </div>

        <Card>
          <Table
            data={units}
            columns={unitColumns}
            keyExtractor={(unit) => unit.id}
            isLoading={isUnitsLoading}
            emptyMessage="No units found for this building"
            onRowClick={(unit) => router.push(`/dashboard/units/${unit.id}`)}
          />
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Building"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
              disabled={isDeleting}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete the building "{building.name}"? This action cannot be undone.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
          <p className="text-sm font-medium">Warning</p>
          <p className="text-sm">Deleting this building will also delete all associated units and data. Any active reservations will be affected.</p>
        </div>
      </Modal>
    </div>
  );
}