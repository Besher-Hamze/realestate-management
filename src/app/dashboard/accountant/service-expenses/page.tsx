'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ServiceOrder } from '@/lib/types';
import { expensesApi } from '@/lib/api';
import ServiceOrderExpenseList from '@/components/accountant/ServiceOrderExpenseList';
import Card from '@/components/ui/Card';

export default function AccountantServiceExpensesPage() {
    const [services, setServices] = useState<ServiceOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filteredServices, setFilteredServices] = useState<ServiceOrder[]>([]);

    // Helper function to safely parse service price
    const parseServicePrice = (price: any): number => {
        if (typeof price === 'number') return price;
        if (typeof price === 'string') {
            const parsed = parseFloat(price);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    };

    // Load service orders on component mount
    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            setIsLoading(true);
            const response = await expensesApi.getCompletedServiceOrdersForExpense();
            if (response.success) {
                // Handle the nested data structure from the API
                const servicesData = response.data || [];

                if (Array.isArray(servicesData)) {
                    setServices(servicesData);
                    setFilteredServices(servicesData);
                } else {
                    console.error('Invalid services data structure:', servicesData);
                    toast.error('بيانات غير صحيحة من الخادم');
                    setServices([]);
                    setFilteredServices([]);
                }
            } else {
                toast.error('فشل في تحميل طلبات الخدمة المكتملة');
            }
        } catch (error) {
            console.error('Error loading completed service orders:', error);
            toast.error('حدث خطأ في تحميل طلبات الخدمة المكتملة');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExpenseCreated = (serviceId: number) => {
        // Remove the service from the list since expense was created
        setServices(prev => prev.filter(service => service.id !== serviceId));
        setFilteredServices(prev => prev.filter(service => service.id !== serviceId));
        toast.success('تم إنشاء المصروف بنجاح');
    };

    const handleFilterChange = (filtered: ServiceOrder[]) => {
        setFilteredServices(filtered);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        إنشاء مصروفات من طلبات الخدمة
                    </h1>
                    <p className="text-gray-600 mt-2">
                        عرض طلبات الخدمة المكتملة وإنشاء مصروفات منها
                    </p>
                </div>
                <button
                    onClick={loadServices}
                    disabled={isLoading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isLoading ? (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    )}
                    تحديث
                </button>
            </div>

            {/* Statistics Card */}
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-primary-600">
                            {services.length}
                        </div>
                        <div className="text-sm text-gray-600">إجمالي الطلبات المكتملة</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {services.reduce((sum, service) => sum + parseServicePrice(service.servicePrice), 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">إجمالي قيمة الخدمات (OMR)</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {filteredServices.length}
                        </div>
                        <div className="text-sm text-gray-600">الطلبات المفلترة</div>
                    </div>
                </div>
            </Card>

            {/* Service Orders List */}
            <ServiceOrderExpenseList
                services={services}
                isLoading={isLoading}
                onFilterChange={handleFilterChange}
                onExpenseCreated={handleExpenseCreated}
                onRefresh={loadServices}
            />
        </div>
    );
}
