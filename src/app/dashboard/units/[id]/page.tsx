'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Unit, Reservation } from '@/lib/types';
import { unitsApi, reservationsApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Table, { TableColumn } from '@/components/ui/Table';
import { formatDate, formatCurrency } from '@/lib/utils';

interface UnitDetailPageProps {
  params: {
    id: string;
  };
}

export default function UnitDetailPage({ params }: UnitDetailPageProps) {
  const id = params.id;
  const router = useRouter();
  
  const [unit, setUnit] = useState<Unit | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReservationsLoading, setIsReservationsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        fetchReservations();
      } else {
        toast.error(response.message || 'Failed to fetch unit details');
      }
    } catch (error) {
      console.error('Error fetching unit:', error);
      toast.error('An error occurred while fetching unit details');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch reservations for this unit
  const fetchReservations = async () => {
    try {
      setIsReservationsLoading(true);
      const response = await reservationsApi.getByUnitId(id);
      
      if (response.success) {
        setReservations(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch unit reservations');
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('An error occurred while fetching unit reservations');
    } finally {
      setIsReservationsLoading(false);
    }
  };

  // Delete unit
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await unitsApi.delete(id);
      
      if (response.success) {
        toast.success('Unit deleted successfully');
        router.push('/dashboard/units');
      } else {
        toast.error(response.message || 'Failed to delete unit');
        setDeleteModalOpen(false);
      }
    } catch (error) {
      console.error('Error deleting unit:', error);
      toast.error('An error occurred while deleting the unit');
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Change unit status
  const handleStatusChange = async (newStatus: string) => {
    if (!unit) return;
    
    try {
      const response = await unitsApi.update(id, { ...unit, status: newStatus });
      
      if (response.success) {
        toast.success(`Unit status updated to ${newStatus}`);
        setUnit(response.data);
      } else {
        toast.error(response.message || 'Failed to update unit status');
      }
    } catch (error) {
      console.error('Error updating unit status:', error);
      toast.error('An error occurred while updating unit status');
    }
  };

  // Define columns for the reservations table
  const reservationColumns: TableColumn<Reservation>[] = [
    {
      key: 'tenant',
      header: 'Tenant',
      cell: (reservation) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{reservation.user?.fullName || 'N/A'}</span>
          <span className="text-xs text-gray-500">{reservation.user?.email || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      cell: (reservation) => (
        <div className="flex flex-col">
          <span className="text-gray-900">{formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (reservation) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            reservation.status === 'active' ? 'bg-green-100 text-green-800' :
            reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            reservation.status === 'expired' ? 'bg-gray-100 text-gray-800' :
            'bg-red-100 text-red-800'
          }`}
        >
          {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (reservation) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/reservations/${reservation.id}`}>
            <Button size="sm" variant="outline">View</Button>
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
        <p className="text-gray-600 mb-6">The unit you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link href="/dashboard/units">
          <Button>Back to Units</Button>
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
              <Link href="/dashboard/units" className="hover:text-primary-600">Units</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">{unit.unitNumber}</span>
            </li>
          </ol>
        </nav>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Unit {unit.unitNumber}</h1>
          <div className="flex space-x-3">
            <Link href={`/dashboard/reservations/create?unitId=${unit.id}`}>
              <Button
                variant="primary"
                leftIcon={
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                Create Reservation
              </Button>
            </Link>
            <Link href={`/dashboard/units/${unit.id}/edit`}>
              <Button variant="outline">Edit Unit</Button>
            </Link>
            <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>Delete</Button>
          </div>
        </div>
      </div>
      
      {/* Unit Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Unit Information</h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  unit.status === 'available' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800' 
                }`}
              >
                {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Building</h3>
                <p className="mt-1 text-base text-gray-900">
                  {unit.building?.name || 'N/A'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Floor</h3>
                <p className="mt-1 text-base text-gray-900">
                  {unit.floor}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Area</h3>
                <p className="mt-1 text-base text-gray-900">
                  {unit.area} m²
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Price</h3>
                <p className="mt-1 text-base text-gray-900 font-medium">
                  {formatCurrency(unit.price)}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Bedrooms</h3>
                <p className="mt-1 text-base text-gray-900">
                  {unit.bedrooms}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Bathrooms</h3>
                <p className="mt-1 text-base text-gray-900">
                  {unit.bathrooms}
                </p>
              </div>
              
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-base text-gray-900">
                  {unit.description || 'No description provided'}
                </p>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Status Actions */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Status</h2>
            
            <div className="space-y-4">
              <Button
                variant="success"
                fullWidth
                disabled={unit.status === 'available'}
                onClick={() => handleStatusChange('available')}
              >
                Mark as Available
              </Button>
              
              <Button
                variant="info"
                fullWidth
                disabled={unit.status === 'rented'}
                onClick={() => handleStatusChange('rented')}
              >
                Mark as Rented
              </Button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-3">Quick Links</h3>
              <div className="space-y-3">
                <Link href={`/dashboard/reservations/create?unitId=${unit.id}`}>
                  <Button variant="primary" fullWidth>
                    Create Reservation
                  </Button>
                </Link>
                {unit.building && (
                  <Link href={`/dashboard/buildings/${unit.building.id}`}>
                    <Button variant="outline" fullWidth>
                      View Building
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Reservations History */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Reservation History</h2>
          <Link href={`/dashboard/reservations/create?unitId=${unit.id}`}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              Create Reservation
            </Button>
          </Link>
        </div>
        
        <Card>
          <Table
            data={reservations}
            columns={reservationColumns}
            keyExtractor={(reservation) => reservation.id}
            isLoading={isReservationsLoading}
            emptyMessage="No reservation history found for this unit"
            onRowClick={(reservation) => router.push(`/dashboard/reservations/${reservation.id}`)}
          />
        </Card>
      </div>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Unit"
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
          Are you sure you want to delete unit "{unit.unitNumber}"? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}