'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { User, Reservation } from '@/lib/types';
import { usersApi, reservationsApi, authApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Table, { TableColumn } from '@/components/ui/Table';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface UserDetailPageProps {
  params: {
    id: string;
  };
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  const id = params.id;
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReservationsLoading, setIsReservationsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // For password reset
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // For user update form
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch user details on component mount
  useEffect(() => {
    fetchUser();
  }, [id]);

  // Fetch user data
  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const response = await usersApi.getById(id);
      
      if (response.success) {
        setUser(response.data);
        setFormData({
          fullName: response.data.fullName,
          email: response.data.email,
          phone: response.data.phone,
        });
        
        if (response.data.role === 'tenant') {
          fetchUserReservations(response.data.id);
        } else {
          setIsReservationsLoading(false);
        }
      } else {
        toast.error(response.message || 'Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('An error occurred while fetching user details');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch reservations for tenant
  const fetchUserReservations = async (userId: number) => {
    try {
      setIsReservationsLoading(true);
      const response = await reservationsApi.getByUserId(userId);
      
      if (response.success) {
        setReservations(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch user reservations');
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('An error occurred while fetching user reservations');
    } finally {
      setIsReservationsLoading(false);
    }
  };

  // Delete user
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await usersApi.delete(id);
      
      if (response.success) {
        toast.success('User deleted successfully');
        router.push('/dashboard/users');
      } else {
        toast.error(response.message || 'Failed to delete user');
        setDeleteModalOpen(false);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('An error occurred while deleting the user');
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Update user
  const handleUpdateUser = async () => {
    try {
      setIsUpdating(true);
      const response = await usersApi.update(id, formData);
      
      if (response.success) {
        toast.success('User updated successfully');
        setEditModalOpen(false);
        setUser(response.data);
      } else {
        toast.error(response.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('An error occurred while updating the user');
    } finally {
      setIsUpdating(false);
    }
  };

  // Reset manager password
  const handleResetPassword = async () => {
    if (!user || user.role !== 'manager') return;

    try {
      setIsResettingPassword(true);
      
      // Only admins can reset manager passwords
      if (currentUser?.role === 'admin') {
        const response = await authApi.resetManagerPassword(user.id, newPassword);

        if (response.success) {
          toast.success('Password reset successfully');
          setResetPasswordModalOpen(false);
        } else {
          toast.error(response.message || 'Failed to reset password');
        }
      } else {
        toast.error('You do not have permission to reset this password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('An error occurred while resetting the password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Define columns for the reservations table
  const reservationColumns: TableColumn<Reservation>[] = [
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
      key: 'period',
      header: 'Period',
      cell: (reservation) => (
        <div className="flex flex-col">
          <span className="text-gray-700">{formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}</span>
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
          <Link href={`/dashboard/reservations/${reservation.id}`} onClick={(e) => e.stopPropagation()}>
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
          <p className="text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  // Render not found state
  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">User Not Found</h2>
        <p className="text-gray-600 mb-6">The user you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link href="/dashboard/users">
          <Button>Back to Users</Button>
        </Link>
      </div>
    );
  }

  // Define role badge color
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'tenant':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
              <Link href="/dashboard/users" className="hover:text-primary-600">Users</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">{user.fullName}</span>
            </li>
          </ol>
        </nav>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 mr-3">
              {user.fullName}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role)}`}
            >
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setEditModalOpen(true)}
            >
              Edit
            </Button>
            
            {/* Only show reset password for managers when an admin is logged in */}
            {currentUser?.role === 'admin' && user.role === 'manager' && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setResetPasswordModalOpen(true);
                  // Generate a random password
                  const randomPassword = Math.random().toString(36).slice(-8);
                  setNewPassword(randomPassword);
                }}
              >
                Reset Password
              </Button>
            )}
            
            <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
              Delete
            </Button>
          </div>
        </div>
      </div>
      
      {/* User Details */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
              <p className="mt-1 text-base text-gray-900">{user.fullName}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Username</h3>
              <p className="mt-1 text-base text-gray-900">{user.username}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1 text-base text-gray-900">{user.email}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Phone</h3>
              <p className="mt-1 text-base text-gray-900">{user.phone}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Role</h3>
              <p className="mt-1 text-base text-gray-900 capitalize">{user.role}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Joined</h3>
              <p className="mt-1 text-base text-gray-900">{formatDate(user.createdAt)}</p>
            </div>
            
            {user.companyId && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Company</h3>
                <p className="mt-1 text-base text-gray-900">
                  <Link href={`/dashboard/companies/${user.companyId}`} className="text-primary-600 hover:text-primary-700">
                    View Company
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
      
      {/* Reservations (only for tenants) */}
      {user.role === 'tenant' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Reservations</h2>
            <Link href={`/dashboard/reservations/create?userId=${user.id}`}>
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
              emptyMessage="No reservations found for this user"
              onRowClick={(reservation) => router.push(`/dashboard/reservations/${reservation.id}`)}
            />
          </Card>
        </div>
      )}
      
      {/* Edit User Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit User"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateUser}
              isLoading={isUpdating}
              disabled={isUpdating}
            >
              Update User
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            required
            fullWidth
          />
          
          <Input
            label="Email"
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            fullWidth
          />
          
          <Input
            label="Phone"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            fullWidth
          />
        </div>
      </Modal>
      
      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete User"
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
          Are you sure you want to delete {user.fullName}? This action cannot be undone.
        </p>
        
        {user.role === 'tenant' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
            <p className="text-sm font-medium">Warning</p>
            <p className="text-sm">Deleting this tenant will also remove their access to all associated units and service requests.</p>
          </div>
        )}
        
        {user.role === 'manager' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
            <p className="text-sm font-medium">Warning</p>
            <p className="text-sm">Deleting this manager will remove their access to the system. Consider reassigning their properties first.</p>
          </div>
        )}
      </Modal>
      
      {/* Reset Password Modal */}
      <Modal
        isOpen={resetPasswordModalOpen}
        onClose={() => setResetPasswordModalOpen(false)}
        title="Reset Manager Password"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setResetPasswordModalOpen(false)}
              disabled={isResettingPassword}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleResetPassword}
              isLoading={isResettingPassword}
              disabled={isResettingPassword}
            >
              Reset Password
            </Button>
          </div>
        }
      >
        <p className="text-gray-600 mb-4">
          Are you sure you want to reset the password for {user.fullName}?
        </p>
        
        <div className="mb-4">
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
          <div className="mt-1 flex items-center">
            <input
              type="text"
              id="newPassword"
              className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Button
              type="button"
              variant="outline"
              className="ml-2"
              onClick={() => {
                // Generate a random password
                const randomPassword = Math.random().toString(36).slice(-8);
                setNewPassword(randomPassword);
              }}
            >
              Generate
            </Button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            The manager will need to use this password for their next login.
          </p>
        </div>
      </Modal>
    </div>
  );
}