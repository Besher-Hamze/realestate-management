'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { ServiceOrder } from '@/lib/types';
import { servicesApi, reservationsApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import ServiceList from '@/components/services/ServiceList';

export default function TenantServicesPage() {
  const [services, setServices] = useState<ServiceOrder[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [hasReservations, setHasReservations] = useState(true);

  // Status filter options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' },
  ];

  // Service type filter options
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'maintenance', label: 'maintenance' },
    { value: 'financial', label: 'financial' },
    { value: 'administrative', label: 'administrative' },
  ];

  useEffect(() => {
    checkReservations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [services, statusFilter, typeFilter]);

  const checkReservations = async () => {
    try {
      const response = await reservationsApi.getMy();

      if (response.success) {
        const activeReservations = response.data.filter(res => res.status === 'active');

        if (activeReservations.length > 0) {
          setHasReservations(true);
          fetchServices();
        } else {
          setHasReservations(false);
          setIsLoading(false);
        }
      } else {
        toast.error(response.message || 'Failed to check reservations');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error checking reservations:', error);
      toast.error('An error occurred while checking your reservations');
      setIsLoading(false);
    }
  };

  // Fetch services data
  const fetchServices = async () => {
    try {
      setIsLoading(true);

      // Get my reservations first
      const reservationsResponse = await reservationsApi.getMy();

      if (reservationsResponse.success) {
        const reservationIds = reservationsResponse.data.map(res => res.id);

        // Fetch service orders for each reservation
        if (reservationIds.length > 0) {
          const servicePromises = reservationIds.map(id =>
            servicesApi.getByReservationId(id)
          );

          const serviceResponses = await Promise.all(servicePromises);
          const allServices = serviceResponses.flatMap(res =>
            res.success ? res.data : []
          );

          setServices(allServices);
        } else {
          setServices([]);
        }
      } else {
        toast.error(reservationsResponse.message || 'Failed to fetch reservations');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('An error occurred while fetching service requests');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters to services
  const applyFilters = () => {
    let filtered = [...services];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((service) => service.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((service) => service.serviceType === typeFilter);
    }

    setFilteredServices(filtered);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  // Handle type filter change
  const handleTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(e.target.value);
  };

  // Stats cards
  const getStatusCount = (status: string) => {
    return services.filter(service => service.status === status).length;
  };

  // Render "No reservations" state
  if (!hasReservations) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-bold text-gray-900">Service Requests</h1>
        </div>

        <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <h2 className="text-xl font-medium text-gray-900 mb-2">No Active Leases Found</h2>
          <p className="text-gray-600 mb-6">You need to have an active lease to submit service requests.</p>
          <Link href="/tenant/units">
            <Button>View My Units</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Service Requests</h1>
        <Link href="/tenant/services/create">
          <Button
            variant="primary"
            leftIcon={
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            New Service Request
          </Button>
        </Link>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-yellow-800">Pending</h3>
                <p className="text-2xl font-bold text-yellow-900">{getStatusCount('pending')}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-blue-800">In Progress</h3>
                <p className="text-2xl font-bold text-blue-900">{getStatusCount('in-progress')}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-green-800">Completed</h3>
                <p className="text-2xl font-bold text-green-900">{getStatusCount('completed')}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-red-800">Cancelled</h3>
                <p className="text-2xl font-bold text-red-900">{getStatusCount('cancelled')}</p>
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
              label="Status"
              id="statusFilter"
              name="statusFilter"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              options={statusOptions}
              fullWidth
            />
          </div>
          <div className="w-full sm:w-64">
            <Select
              label="Service Type"
              id="typeFilter"
              name="typeFilter"
              value={typeFilter}
              onChange={handleTypeFilterChange}
              options={typeOptions}
              fullWidth
            />
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <ServiceList
          services={filteredServices}
          isLoading={isLoading}
          refetch={fetchServices}
          forTenant={true}
        />
      </div>
    </div>
  );
}