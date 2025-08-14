'use client';

import { useEffect, useState } from 'react';
import { ServiceOrder } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import ServiceOrderExpenseFilter from './ServiceOrderExpenseFilter';
import ServiceOrderExpenseModal from './ServiceOrderExpenseModal';

interface ServiceOrderExpenseListProps {
    services: ServiceOrder[];
    isLoading: boolean;
    onFilterChange: (filtered: ServiceOrder[]) => void;
    onExpenseCreated: (serviceId: number) => void;
    onRefresh: () => void;
}

export default function ServiceOrderExpenseList({
    services,
    isLoading,
    onFilterChange,
    onExpenseCreated,
    onRefresh,
}: ServiceOrderExpenseListProps) {
    const [filteredServices, setFilteredServices] = useState<ServiceOrder[]>(services);
    const [selectedService, setSelectedService] = useState<ServiceOrder | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Update filtered services when services prop changes
    useEffect(() => {
        setFilteredServices(services);
    }, [services]);

    const handleFilterChange = (filtered: ServiceOrder[]) => {
        setFilteredServices(filtered);
        onFilterChange(filtered);
    };

    const handleCreateExpense = (service: ServiceOrder) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const handleExpenseCreated = (serviceId: number) => {
        setIsModalOpen(false);
        setSelectedService(null);
        onExpenseCreated(serviceId);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedService(null);
    };

    // Translate service status
    const translateStatus = (status: string) => {
        switch (status) {
            case 'pending': return 'قيد الانتظار';
            case 'in-progress': return 'قيد التنفيذ';
            case 'completed': return 'مكتمل';
            case 'rejected': return 'مرفوض';
            default: return status.replace('-', ' ');
        }
    };

    // Translate service type
    const translateServiceType = (type: string) => {
        switch (type) {
            case 'maintenance': return 'صيانة';
            case 'financial': return 'مالي';
            case 'administrative': return 'إداري';
            default: return type;
        }
    };

    // Get status badge class
    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="p-6 text-center">
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
                    <p className="text-gray-600">جاري تحميل طلبات الخدمة...</p>
                </div>
            </div>
        );
    }

    // No services state
    if (services.length === 0) {
        return (
            <div className="p-8 text-center bg-white rounded-lg shadow-sm">
                <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد طلبات خدمة مكتملة</h3>
                <p className="text-gray-500 mb-4">
                    لا توجد طلبات خدمة مكتملة في النظام حالياً. يمكنك تحديث الصفحة للتحقق من وجود طلبات جديدة.
                </p>
                <div className="space-y-3">
                    <Button onClick={onRefresh} className="mr-2">
                        تحديث الصفحة
                    </Button>
                    <p className="text-xs text-gray-400">
                        تأكد من أن طلبات الخدمة مكتملة ولديها سعر محدد
                    </p>
                </div>
            </div>
        );
    }

    // No filtered results
    if (filteredServices.length === 0 && services.length > 0) {
        return (
            <div>
                <ServiceOrderExpenseFilter services={services} onFilterChange={handleFilterChange} />
                <div className="p-8 text-center bg-white rounded-lg shadow-sm">
                    <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد نتائج مطابقة</h3>
                    <p className="text-gray-500 mb-4">
                        لا توجد طلبات خدمة مطابقة للفلاتر المحددة. جرب تغيير الفلاتر للحصول على نتائج مختلفة.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Component */}
            <ServiceOrderExpenseFilter services={services} onFilterChange={handleFilterChange} />

            {/* Results Summary */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                    طلبات الخدمة المكتملة ({filteredServices.length})
                </h3>
                {filteredServices.length !== services.length && (
                    <p className="text-sm text-gray-500">
                        عرض {filteredServices.length} من أصل {services.length}
                    </p>
                )}
            </div>

            {/* Services Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    رقم الطلب
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    نوع الخدمة
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    الوصف
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    معلومات الوحدة والمبنى
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    معلومات المستأجر
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    سعر الخدمة
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    تاريخ الإكمال
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    الإجراءات
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredServices.map(service => (
                                <tr key={service.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className="text-sm font-medium text-gray-900">#{service.id}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className="text-sm font-medium">{translateServiceType(service.serviceType)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-sm text-gray-900 truncate max-w-xs" title={service.description}>
                                            {service.description.length > 50
                                                ? `${service.description.substring(0, 50)}...`
                                                : service.description}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-sm text-gray-900">
                                            {service.reservation?.unit?.unitNumber ? (
                                                <div>وحدة: {service.reservation.unit.unitNumber}</div>
                                            ) : (
                                                <div className="text-gray-400">غير محدد</div>
                                            )}
                                            {service.reservation?.unit?.building?.name ? (
                                                <div>مبنى: {service.reservation.unit.building.name}</div>
                                            ) : (
                                                <div className="text-gray-400">غير محدد</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-sm text-gray-900">
                                            {service.reservation && service.reservation.user?.fullName ? (
                                                <div>{service.reservation.user.fullName}</div>
                                            ) : (
                                                <div className="text-gray-400">غير محدد</div>
                                            )}
                                            {service.reservation && service.reservation.user?.phone ? (
                                                <div className="text-gray-500">{service.reservation.user.phone}</div>
                                            ) : (
                                                <div className="text-gray-400">غير محدد</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className="text-sm font-bold text-green-600">
                                            {parseFloat(service.servicePrice?.toString() || '0').toFixed(2)} OMR
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="text-sm text-gray-900">{formatDate(service.updatedAt)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Button
                                            size="sm"
                                            onClick={() => handleCreateExpense(service)}
                                        >
                                            إنشاء مصروف
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Expense Creation Modal */}
            {selectedService && (
                <ServiceOrderExpenseModal
                    service={selectedService}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onExpenseCreated={handleExpenseCreated}
                />
            )}
        </div>
    );
}
