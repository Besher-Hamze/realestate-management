'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Company, User, Building } from '@/lib/types';
import { companiesApi, buildingsApi, usersApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Table from '@/components/ui/Table';
import { formatDate, cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface CompanyDetailPageProps {
  params: {
    id: string;
  };
}

export default function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const id = params.id;
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [managers, setManagers] = useState<User[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isManagersLoading, setIsManagersLoading] = useState(true);
  const [isBuildingsLoading, setIsBuildingsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Only admins can delete companies
  const isAdmin = currentUser?.role === 'admin';

  // Fetch company details on component mount
  useEffect(() => {
    fetchCompany();
  }, [id]);

  // Fetch company data
  const fetchCompany = async () => {
    try {
      setIsLoading(true);
      const response = await companiesApi.getById(id);
      
      if (response.success) {
        setCompany(response.data);
        fetchCompanyManagers();
        fetchCompanyBuildings();
      } else {
        toast.error(response.message || 'Failed to fetch company details');
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      toast.error('An error occurred while fetching company details');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch managers for this company
  const fetchCompanyManagers = async () => {
    try {
      setIsManagersLoading(true);
      const response = await usersApi.getAll();
      
      if (response.success) {
        // Filter to only manager users of this company
        const companyManagers = response.data.filter(
          user => user.role === 'manager' && user.companyId === parseInt(id)
        );
        setManagers(companyManagers);
      } else {
        toast.error(response.message || 'Failed to fetch company managers');
      }
    } catch (error) {
      console.error('Error fetching managers:', error);
      toast.error('An error occurred while fetching company managers');
    } finally {
      setIsManagersLoading(false);
    }
  };

  // Fetch buildings for this company
  const fetchCompanyBuildings = async () => {
    try {
      setIsBuildingsLoading(true);
      const response = await buildingsApi.getAll();
      
      if (response.success) {
        // Filter to only buildings of this company
        const companyBuildings = response.data.filter(
          building => building.companyId === parseInt(id)
        );
        setBuildings(companyBuildings);
      } else {
        toast.error(response.message || 'Failed to fetch company buildings');
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
      toast.error('An error occurred while fetching company buildings');
    } finally {
      setIsBuildingsLoading(false);
    }
  };

  // Delete company
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await companiesApi.delete(id);
      
      if (response.success) {
        toast.success('Company deleted successfully');
        router.push('/dashboard/companies');
      } else {
        toast.error(response.message || 'Failed to delete company');
        setDeleteModalOpen(false);
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('An error occurred while deleting the company');
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Define columns for the managers table
  const managerColumns = [
    {
      key: 'name',
      header: 'Name',
      cell: (user: User) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{user.fullName}</span>
          <span className="text-xs text-gray-500">{user.username}</span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (user: User) => (
        <div className="flex flex-col">
          <span className="text-gray-700">{user.email}</span>
          <span className="text-xs text-gray-500">{user.phone}</span>
        </div>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      cell: (user: User) => <span className="text-gray-700">{formatDate(user.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (user: User) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/users/${user.id}`}>
            <Button size="xs" variant="outline">View Profile</Button>
          </Link>
        </div>
      ),
    },
  ];

  // Define columns for the buildings table
  const buildingColumns = [
    {
      key: 'name',
      header: 'Name',
      cell: (building: Building) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{building.name}</span>
          <span className="text-xs text-gray-500 capitalize">{building.buildingType}</span>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      cell: (building: Building) => <span className="text-gray-700">{building.address}</span>,
    },
    {
      key: 'units',
      header: 'Units',
      cell: (building: Building) => <span className="text-gray-700">{building.totalUnits}</span>,
    },
    {
      key: 'created',
      header: 'Created',
      cell: (building: Building) => <span className="text-gray-700">{formatDate(building.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (building: Building) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/buildings/${building.id}`}>
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
          <p className="text-gray-600">Loading company details...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Company Not Found</h3>
        <p className="text-gray-600 mb-4">The requested company could not be found</p>
        <Link href="/dashboard/companies">
          <Button>Back to Companies</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with breadcrumbs */}
      <div className="flex flex-col space-y-2">
        <nav className="text-sm text-gray-500 mb-2">
          <ol className="flex space-x-2">
            <li>
              <Link href="/dashboard" className="hover:text-primary-600">Dashboard</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <Link href="/dashboard/companies" className="hover:text-primary-600">Companies</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">{company.name}</span>
            </li>
          </ol>
        </nav>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
          <div className="flex space-x-3">
            <Link href={`/dashboard/companies/${id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
            {isAdmin && (
              <Button
                variant="danger"
                onClick={() => setDeleteModalOpen(true)}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Company Info Card */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Company Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-800">{company.email || 'N/A'}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-gray-800">{company.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created On</p>
                <p className="text-gray-800">{formatDate(company.createdAt)}</p>
              </div>
            </div>
            <div>
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-gray-800">{company.address || 'N/A'}</p>
              </div>
              {company.logoUrl && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Logo</p>
                  <img
                    src={company.logoUrl}
                    alt={`${company.name} logo`}
                    className="h-24 w-auto object-contain border rounded p-2"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Managers Section */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Managers</h2>
            <Link href={`/dashboard/users/managers/create?companyId=${id}`}>
              <Button size="sm">Add Manager</Button>
            </Link>
          </div>
          
          {isManagersLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="flex flex-col items-center">
                <svg
                  className="animate-spin h-8 w-8 text-primary-500 mb-3"
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
                <p className="text-gray-600">Loading managers...</p>
              </div>
            </div>
          ) : managers.length > 0 ? (
            <Table
              columns={managerColumns}
              data={managers}
              keyExtractor={(item) => item.id}
              showHeader={true}
              striped={true}
            />
          ) : (
            <div className="bg-gray-50 p-6 text-center rounded-md">
              <p className="text-gray-600 mb-4">No managers found for this company</p>
              <Link href={`/dashboard/users/managers/create?companyId=${id}`}>
                <Button size="sm">Add Manager</Button>
              </Link>
            </div>
          )}
        </div>
      </Card>

      {/* Buildings Section */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Buildings</h2>
            <Link href={`/dashboard/buildings/create?companyId=${id}`}>
              <Button size="sm">Add Building</Button>
            </Link>
          </div>
          
          {isBuildingsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="flex flex-col items-center">
                <svg
                  className="animate-spin h-8 w-8 text-primary-500 mb-3"
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
                <p className="text-gray-600">Loading buildings...</p>
              </div>
            </div>
          ) : buildings.length > 0 ? (
            <Table
              columns={buildingColumns}
              data={buildings}
              keyExtractor={(item) => item.id}
              showHeader={true}
              striped={true}
            />
          ) : (
            <div className="bg-gray-50 p-6 text-center rounded-md">
              <p className="text-gray-600 mb-4">No buildings found for this company</p>
              <Link href={`/dashboard/buildings/create?companyId=${id}`}>
                <Button size="sm">Add Building</Button>
              </Link>
            </div>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Company"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            Are you sure you want to delete <span className="font-semibold">{company?.name}</span>? 
            This action cannot be undone, and all associated buildings and data will be permanently deleted.
          </p>
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
              Delete Company
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}