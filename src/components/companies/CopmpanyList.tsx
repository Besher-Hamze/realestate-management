import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Company } from '@/lib/types';
import Table, { TableColumn } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { companiesApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface CompanyListProps {
  companies: Company[];
  isLoading: boolean;
  onDelete?: (id: number) => void;
  refetch: () => void;
}

export default function CompanyList({
  companies,
  isLoading,
  onDelete,
  refetch,
}: CompanyListProps) {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle row click
  const handleRowClick = (company: Company) => {
    router.push(`/dashboard/companies/${company.id}`);
  };

  // Open delete confirmation modal
  const openDeleteModal = (company: Company, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCompany(company);
    setDeleteModalOpen(true);
  };

  // Delete company
  const handleDelete = async () => {
    if (!selectedCompany) return;

    try {
      setIsDeleting(true);
      const response = await companiesApi.delete(selectedCompany.id);

      if (response.success) {
        toast.success('Company deleted successfully');
        setDeleteModalOpen(false);
        
        // Call the onDelete callback or refetch data
        if (onDelete) {
          onDelete(selectedCompany.id);
        } else {
          refetch();
        }
      } else {
        toast.error(response.message || 'Failed to delete company');
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('An error occurred while deleting the company');
    } finally {
      setIsDeleting(false);
    }
  };

  // Define columns for the table
  const columns: TableColumn<Company>[] = [
    {
      key: 'logo',
      header: '',
      cell: (company) => (
        <div className="w-10 h-10 flex items-center justify-center">
          {company.logoUrl ? (
            <img 
              src={company.logoUrl} 
              alt={`${company.name} logo`} 
              className="w-8 h-8 object-contain rounded"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs font-bold">
              {company.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Company Name',
      cell: (company) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{company.name}</span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (company) => (
        <div className="flex flex-col">
          <span className="text-gray-700">{company.email}</span>
          <span className="text-xs text-gray-500">{company.phone}</span>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      cell: (company) => <span className="text-gray-700">{company.address}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created At',
      cell: (company) => <span className="text-gray-700">{formatDate(company.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (company) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/companies/${company.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline">View</Button>
          </Link>
          <Link href={`/dashboard/companies/${company.id}/edit`} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline">Edit</Button>
          </Link>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => openDeleteModal(company, e)}
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
        data={companies}
        columns={columns}
        keyExtractor={(company) => company.id}
        isLoading={isLoading}
        emptyMessage="No companies found"
        onRowClick={handleRowClick}
      />
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Company"
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
          Are you sure you want to delete the company "{selectedCompany?.name}"? This action cannot be undone.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
          <p className="text-sm font-medium">Warning</p>
          <p className="text-sm">Deleting this company will also remove all associated buildings, units, managers, and data.</p>
        </div>
      </Modal>
    </>
  );
}