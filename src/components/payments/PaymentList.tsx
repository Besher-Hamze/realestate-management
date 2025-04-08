import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Payment } from '@/lib/types';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { paymentsApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';

interface PaymentListProps {
  payments: Payment[];
  isLoading: boolean;
  onDelete?: (id: number) => void;
  refetch: () => void;
}

export default function PaymentList({
  payments,
  isLoading,
  onDelete,
  refetch,
}: PaymentListProps) {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Handle row click
  const handleRowClick = (payment: Payment) => {
    router.push(`/dashboard/payments/${payment.id}`);
  };

  // Open delete confirmation modal
  const openDeleteModal = (payment: Payment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPayment(payment);
    setDeleteModalOpen(true);
  };

  // Open status update modal
  const openStatusUpdateModal = (payment: Payment, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPayment(payment);
    setNewStatus(status);
    setStatusUpdateModalOpen(true);
  };

  // Delete payment
  const handleDelete = async () => {
    if (!selectedPayment) return;

    try {
      setIsDeleting(true);
      const response = await paymentsApi.delete(selectedPayment.id);

      if (response.success) {
        toast.success('Payment deleted successfully');
        setDeleteModalOpen(false);
        
        // Call the onDelete callback or refetch data
        if (onDelete) {
          onDelete(selectedPayment.id);
        } else {
          refetch();
        }
      } else {
        toast.error(response.message || 'Failed to delete payment');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('An error occurred while deleting the payment');
    } finally {
      setIsDeleting(false);
    }
  };

  // Update payment status
  const handleStatusUpdate = async () => {
    if (!selectedPayment || !newStatus) return;

    try {
      setIsUpdatingStatus(true);
      const response = await paymentsApi.update(selectedPayment.id, {
        ...selectedPayment,
        status: newStatus,
      });

      if (response.success) {
        toast.success(`Payment status updated to ${newStatus}`);
        setStatusUpdateModalOpen(false);
        refetch();
      } else {
        toast.error(response.message || 'Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('An error occurred while updating the payment status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Status update button component
  const StatusButton = ({ payment, status, label, color }: { payment: Payment; status: string; label: string; color: string }) => (
    <Button
      size="xs"
      variant="outline"
      className={`border-${color}-500 text-${color}-700 hover:bg-${color}-50`}
      onClick={(e) => openStatusUpdateModal(payment, status, e)}
      disabled={payment.status === status}
    >
      {label}
    </Button>
  );

  // Define columns for the table
  const columns = [
    {
      key: 'property',
      header: 'Property',
      cell: (payment: Payment) => {
        const unitNumber = payment.reservation?.unit?.unitNumber || 'N/A';
        const tenantName = payment.reservation?.user?.fullName || 'N/A';
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{unitNumber}</span>
            <span className="text-xs text-gray-500">{tenantName}</span>
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (payment: Payment) => <span className="font-medium text-gray-900">{formatCurrency(payment.amount)}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      cell: (payment: Payment) => <span className="text-gray-700">{formatDate(payment.paymentDate)}</span>,
    },
    {
      key: 'method',
      header: 'Method',
      cell: (payment: Payment) => (
        <span className="text-gray-700 capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (payment: Payment) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            payment.status === 'paid' ? 'bg-green-100 text-green-800' :
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
      cell: (payment: Payment) => (
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/payments/${payment.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="xs" variant="outline">View</Button>
          </Link>
          
          {/* Status update buttons */}
          <div className="flex flex-wrap gap-1">
            <StatusButton payment={payment} status="paid" label="Paid" color="green" />
            <StatusButton payment={payment} status="pending" label="Pending" color="yellow" />
            <StatusButton payment={payment} status="refunded" label="Refunded" color="purple" />
            <StatusButton payment={payment} status="failed" label="Failed" color="red" />
          </div>
          
          {/* Delete button */}
          <Button
            size="xs"
            variant="danger"
            onClick={(e) => openDeleteModal(payment, e)}
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
        data={payments}
        columns={columns}
        keyExtractor={(payment) => payment.id}
        isLoading={isLoading}
        emptyMessage="No payments found"
        onRowClick={handleRowClick}
      />
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Payment"
      >
        <div className="p-6">
          <p className="text-gray-600">
            Are you sure you want to delete this payment? This action cannot be undone.
          </p>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
            <strong>Note:</strong> Deleting a payment record may affect your financial records and reports.
          </div>
          <div className="mt-6 flex justify-end space-x-3">
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
        title="Update Payment Status"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to change the payment status to <span className="font-medium">{newStatus}</span>?
          </p>
          
          {newStatus === 'refunded' && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm mb-4">
              <strong>Note:</strong> Marking a payment as refunded may trigger additional workflows in your system.
            </div>
          )}
          
          {newStatus === 'failed' && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm mb-4">
              <strong>Warning:</strong> Marking a payment as failed may affect tenant standing and reporting.
            </div>
          )}
          
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
        </div>
      </Modal>
    </>
  );
}