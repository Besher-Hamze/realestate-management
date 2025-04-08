import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Reservation } from '@/lib/types';
import Table, { TableColumn } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { reservationsApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';

interface ReservationListProps {
  reservations: Reservation[];
  isLoading: boolean;
  onDelete?: (id: number) => void;
  refetch: () => void;
}

export default function ReservationList({
  reservations,
  isLoading,
  onDelete,
  refetch,
}: ReservationListProps) {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Handle row click
  const handleRowClick = (reservation: Reservation) => {
    router.push(`/dashboard/reservations/${reservation.id}`);
  };

  // Open delete confirmation modal
  const openDeleteModal = (reservation: Reservation, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedReservation(reservation);
    setDeleteModalOpen(true);
  };

  // Open status update modal
  const openStatusUpdateModal = (reservation: Reservation, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedReservation(reservation);
    setNewStatus(status);
    setStatusUpdateModalOpen(true);
  };

  // Delete reservation
  const handleDelete = async () => {
    if (!selectedReservation) return;

    try {
      setIsDeleting(true);
      const response = await reservationsApi.delete(selectedReservation.id);

      if (response.success) {
        toast.success('Reservation deleted successfully');
        setDeleteModalOpen(false);
        
        // Call the onDelete callback or refetch data
        if (onDelete) {
          onDelete(selectedReservation.id);
        } else {
          refetch();
        }
      } else {
        toast.error(response.message || 'Failed to delete reservation');
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast.error('An error occurred while deleting the reservation');
    } finally {
      setIsDeleting(false);
    }
  };

  // Update reservation status
  const handleStatusUpdate = async () => {
    if (!selectedReservation || !newStatus) return;

    try {
      setIsUpdatingStatus(true);
      const response = await reservationsApi.update(selectedReservation.id, {
        ...selectedReservation,
        status: newStatus,
      });

      if (response.success) {
        toast.success(`Reservation status updated to ${newStatus}`);
        setStatusUpdateModalOpen(false);
        refetch();
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

  // Status update button component
  const StatusButton = ({ reservation, status, label, color }: { reservation: Reservation; status: string; label: string; color: string }) => (
    <Button
      size="xs"
      variant="outline"
      className={`border-${color}-500 text-${color}-700 hover:bg-${color}-50`}
      onClick={(e) => openStatusUpdateModal(reservation, status, e)}
      disabled={reservation.status === status}
    >
      {label}
    </Button>
  );

  // Define columns for the table
  const columns: TableColumn<Reservation>[] = [
    {
      key: 'unit',
      header: 'Unit',
      cell: (reservation) => {
        const unitNumber = reservation.unit?.unitNumber || 'N/A';
        const buildingName = reservation.unit?.building?.name || 'N/A';
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{unitNumber}</span>
            <span className="text-xs text-gray-500">{buildingName}</span>
          </div>
        );
      },
    },
    {
      key: 'tenant',
      header: 'Tenant',
      cell: (reservation) => {
        const tenantName = reservation.user?.fullName || 'N/A';
        const tenantEmail = reservation.user?.email || '';
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{tenantName}</span>
            {tenantEmail && <span className="text-xs text-gray-500">{tenantEmail}</span>}
          </div>
        );
      },
    },
    {
      key: 'period',
      header: 'Period',
      cell: (reservation) => (
        <div className="flex flex-col">
          <span className="text-gray-700">{formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}</span>
          <span className="text-xs text-gray-500">
            {reservation.unit ? `${formatCurrency(reservation.unit.price)}/month` : ''}
          </span>
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
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/reservations/${reservation.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="xs" variant="outline">View</Button>
          </Link>
          
          {/* Status update buttons */}
          <div className="flex flex-wrap gap-1">
            <StatusButton reservation={reservation} status="active" label="Activate" color="green" />
            <StatusButton reservation={reservation} status="expired" label="Expire" color="gray" />
            <StatusButton reservation={reservation} status="cancelled" label="Cancel" color="red" />
          </div>
          
          {/* Delete button */}
          <Button
            size="xs"
            variant="danger"
            onClick={(e) => openDeleteModal(reservation, e)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Table
        data={reservations}
        columns={columns}
        keyExtractor={(reservation) => reservation.id}
        isLoading={isLoading}
        emptyMessage="No reservations found"
        onRowClick={handleRowClick}
      />
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Reservation"
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
          Are you sure you want to delete this reservation? This action cannot be undone.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
          <p className="text-sm font-medium">Warning</p>
          <p className="text-sm">Deleting this reservation will remove the tenant's access to this unit and any associated service orders.</p>
        </div>
      </Modal>
      
      {/* Status Update Confirmation Modal */}
      <Modal
        isOpen={statusUpdateModalOpen}
        onClose={() => setStatusUpdateModalOpen(false)}
        title="Update Reservation Status"
        footer={
          <div className="flex justify-end space-x-3">
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
        }
      >
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
      </Modal>
    </>
  );
}