'use client';

import { useState, useEffect } from 'react';
import { ServiceOrder } from '@/lib/types';
import Button from '@/components/ui/Button';

interface ServiceOrderExpenseFilterProps {
    services: ServiceOrder[];
    onFilterChange: (filtered: ServiceOrder[]) => void;
}

export default function ServiceOrderExpenseFilter({
    services,
    onFilterChange,
}: ServiceOrderExpenseFilterProps) {
    const [filters, setFilters] = useState({
        serviceType: '',
        searchTerm: '',
        minPrice: '',
        maxPrice: '',
    });

    // Apply filters when filters change
    useEffect(() => {
        applyFilters();
    }, [filters, services]);

    const applyFilters = () => {
        let filtered = [...services];

        // Filter by service type
        if (filters.serviceType) {
            filtered = filtered.filter(service => service.serviceType === filters.serviceType);
        }

        // Filter by search term (description or user name)
        if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(service =>
                service.description.toLowerCase().includes(searchLower) ||
                (service.user?.fullName?.toLowerCase() || '').includes(searchLower) ||
                (service.reservation?.unit?.unitNumber?.toLowerCase() || '').includes(searchLower) ||
                (service.reservation?.unit?.building?.name?.toLowerCase() || '').includes(searchLower)
            );
        }

        // Filter by minimum price
        if (filters.minPrice) {
            const minPrice = parseFloat(filters.minPrice);
            if (!isNaN(minPrice)) {
                filtered = filtered.filter(service => {
                    const servicePrice = parseFloat(service.servicePrice?.toString() || '0');
                    return !isNaN(servicePrice) && servicePrice >= minPrice;
                });
            }
        }

        // Filter by maximum price
        if (filters.maxPrice) {
            const maxPrice = parseFloat(filters.maxPrice);
            if (!isNaN(maxPrice)) {
                filtered = filtered.filter(service => {
                    const servicePrice = parseFloat(service.servicePrice?.toString() || '0');
                    return !isNaN(servicePrice) && servicePrice <= maxPrice;
                });
            }
        }

        onFilterChange(filtered);
    };

    const handleFilterChange = (field: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const clearFilters = () => {
        setFilters({
            serviceType: '',
            searchTerm: '',
            minPrice: '',
            maxPrice: '',
        });
    };

    const serviceTypeOptions = [
        { value: '', label: 'جميع الأنواع' },
        { value: 'maintenance', label: 'صيانة' },
        { value: 'financial', label: 'مالي' },
        { value: 'administrative', label: 'إداري' },
    ];

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="border-b border-gray-200 pb-4 mb-6">
                <h3 className="text-lg font-medium text-gray-900">تصفية النتائج</h3>
                <p className="text-sm text-gray-500 mt-1">استخدم الفلاتر التالية لتضييق نطاق البحث</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Service Type Filter */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                        نوع الخدمة
                    </label>
                    <select
                        value={filters.serviceType}
                        onChange={(e) => handleFilterChange('serviceType', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                        {serviceTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Search Term Filter */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                        بحث
                    </label>
                    <input
                        type="text"
                        value={filters.searchTerm}
                        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                        placeholder="ابحث في الوصف أو اسم المستخدم أو رقم الوحدة"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                </div>

                {/* Minimum Price Filter */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                        الحد الأدنى للسعر
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                            OMR
                        </span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={filters.minPrice}
                            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                            placeholder="0.00"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                    </div>
                </div>

                {/* Maximum Price Filter */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                        الحد الأقصى للسعر
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                            OMR
                        </span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={filters.maxPrice}
                            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                            placeholder="9999.99"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                <Button
                    type="button"
                    variant="outline"
                    onClick={clearFilters}
                >
                    مسح الفلاتر
                </Button>
                <div className="text-sm text-gray-500">
                    {services.length} طلب خدمة متاح
                </div>
            </div>
        </div>
    );
}
