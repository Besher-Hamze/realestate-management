import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Building } from '@/lib/types';
import Table, { TableColumn } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { buildingsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface BuildingListProps {
  buildings: Building[];
  isLoading: boolean;
  onDelete?: (id: number) => void;
  refetch: () => void;
}

export default function BuildingList({
  buildings,
  isLoading,
  onDelete,
  refetch,
}: BuildingListProps) {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle row click
  const handleRowClick = (building: Building) => {
    router.push(`/dashboard/buildings/${building.id}`);
  };

  // Open delete confirmation modal
  const openDeleteModal = (building: Building, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBuilding(building);
    setDeleteModalOpen(true);
  };

  // Delete building
  const handleDelete = async () => {
    if (!selectedBuilding) return;

    try {
      setIsDeleting(true);
      const response = await buildingsApi.delete(selectedBuilding.id);

      if (response.success) {
        toast.success('Building deleted successfully');
        setDeleteModalOpen(false);
        
        // Call the onDelete callback or refetch data
        if (onDelete) {
          onDelete(selectedBuilding.id);
        } else {
          refetch();
        }
      } else {
        toast.error(response.message || 'Failed to delete building');
      }
    } catch (error) {
      console.error('Error deleting building:', error);
      toast.error('An error occurred while deleting the building');
    } finally {
      setIsDeleting(false);
    }
  };

  // Define columns for the table
  const columns: TableColumn<Building>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (building) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{building.name}</span>
          <span className="text-xs text-gray-500">{building.buildingType}</span>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      cell: (building) => <span className="text-gray-500">{building.address}</span>,
    },
    {
      key: 'totalUnits',
      header: 'Units',
      cell: (building) => <span className="text-gray-900">{building.totalUnits}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created At',
      cell: (building) => <span className="text-gray-500">{formatDate(building.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (building) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/buildings/${building.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline">View</Button>
          </Link>
          <Link href={`/dashboard/buildings/${building.id}/edit`} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline">Edit</Button>
          </Link>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => openDeleteModal(building, e)}
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
        data={buildings}
        columns={columns}
        keyExtractor={(building) => building.id}
        isLoading={isLoading}
        emptyMessage="No buildings found"
        onRowClick={handleRowClick}
      />
      
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
        <p className="text-gray-600">
          Are you sure you want to delete the building "{selectedBuilding?.name}"? This action cannot be undone.
        </p>
      </Modal>
    </>
  );
}