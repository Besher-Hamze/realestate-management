import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ServiceOrder } from '@/lib/types';
import Table, { TableColumn } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { servicesApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface ServiceListProps {
  services: ServiceOrder[];
  isLoading: boolean;
  onDelete?: (id: number) => void;
  refetch: () => void;
  forTenant?: boolean;
}

export default function ServiceList({
  services,
  isLoading,
  onDelete,
  refetch,
  forTenant = false,
}: ServiceListProps) {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Handle row click
  const handleRowClick = (service: ServiceOrder) => {
    if (forTenant) {
      router.push(`/tenant/services/${service.id}`);
    } else {
      router.push(`/dashboard/services/${service.id}`);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (service: ServiceOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedService(service);
    setDeleteModalOpen(true);
  };

  // Open status update modal
  const openStatusUpdateModal = (service: ServiceOrder, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedService(service);
    setNewStatus(status);
    setStatusUpdateModalOpen(true);
  };

  // Delete service
  const handleDelete = async () => {
    if (!selectedService) return;

    try {
      setIsDeleting(true);
      const response = await servicesApi.delete(selectedService.id);

      if (response.success) {
        toast.success('Service request deleted successfully');
        setDeleteModalOpen(false);
        
        // Call the onDelete callback or refetch data
        if (onDelete) {
          onDelete(selectedService.id);
        } else {
          refetch();
        }
      } else {
        toast.error(response.message || 'Failed to delete service request');
      }
    } catch (error) {
      console.error('Error deleting service request:', error);
      toast.error('An error occurred while deleting the service request');
    } finally {
      setIsDeleting(false);
    }
  };

  // Update service status
  const handleStatusUpdate = async () => {
    if (!selectedService || !newStatus) return;

    try {
      setIsUpdatingStatus(true);
      const response = await servicesApi.update(selectedService.id, {
        ...selectedService,
        status: newStatus,
      });

      if (response.success) {
        toast.success(`Service request status updated to ${newStatus.replace('-', ' ')}`);
        setStatusUpdateModalOpen(false);
        refetch();
      } else {
        toast.error(response.message || 'Failed to update service request status');
      }
    } catch (error) {
      console.error('Error updating service status:', error);
      toast.error('An error occurred while updating the service request status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Status update button component
  const StatusButton = ({ service, status, label, color }: { service: ServiceOrder; status: string; label: string; color: string }) => (
    <Button
      size="xs"
      variant="outline"
      className={`border-${color}-500 text-${color}-700 hover:bg-${color}-50`}
      onClick={(e) => openStatusUpdateModal(service, status, e)}
      disabled={service.status === status}
    >
      {label}
    </Button>
  );

  // Define columns for the table
  const baseColumns: TableColumn<ServiceOrder>[] = [
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
      key: 'property',
      header: 'Property',
      cell: (service) => {
        const unitNumber = service.reservation?.unit?.unitNumber || 'N/A';
        const buildingName = service.reservation?.unit?.building?.name || 'N/A';
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
      cell: (service) => {
        const tenantName = service.reservation?.user?.fullName || 'N/A';
        const tenantEmail = service.reservation?.user?.email || '';
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{tenantName}</span>
            {tenantEmail && <span className="text-xs text-gray-500">{tenantEmail}</span>}
          </div>
        );
      },
    },
    {
      key: 'created',
      header: 'Submitted',
      cell: (service) => <span className="text-gray-700">{formatDate(service.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (service) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            service.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            service.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
            service.status === 'completed' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}
        >
          {service.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
      ),
    },
  ];

  // Admin/Manager specific columns with actions
  const adminColumns: TableColumn<ServiceOrder>[] = [
    ...baseColumns,
    {
      key: 'actions',
      header: 'Actions',
      cell: (service) => (
        <div className="flex space-x-2">
          {/* View button */}
          <Link href={`/dashboard/services/${service.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="xs" variant="outline">View</Button>
          </Link>
          
          {/* Status update buttons */}
          <div className="flex space-x-1">
            <StatusButton service={service} status="in-progress" label="Start" color="blue" />
            <StatusButton service={service} status="completed" label="Complete" color="green" />
            <StatusButton service={service} status="cancelled" label="Cancel" color="red" />
          </div>
          
          {/* Delete button */}
          <Button
            size="xs"
            variant="danger"
            onClick={(e) => openDeleteModal(service, e)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Tenant specific columns
  const tenantColumns: TableColumn<ServiceOrder>[] = [
    // Remove tenant column for tenant view
    ...baseColumns.filter(col => col.key !== 'tenant'),
    {
      key: 'actions',
      header: 'Actions',
      cell: (service) => (
        <div className="flex space-x-2">
          <Link href={`/tenant/services/${service.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="xs" variant="outline">View Details</Button>
          </Link>
        </div>
      ),
    },
  ];

  // Choose columns based on user type
  const columns = forTenant ? tenantColumns : adminColumns;

  return (
    <>
      <Table
        data={services}
        columns={columns}
        keyExtractor={(service) => service.id}
        isLoading={isLoading}
        emptyMessage="No service requests found"
        onRowClick={handleRowClick}
      />
      
      {/* Delete Confirmation Modal */}
      {!forTenant && (
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Service Request"
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
          <p className="text-gray-600">
            Are you sure you want to delete this service request? This action cannot be undone.
          </p>
        </Modal>
      )}
      
      {/* Status Update Confirmation Modal */}
      {!forTenant && (
        <Modal
          isOpen={statusUpdateModalOpen}
          onClose={() => setStatusUpdateModalOpen(false)}
          title="Update Status"
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
          <p className="text-gray-600">
            Are you sure you want to change the status to{" "}
            <span className="font-medium capitalize">
              {newStatus.replace("-", " ")}
            </span>
            ?
          </p>
          {newStatus === 'cancelled' && (
            <p className="mt-2 text-red-600 text-sm">
              Note: Cancelling a service request will notify the tenant that their request will not be processed.
            </p>
          )}
        </Modal>
      )}
    </>
  );
}