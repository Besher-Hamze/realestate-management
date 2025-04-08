'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Reservation, ServiceOrder, Payment } from '@/lib/types';
import { reservationsApi, servicesApi, paymentsApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Table, { TableColumn } from '@/components/ui/Table';
import { formatDate, formatCurrency } from '@/lib/utils';

interface ReservationDetailPageProps {
  params: {
    id: string;
  };
}

export default function ReservationDetailPage({ params }: ReservationDetailPageProps) {
  const id = params.id;
  const router = useRouter();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isServicesLoading, setIsServicesLoading] = useState(true);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch reservation details on component mount
  useEffect(() => {
    fetchReservation();
  }, [id]);

  // Fetch reservation data
  const fetchReservation = async () => {
    try {
      setIsLoading(true);
      const response = await reservationsApi.getById(id);

      if (response.success) {
        setReservation(response.data);
        fetchServiceOrders(response.data.id);
        fetchPayments(response.data.id);
      } else {
        toast.error(response.message || 'Failed to fetch reservation details');
      }
    } catch (error) {
      console.error('Error fetching reservation:', error);
      toast.error('An error occurred while fetching reservation details');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch service orders for this reservation
  const fetchServiceOrders = async (reservationId: number) => {
    try {
      setIsServicesLoading(true);
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
      setIsServicesLoading(false);
    }
  };

  // Fetch payments for this reservation
  const fetchPayments = async (reservationId: number) => {
    try {
      setIsPaymentsLoading(true);
      const response = await paymentsApi.getByReservationId(reservationId);

      if (response.success) {
        setPayments(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('An error occurred while fetching payments');
    } finally {
      setIsPaymentsLoading(false);
    }
  };

  // Delete reservation
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await reservationsApi.delete(id);

      if (response.success) {
        toast.success('Reservation deleted successfully');
        router.push('/dashboard/reservations');
      } else {
        toast.error(response.message || 'Failed to delete reservation');
        setDeleteModalOpen(false);
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast.error('An error occurred while deleting the reservation');
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Open status update modal
  const openStatusUpdateModal = (status: string) => {
    setNewStatus(status);
    setStatusUpdateModalOpen(true);
  };

  // Update reservation status
  const handleStatusUpdate = async () => {
    if (!reservation || !newStatus) return;

    try {
      setIsUpdatingStatus(true);
      const response = await reservationsApi.update(reservation.id, {
        ...reservation,
        status: newStatus,
      });

      if (response.success) {
        toast.success(`Reservation status updated to ${newStatus}`);
        setStatusUpdateModalOpen(false);
        setReservation(response.data as any);
      } else {
        toast.error(response.message || 'Failed to update reservation status');
      }
    } catch (error) {
      console.error('Error updating reservation status:', error);
      toast.error('An error occurred while updating the reservation status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Define columns for the service orders table
  const serviceOrderColumns: TableColumn<ServiceOrder>[] = [
    {
      key: 'type',
      header: 'Type',
      cell: (service) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 capitalize">{service.serviceType}</span>
          <span className="text-xs text-gray-500 capitalize">{service.serviceSubtype}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      cell: (service) => (
        <div className="max-w-xs">
          <p className="text-gray-700 truncate">{service.description}</p>
        </div>
      ),
    },
    {
      key: 'created',
      header: 'Submitted On',
      cell: (service) => <span className="text-gray-700">{formatDate(service.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (service) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${service.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              service.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                service.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
            }`}
        >
          {service.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (service) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/services/${service.id}`}>
            <Button size="xs" variant="outline">View</Button>
          </Link>
        </div>
      ),
    },
  ];

  // Define columns for the payments table
  const paymentColumns: TableColumn<Payment>[] = [
    {
      key: 'date',
      header: 'Date',
      cell: (payment) => <span className="text-gray-700">{formatDate(payment.paymentDate)}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (payment) => <span className="text-gray-900 font-medium">{formatCurrency(payment.amount)}</span>,
    },
    {
      key: 'method',
      header: 'Method',
      cell: (payment) => <span className="text-gray-700 capitalize">{payment.paymentMethod.replace('_', ' ')}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (payment) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${payment.status === 'paid' ? 'bg-green-100 text-green-800' :
              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                payment.status === 'refunded' ? 'bg-purple-100 text-purple-800' :
                  'bg-red-100 text-red-800'
            }`}
        >
          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (payment) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/payments/${payment.id}`}>
            <Button size="xs" variant="outline">View</Button>
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
          <p className="text-gray-600">Loading reservation details...</p>
        </div>
      </div>
    );
  }

  // Render not found state
  if (!reservation) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Reservation Not Found</h2>
        <p className="text-gray-600 mb-6">The reservation you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link href="/dashboard/reservations">
          <Button>Back to Reservations</Button>
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
              <Link href="/dashboard/reservations" className="hover:text-primary-600">Reservations</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">#{reservation.id}</span>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Reservation #{reservation.id}
          </h1>
          <div className="flex space-x-3">
            <Link href={`/dashboard/reservations/${reservation.id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
            <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>Delete</Button>
          </div>
        </div>
      </div>

      {/* Reservation Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Reservation Details</h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reservation.status === 'active' ? 'bg-green-100 text-green-800' :
                    reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      reservation.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                  }`}
              >
                {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
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

              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="mt-1 text-base text-gray-900 capitalize">
                  {reservation.status}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Created On</h3>
                <p className="mt-1 text-base text-gray-900">
                  {formatDate(reservation.createdAt)}
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <p className="text-gray-700 whitespace-pre-line">
                  {reservation.notes || 'No notes provided'}
                </p>
              </div>
            </div>

            {/* Contract */}
            {reservation.contractUrl && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Contract Document</h3>
                <a
                  href={reservation.contractUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="mr-2 -ml-1 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Contract
                </a>
              </div>
            )}

            {/* Status Action Buttons */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Reservation Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openStatusUpdateModal('active')}
                  disabled={reservation.status === 'active'}
                  className="border-green-500 text-green-700 hover:bg-green-50 disabled:opacity-50"
                >
                  Mark as Active
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openStatusUpdateModal('pending')}
                  disabled={reservation.status === 'pending'}
                  className="border-yellow-500 text-yellow-700 hover:bg-yellow-50 disabled:opacity-50"
                >
                  Mark as Pending
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openStatusUpdateModal('expired')}
                  disabled={reservation.status === 'expired'}
                  className="border-gray-500 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Mark as Expired
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openStatusUpdateModal('cancelled')}
                  disabled={reservation.status === 'cancelled'}
                  className="border-red-500 text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Mark as Cancelled
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Tenant Info */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tenant Information</h2>

            {reservation.user ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p className="mt-1 text-base text-gray-900">
                    {reservation.user.fullName}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1 text-base text-gray-900">
                    {reservation.user.email}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                  <p className="mt-1 text-base text-gray-900">
                    {reservation.user.phone}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Username</h3>
                  <p className="mt-1 text-base text-gray-900">
                    {reservation.user.username}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Joined</h3>
                  <p className="mt-1 text-base text-gray-900">
                    {formatDate(reservation.user.createdAt)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Tenant information not available</p>
            )}
          </div>
        </Card>
      </div>

      {/* Payments */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
          <Link href={`/dashboard/payments/create?reservationId=${reservation.id}`}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              Add Payment
            </Button>
          </Link>
        </div>

        <Card>
          <Table
            data={payments}
            columns={paymentColumns}
            keyExtractor={(payment) => payment.id}
            isLoading={isPaymentsLoading}
            emptyMessage="No payment history found for this reservation"
            onRowClick={(payment) => router.push(`/dashboard/payments/${payment.id}`)}
          />
        </Card>
      </div>

      {/* Service Orders */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Service Requests</h2>
          <Link href={`/dashboard/services/create?reservationId=${reservation.id}`}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              Create Service Request
            </Button>
          </Link>
        </div>

        <Card>
          <Table
            data={serviceOrders}
            columns={serviceOrderColumns}
            keyExtractor={(service) => service.id}
            isLoading={isServicesLoading}
            emptyMessage="No service requests found for this reservation"
            onRowClick={(service) => router.push(`/dashboard/services/${service.id}`)}
          />
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Reservation"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete this reservation? This action cannot be undone.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
            <p className="text-sm font-medium">Warning</p>
            <p className="text-sm">Deleting this reservation will remove the tenant's access to this unit and any associated service orders.</p>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
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
        </div>
      </Modal>

      {/* Status Update Confirmation Modal */}
      <Modal
        isOpen={statusUpdateModalOpen}
        onClose={() => setStatusUpdateModalOpen(false)}
        title="Update Reservation Status"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to change the status to{" "}
            <span className="font-medium capitalize">{newStatus}</span>?
          </p>
          {newStatus === 'cancelled' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
              <p className="text-sm font-medium">Warning</p>
              <p className="text-sm">Cancelling this reservation will remove the tenant's access to this unit.</p>
            </div>
          )}
          {newStatus === 'expired' && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-700">
              <p className="text-sm font-medium">Note</p>
              <p className="text-sm">Marking this reservation as expired will change the unit status to available.</p>
            </div>
          )}
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setStatusUpdateModalOpen(false)}
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleStatusUpdate}
              isLoading={isUpdatingStatus}
              disabled={isUpdatingStatus}
            >
              Update Status
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}