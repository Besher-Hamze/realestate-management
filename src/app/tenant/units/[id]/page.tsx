'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Unit, Reservation, ServiceOrder } from '@/lib/types';
import { unitsApi, reservationsApi, servicesApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Table, { TableColumn } from '@/components/ui/Table';
import { formatDate, formatCurrency } from '@/lib/utils';

interface TenantUnitDetailPageProps {
  params: {
    id: string;
  };
}

export default function TenantUnitDetailPage({ params }: TenantUnitDetailPageProps) {
  const id = params.id;
  const router = useRouter();

  const [unit, setUnit] = useState<Unit | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isServiceOrdersLoading, setIsServiceOrdersLoading] = useState(true);

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
        fetchReservation();
      } else {
        toast.error(response.message || 'Failed to fetch unit details');
        router.push('/tenant/units');
      }
    } catch (error) {
      console.error('Error fetching unit:', error);
      toast.error('An error occurred while fetching unit details');
      router.push('/tenant/units');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch reservation for this unit
  const fetchReservation = async () => {
    try {
      const myReservationsResponse = await reservationsApi.getMy();

      if (myReservationsResponse.success) {
        // Find the active reservation for this unit
        const unitReservation = myReservationsResponse.data.find(
          res => res.unitId === parseInt(id) && res.status === 'active'
        );

        if (unitReservation) {
          setReservation(unitReservation);
          fetchServiceOrders(unitReservation.id);
        }
      } else {
        toast.error(myReservationsResponse.message || 'Failed to fetch reservation details');
      }
    } catch (error) {
      console.error('Error fetching reservation:', error);
      toast.error('An error occurred while fetching reservation details');
    }
  };

  // Fetch service orders for this reservation
  const fetchServiceOrders = async (reservationId: number) => {
    try {
      setIsServiceOrdersLoading(true);
      const response = await servicesApi.getByReservationId(reservationId);

      if (response.success) {
        setServiceOrders(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch service orders');
      }
    } catch (error) {
      console.error('Error fetching service orders:', error);
      toast.error('An error occurred while fetching service orders');
    } finally {
      setIsServiceOrdersLoading(false);
    }
  };

  // Define columns for the service orders table
  const serviceOrderColumns: TableColumn<ServiceOrder>[] = [
    {
      key: 'type',
      header: 'Type',
      cell: (serviceOrder) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 capitalize">{serviceOrder.serviceType}</span>
          <span className="text-xs text-gray-500 capitalize">{serviceOrder.serviceSubtype}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      cell: (serviceOrder) => (
        <div className="max-w-xs">
          <p className="text-gray-700 truncate">{serviceOrder.description}</p>
        </div>
      ),
    },
    {
      key: 'created',
      header: 'Submitted On',
      cell: (serviceOrder) => <span className="text-gray-700">{formatDate(serviceOrder.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (serviceOrder) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${serviceOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            serviceOrder.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
              serviceOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
            }`}
        >
          {serviceOrder.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (serviceOrder) => (
        <div className="flex space-x-2">
          <Link href={`/tenant/services/${serviceOrder.id}`}>
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
        <Link href="/tenant/units">
          <Button>Back to My Units</Button>
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
              <Link href="/tenant" className="hover:text-primary-600">Dashboard</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <Link href="/tenant/units" className="hover:text-primary-600">My Units</Link>
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
            <Link href={`/tenant/services/create?unitId=${unit.id}`}>
              <Button
                variant="primary"
                leftIcon={
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                Submit Service Request
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Unit Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Unit Information</h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                 ${unit.status === 'available' ? 'bg-green-100 text-green-800' :
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
                <h3 className="text-sm font-medium text-gray-500">Rent</h3>
                <p className="mt-1 text-base text-gray-900 font-medium">
                  {formatCurrency(unit.price)} / month
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

        {/* Lease Info */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lease Information</h2>

            {reservation ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="mt-1 text-base text-gray-900 capitalize">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reservation.status === 'active' ? 'bg-green-100 text-green-800' :
                        reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          reservation.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                        }`}
                    >
                      {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                    </span>
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                  <p className="mt-1 text-base text-gray-900">
                    {formatDate(reservation.startDate)}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                  <p className="mt-1 text-base text-gray-900">
                    {formatDate(reservation.endDate)}
                  </p>
                </div>

                {reservation.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                    <p className="mt-1 text-base text-gray-900">
                      {reservation.notes}
                    </p>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link href={`/tenant/services/create?unitId=${unit.id}&reservationId=${reservation.id}`}>
                      <Button variant="primary" fullWidth>
                        Submit Service Request
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">No active lease found for this unit.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Service Orders */}
      {reservation && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Service Requests</h2>
            <Link href={`/tenant/services/create?unitId=${unit.id}&reservationId=${reservation.id}`}>
              <Button
                variant="primary"
                size="sm"
                leftIcon={
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                New Request
              </Button>
            </Link>
          </div>

          <Card>
            <Table
              data={serviceOrders}
              columns={serviceOrderColumns}
              keyExtractor={(serviceOrder) => serviceOrder.id}
              isLoading={isServiceOrdersLoading}
              emptyMessage="No service requests found for this unit"
              onRowClick={(serviceOrder) => router.push(`/tenant/services/${serviceOrder.id}`)}
            />
          </Card>
        </div>
      )}
    </div>
  );
}