import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Unit } from '@/lib/types';
import Table, { TableColumn } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { unitsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface UnitListProps {
  units: Unit[];
  isLoading: boolean;
  onDelete?: (id: number) => void;
  refetch: () => void;
  forTenant?: boolean;
}

export default function UnitList({
  units,
  isLoading,
  onDelete,
  refetch,
  forTenant = false,
}: UnitListProps) {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle row click
  const handleRowClick = (unit: Unit) => {
    if (forTenant) {
      router.push(`/tenant/units/${unit.id}`);
    } else {
      router.push(`/dashboard/units/${unit.id}`);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (unit: Unit, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUnit(unit);
    setDeleteModalOpen(true);
  };

  // Delete unit
  const handleDelete = async () => {
    if (!selectedUnit) return;

    try {
      setIsDeleting(true);
      const response = await unitsApi.delete(selectedUnit.id);

      if (response.success) {
        toast.success('Unit deleted successfully');
        setDeleteModalOpen(false);

        // Call the onDelete callback or refetch data
        if (onDelete) {
          onDelete(selectedUnit.id);
        } else {
          refetch();
        }
      } else {
        toast.error(response.message || 'Failed to delete unit');
      }
    } catch (error) {
      console.error('Error deleting unit:', error);
      toast.error('An error occurred while deleting the unit');
    } finally {
      setIsDeleting(false);
    }
  };

  // Define columns for the table
  const baseColumns: TableColumn<Unit>[] = [
    {
      key: 'unitNumber',
      header: 'Unit Number',
      cell: (unit) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{unit.unitNumber}</span>
          <span className="text-xs text-gray-500">Building: {unit.building?.name || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      cell: (unit) => (
        <div className="flex flex-col">
          <span className="text-gray-700">
            {unit.bedrooms} bed{unit.bedrooms !== 1 ? 's' : ''} • {unit.bathrooms} bath{unit.bathrooms !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-gray-500">{unit.area} m² • Floor {unit.floor}</span>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      cell: (unit) => <span className="font-medium text-gray-900">{formatCurrency(unit.price)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (unit) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
          ${unit.status === 'available' ? 'bg-green-100 text-green-800' :
              'bg-blue-100 text-blue-800'
            }`}
        >
          {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
        </span>
      ),
    },
  ];

  // Admin/Manager specific columns with actions
  const adminColumns: TableColumn<Unit>[] = [
    ...baseColumns,
    {
      key: 'actions',
      header: 'Actions',
      cell: (unit) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/units/${unit.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline">View</Button>
          </Link>
          <Link href={`/dashboard/units/${unit.id}/edit`} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline">Edit</Button>
          </Link>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => openDeleteModal(unit, e)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Tenant specific columns
  const tenantColumns: TableColumn<Unit>[] = [
    ...baseColumns,
    {
      key: 'actions',
      header: 'Actions',
      cell: (unit) => (
        <div className="flex space-x-2">
          <Link href={`/tenant/units/${unit.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline">View Details</Button>
          </Link>
          <Link href={`/tenant/services/create?unitId=${unit.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="primary">Service Request</Button>
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
        data={units}
        columns={columns}
        keyExtractor={(unit) => unit.id}
        isLoading={isLoading}
        emptyMessage="No units found"
        onRowClick={handleRowClick}
      />

      {/* Delete Confirmation Modal */}
      {!forTenant && (
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
          <p className="text-gray-600">
            Are you sure you want to delete unit "{selectedUnit?.unitNumber}"? This action cannot be undone.
          </p>
     
        </Modal>
      )}
    </>
  );
}