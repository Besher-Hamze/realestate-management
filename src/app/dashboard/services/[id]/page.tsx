'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ServiceOrder } from '@/lib/types';
import { servicesApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';

interface ServiceDetailPageProps {
  params: {
    id: string;
  };
}

export default function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const id = params.id;
  const router = useRouter();
  
  const [service, setService] = useState<ServiceOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch service details on component mount
  useEffect(() => {
    fetchService();
  }, [id]);

  // Fetch service data
  const fetchService = async () => {
    try {
      setIsLoading(true);
      const response = await servicesApi.getById(id);
      
      if (response.success) {
        setService(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch service details');
      }
    } catch (error) {
      console.error('Error fetching service:', error);
      toast.error('An error occurred while fetching service details');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete service
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await servicesApi.delete(id);
      
      if (response.success) {
        toast.success('Service request deleted successfully');
        router.push('/dashboard/services');
      } else {
        toast.error(response.message || 'Failed to delete service request');
        setDeleteModalOpen(false);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('An error occurred while deleting the service request');
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Open status update modal
  const openStatusUpdateModal = (status: string) => {
    setNewStatus(status);
    setStatusUpdateModalOpen(true);
  };

  // Update service status
  const handleStatusUpdate = async () => {
    if (!service || !newStatus) return;

    try {
      setIsUpdatingStatus(true);
      const response = await servicesApi.update(service.id, {
        ...service,
        status: newStatus,
      });

      if (response.success) {
        toast.success(`Service request status updated to ${newStatus.replace('-', ' ')}`);
        setStatusUpdateModalOpen(false);
        setService(response.data);
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
          <p className="text-gray-600">Loading service request details...</p>
        </div>
      </div>
    );
  }

  // Render not found state
  if (!service) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Service Request Not Found</h2>
        <p className="text-gray-600 mb-6">The service request you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link href="/dashboard/services">
          <Button>Back to Service Requests</Button>
        </Link>
      </div>
    );
  }

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
              <Link href="/dashboard/services" className="hover:text-primary-600">Service Requests</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">#{service.id}</span>
            </li>
          </ol>
        </nav>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Service Request #{service.id}
          </h1>
          <div className="flex space-x-3">
            <Link href={`/dashboard/services/${service.id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
            <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>Delete</Button>
          </div>
        </div>
      </div>
      
      {/* Service Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Request Details</h2>
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Service Type</h3>
                <p className="mt-1 text-base text-gray-900 capitalize">
                  {service.serviceType}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Service Subtype</h3>
                <p className="mt-1 text-base text-gray-900 capitalize">
                  {service.serviceSubtype}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Submitted On</h3>
                <p className="mt-1 text-base text-gray-900">
                  {formatDate(service.createdAt)}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                <p className="mt-1 text-base text-gray-900">
                  {formatDate(service.updatedAt)}
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
              <div className="p-4 bg-gray-50 rounded-md text-gray-900">
                {service.description}
              </div>
            </div>
            
            {service.attachmentUrl && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Attachment</h3>
                <a 
                  href={service.attachmentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg className="mr-2 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  View Attachment
                </a>
              </div>
            )}
          </div>
        </Card>
        
        {/* Property & Tenant Info */}
        <div className="space-y-6">
          {/* Status Actions */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h2>
              
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                  fullWidth
                  disabled={service.status === 'pending'}
                  onClick={() => openStatusUpdateModal('pending')}
                >
                  Mark as Pending
                </Button>
                
                <Button
                  variant="outline"
                  className="border-blue-500 text-blue-700 hover:bg-blue-50"
                  fullWidth
                  disabled={service.status === 'in-progress'}
                  onClick={() => openStatusUpdateModal('in-progress')}
                >
                  Mark as In Progress
                </Button>
                
                <Button
                  variant="outline"
                  className="border-green-500 text-green-700 hover:bg-green-50"
                  fullWidth
                  disabled={service.status === 'completed'}
                  onClick={() => openStatusUpdateModal('completed')}
                >
                  Mark as Completed
                </Button>
                
                <Button
                  variant="outline"
                  className="border-red-500 text-red-700 hover:bg-red-50"
                  fullWidth
                  disabled={service.status === 'cancelled'}
                  onClick={() => openStatusUpdateModal('cancelled')}
                >
                  Mark as Cancelled
                </Button>
              </div>
            </div>
          </Card>
          
          {/* Property Info */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h2>
              
              <div className="space-y-4">
                {service.reservation?.unit ? (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Unit</h3>
                      <p className="mt-1 text-base text-gray-900">
                        {service.reservation.unit.unitNumber}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Building</h3>
                      <p className="mt-1 text-base text-gray-900">
                        {service.reservation.unit.building?.name || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Floor</h3>
                      <p className="mt-1 text-base text-gray-900">
                        {service.reservation.unit.floor}
                      </p>
                    </div>
                    
                    <div className="pt-4 mt-4 border-t border-gray-200">
                      <Link href={`/dashboard/units/${service.reservation.unit.id}`}>
                        <Button variant="outline" fullWidth>
                          View Unit Details
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">Unit information not available</p>
                )}
              </div>
            </div>
          </Card>
          
          {/* Tenant Info */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tenant Information</h2>
              
              <div className="space-y-4">
                {service.reservation?.user ? (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Name</h3>
                      <p className="mt-1 text-base text-gray-900">
                        {service.reservation.user.fullName}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Email</h3>
                      <p className="mt-1 text-base text-gray-900">
                        {service.reservation.user.email}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                      <p className="mt-1 text-base text-gray-900">
                        {service.reservation.user.phone}
                      </p>
                    </div>
                    
                    <div className="pt-4 mt-4 border-t border-gray-200">
                      <Link href={`/dashboard/users/${service.reservation.user.id}`}>
                        <Button variant="outline" fullWidth>
                          View Tenant Profile
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">Tenant information not available</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
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
      
      {/* Status Update Confirmation Modal */}
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
    </div>
  );
}