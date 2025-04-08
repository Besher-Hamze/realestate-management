'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Unit, UnitStatus } from '@/lib/types';
import { unitsApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import UnitList from '@/components/units/UnitList';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Status filter options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'available', label: 'Available' },
    { value: 'rented', label: 'Rented' },
  ];

  // Fetch units on component mount
  useEffect(() => {
    fetchUnits();
  }, []);

  // Apply filters when units or status filter changes
  useEffect(() => {
    applyFilters();
  }, [units, statusFilter]);

  // Fetch units data
  const fetchUnits = async () => {
    try {
      setIsLoading(true);
      const response = await unitsApi.getAll();
      
      if (response.success) {
        setUnits(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch units');
      }
    } catch (error) {
      console.error('Error fetching units:', error);
      toast.error('An error occurred while fetching units');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters to units
  const applyFilters = () => {
    let filtered = [...units];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((unit) => unit.status === statusFilter);
    }
    
    setFilteredUnits(filtered);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  // Handle unit deletion
  const handleDelete = (id: number) => {
    setUnits((prevUnits) => prevUnits.filter((unit) => unit.id !== id));
  };

  // Stats cards
  const getStatusCount = (status: UnitStatus) => {
    return units.filter(unit => unit.status === status).length;
  };

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Units</h1>
        <Link href="/dashboard/units/create">
          <Button
            variant="primary"
            leftIcon={
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Add Unit
          </Button>
        </Link>
      </div>
      
      {/* Status summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-green-800">Available</h3>
                <p className="text-2xl font-bold text-green-900">{getStatusCount('available')}</p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-blue-800">Rented</h3>
                <p className="text-2xl font-bold text-blue-900">{getStatusCount('rented')}</p>
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
        </div>
      </div>
      
      {/* Units List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <UnitList
          units={filteredUnits}
          isLoading={isLoading}
          onDelete={handleDelete}
          refetch={fetchUnits}
        />
      </div>
    </div>
  );
}