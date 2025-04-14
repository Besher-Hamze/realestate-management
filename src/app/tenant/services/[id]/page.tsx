'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ServiceOrder } from '@/lib/types';
import { servicesApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

interface TenantServiceDetailPageProps {
  params: {
    id: string;
  };
}

export default function TenantServiceDetailPage({ params }: TenantServiceDetailPageProps) {
  const id = params.id;
  const router = useRouter();

  const [service, setService] = useState<ServiceOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        <Link href="/tenant/services">
          <Button>Back to Service Requests</Button>
        </Link>
      </div>
    );
  }

  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status description
  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your request has been received and is awaiting review.';
      case 'in-progress':
        return 'Your request is currently being worked on by our maintenance team.';
      case 'completed':
        return 'Your request has been completed. Please let us know if you have any further issues.';
      case 'cancelled':
        return 'Your request has been cancelled. Please contact the property manager for more information.';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with breadcrumbs */}
      <div className="flex flex-col space-y-4">
        <nav className="text-sm text-gray-500 mb-2">
          <ol className="flex space-x-2">
            <li>
              <Link href="/tenant" className="hover:text-primary-600">Dashboard</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <Link href="/tenant/services" className="hover:text-primary-600">Service Requests</Link>
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
            <Link href="/tenant/services/create">
              <Button variant="primary">New Request</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`rounded-lg p-4 ${getStatusBadgeClass(service.status)} bg-opacity-50`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {service.status === 'pending' && (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {service.status === 'in-progress' && (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            )}
            {service.status === 'completed' && (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {service.status === 'rejected' && (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium capitalize">
              Status: {service.status.replace('-', ' ')}
            </h3>
            <div className="mt-1 text-sm">
              <p>{getStatusDescription(service.status)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Service Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h2>

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

        {/* Property Info */}
        <div className="space-y-6">
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
                      <h3 className="text-sm font-medium text-gray-500">Address</h3>
                      <p className="mt-1 text-base text-gray-900">
                        {service.reservation.unit.building?.address || 'N/A'}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-200">
                      <Link href={`/tenant/units/${service.reservation.unit.id}`}>
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

          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Need More Help?</h2>
              <p className="text-gray-600 mb-4">
                If you need additional assistance or have questions about your service request, please contact your property manager.
              </p>
              <Link href="/tenant/services/create">
                <Button variant="primary" fullWidth>
                  Submit Another Request
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}