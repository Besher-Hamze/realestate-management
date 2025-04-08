'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, usersApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { User, Company } from '@/lib/types';
import { companiesApi } from '@/lib/api';

export default function ManagerProfilePage() {
  const { user, checkAuth } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<Partial<User>>({});
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);

  // Fetch company data if manager
  useEffect(() => {
    if (user?.companyId) {
      const fetchCompany = async () => {
        try {
          setIsLoadingCompany(true);
          const response = await companiesApi.getById(user.companyId as number);
          if (response.success) {
            setCompany(response.data);
          }
        } catch (error) {
          console.error('Error fetching company:', error);
        } finally {
          setIsLoadingCompany(false);
        }
      };
      
      fetchCompany();
    }
  }, [user]);

  // Initialize profile data from user
  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      });
    }
  }, [user]);

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const response = await authApi.changePassword(currentPassword, newPassword);
      
      if (response.success) {
        toast.success('Password changed successfully');
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(response.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('An error occurred while changing your password');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      const response = await usersApi.update(user.id, profileData);
      
      if (response.success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        // Refresh user data in auth context
        checkAuth();
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating your profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input change for profile data
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!user) {
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
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>
      
      {/* Profile Information */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
          
          {isEditing ? (
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <Input
                label="Full Name"
                id="fullName"
                name="fullName"
                value={profileData.fullName || ''}
                onChange={handleInputChange}
                required
                fullWidth
              />
              
              <Input
                label="Email"
                id="email"
                name="email"
                type="email"
                value={profileData.email || ''}
                onChange={handleInputChange}
                required
                fullWidth
              />
              
              <Input
                label="Phone"
                id="phone"
                name="phone"
                value={profileData.phone || ''}
                onChange={handleInputChange}
                required
                fullWidth
              />
              
              <div className="flex space-x-3 pt-2">
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setProfileData({
                      fullName: user.fullName,
                      email: user.email,
                      phone: user.phone,
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
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
                <p className="mt-1 text-base text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {/* Company Information (for managers) */}
      {user.role === 'manager' && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
            
            {isLoadingCompany ? (
              <div className="flex justify-center py-4">
                <svg
                  className="animate-spin h-6 w-6 text-primary-500"
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
              </div>
            ) : company ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Company Name</h3>
                  <p className="mt-1 text-base text-gray-900">{company.name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Company Email</h3>
                  <p className="mt-1 text-base text-gray-900">{company.email}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Company Phone</h3>
                  <p className="mt-1 text-base text-gray-900">{company.phone}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Company Address</h3>
                  <p className="mt-1 text-base text-gray-900">{company.address}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No company information available.</p>
            )}
          </div>
        </Card>
      )}
      
      {/* Change Password */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="Current Password"
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              fullWidth
            />
            
            <Input
              label="New Password"
              id="newPassword"
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              fullWidth
              helpText="Password must be at least 6 characters long"
            />
            
            <Input
              label="Confirm New Password"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              fullWidth
            />
            
            <div className="pt-2">
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Change Password
              </Button>
            </div>
          </form>
        </div>
      </Card>
      
      {/* Access Information */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Access Information</h2>
          <p className="text-gray-600 mb-3">
            As a manager, you have access to:
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li>Manage buildings and units for your company</li>
            <li>Handle tenant applications and reservations</li>
            <li>Process payments and manage financial records</li>
            <li>Manage service requests and maintenance</li>
            <li>Generate reports for your property portfolio</li>
          </ul>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm">
            If you need any changes to your account permissions or have questions about your role, please contact the system administrator.
          </div>
        </div>
      </Card>
    </div>
  );
}