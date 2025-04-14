'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { User } from '@/lib/types';
import { usersApi, authApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Table, { TableColumn } from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal states for creating users
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createRole, setCreateRole] = useState<'admin' | 'manager'>('manager');
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Role filter options
  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'tenant', label: 'Tenant' },
  ];

  // Form data for creating new users
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Apply filters when users or role filter changes
  useEffect(() => {
    applyFilters();
  }, [users, roleFilter]);

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await usersApi.getAll();

      if (response.success) {
        setUsers(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('An error occurred while fetching users');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters to users
  const applyFilters = () => {
    let filtered = [...users];

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  // Handle role filter change
  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
  };

  // Handle user deletion
  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      setIsDeleting(true);
      const response = await usersApi.delete(selectedUser.id);

      if (response.success) {
        toast.success('User deleted successfully');
        setDeleteModalOpen(false);
        fetchUsers(); // Refetch users after deletion
      } else {
        toast.error(response.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('An error occurred while deleting the user');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  // Open reset password modal
  const openResetPasswordModal = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUser(user);
    setResetPasswordModalOpen(true);
    // Generate a random password
    const randomPassword = Math.random().toString(36).slice(-8);
    setNewPassword(randomPassword);
  };

  // Reset manager password
  const handleResetPassword = async () => {
    if (!selectedUser) return;

    try {
      setIsResettingPassword(true);

      // Only admins can reset manager passwords
      if (currentUser?.role === 'admin' && selectedUser.role === 'manager') {
        const response = await authApi.resetManagerPassword(selectedUser.id, newPassword);

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

  const handleCreateUser = async () => {
    try {
      let response;

      if (createRole === 'admin') {
        response = await authApi.registerAdmin(formData);
      } else {
        response = await authApi.registerManager(formData);
      }

      if (response.success) {
        toast.success(`${createRole.charAt(0).toUpperCase() + createRole.slice(1)} created successfully`);
        setCreateModalOpen(false);
        fetchUsers(); // Refetch users after creation

        // Reset form data
        setFormData({
          username: '',
          password: '',
          fullName: '',
          email: '',
          phone: '',
        });
      } else {
        toast.error(response.message || `Failed to create ${createRole}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('An error occurred while creating the user');
    }
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Define columns for the table
  const columns: TableColumn<User>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (user) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{user.fullName}</span>
          <span className="text-xs text-gray-500">{user.username}</span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (user) => (
        <div className="flex flex-col">
          <span className="text-gray-700">{user.email}</span>
          <span className="text-xs text-gray-500">{user.phone}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (user) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-red-100 text-red-800' :
            user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}
        >
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
      ),
    },
    {
      key: 'joinedDate',
      header: 'Joined',
      cell: (user) => <span className="text-gray-700">{formatDate(user.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (user) => (
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/users/${user.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="xs" variant="outline">View</Button>
          </Link>

          {/* Reset password button (only for managers when admin is logged in) */}
          {currentUser?.role === 'admin' && user.role === 'manager' && (
            <Button
              size="xs"
              variant="outline"
              onClick={(e) => openResetPasswordModal(user, e)}
            >
              Reset Password
            </Button>
          )}

          {/* Delete button */}
          <Button
            size="xs"
            variant="danger"
            onClick={(e) => openDeleteModal(user, e)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>

        {/* Only admins can create new admin/manager users */}
        {currentUser?.role === 'admin' && (
          <div className=" flex  gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setCreateRole('manager');
                setCreateModalOpen(true);
              }}
            >
              Add Manager
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setCreateRole('admin');
                setCreateModalOpen(true);
              }}
            >
              Add Admin
            </Button>
          </div>
        )}
      </div>

      {/* User stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-red-50 border-red-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-red-800">Admins</h3>
                <p className="text-2xl font-bold text-red-900">
                  {users.filter(user => user.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-blue-800">Managers</h3>
                <p className="text-2xl font-bold text-blue-900">
                  {users.filter(user => user.role === 'manager').length}
                </p>
              </div>
            </div>
          </div>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-green-800">Tenants</h3>
                <p className="text-2xl font-bold text-green-900">
                  {users.filter(user => user.role === 'tenant').length}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-64">
            <Select
              label="Role"
              id="roleFilter"
              name="roleFilter"
              value={roleFilter}
              onChange={handleRoleFilterChange}
              options={roleOptions}
              fullWidth
            />
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <Table
          data={filteredUsers}
          columns={columns}
          keyExtractor={(user) => user.id}
          isLoading={isLoading}
          emptyMessage="No users found"
          onRowClick={(user) => router.push(`/dashboard/users/${user.id}`)}
        />
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={`Create New ${createRole.charAt(0).toUpperCase() + createRole.slice(1)}`}
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateUser}
            >
              Create User
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="text"
              id="phone"
              name="phone"
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
          </div>
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
          Are you sure you want to delete {selectedUser?.fullName}? This action cannot be undone.
        </p>

        {selectedUser?.role === 'tenant' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
            <p className="text-sm font-medium">Warning</p>
            <p className="text-sm">Deleting this tenant will also remove their access to all associated units and service requests.</p>
          </div>
        )}

        {selectedUser?.role === 'manager' && (
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
          Are you sure you want to reset the password for {selectedUser?.fullName}?
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