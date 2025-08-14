'use client';

import { useState } from 'react';
// Mock toast for demonstration
const toast = {
    success: (message: string) => {
        console.log('✅ Success:', message);
        toast.success('نجح: ' + message);
    },
    error: (message: string) => {
        console.log('❌ Error:', message);
        toast.error('خطأ: ' + message);
    }
};

// Mock types for demonstration
interface ServiceOrder {
    id: number;
    serviceType: 'maintenance' | 'financial' | 'administrative';
    servicePrice?: number;
    description: string;
    updatedAt: string;
    completionAttachment?: string;
    reservation?: {
        unit?: {
            unitNumber: string;
            buildingId?: number;
            building?: {
                name: string;
            };
        };
        user?: {
            fullName?: string;
            phone?: string;
        };
    };
    user?: {
        fullName?: string;
        phone?: string;
    };
}

interface ServiceOrderExpenseModalProps {
    service: ServiceOrder;
    isOpen: boolean;
    onClose: () => void;
    onExpenseCreated: (serviceId: number) => void;
}

// Mock API
const expensesApi = {
    createFromServiceOrder: async (serviceId: number, data: any) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true };
    }
};

// Simple Modal Component
function Modal({ isOpen, onClose, children, size = "md" }: {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg";
}) {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl"
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

                <div className={`inline-block w-full ${sizeClasses[size]} p-6 my-8 overflow-hidden text-right align-middle transition-all transform bg-white shadow-xl rounded-lg`}>
                    {children}
                </div>
            </div>
        </div>
    );
}

// Simple Button Component
function Button({
    children,
    type = "button",
    variant = "primary",
    isLoading = false,
    disabled = false,
    onClick,
    ...props
}: {
    children: React.ReactNode;
    type?: "button" | "submit";
    variant?: "primary" | "outline";
    isLoading?: boolean;
    disabled?: boolean;
    onClick?: () => void;
}) {
    const baseClasses = "px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    const variantClasses = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        outline: "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500"
    };

    return (
        <button
            type={type}
            className={`${baseClasses} ${variantClasses[variant]}`}
            disabled={disabled || isLoading}
            onClick={onClick}
            {...props}
        >
            {isLoading ? (
                <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جاري المعالجة...
                </div>
            ) : children}
        </button>
    );
}

export default function ServiceOrderExpenseModal({
    service,
    isOpen,
    onClose,
    onExpenseCreated,
}: ServiceOrderExpenseModalProps) {
    const [formData, setFormData] = useState({
        responsibleParty: 'owner' as 'owner' | 'tenant',
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async () => {
        if (!formData.responsibleParty) {
            toast.error('يرجى تحديد من يجب عليه الدفع');
            return;
        }

        try {
            setIsSubmitting(true);

            const response = await expensesApi.createFromServiceOrder(service.id, {
                responsibleParty: formData.responsibleParty,
                notes: formData.notes || undefined,
            });

            if (response.success) {
                toast.success('تم إنشاء المصروف بنجاح');
                onExpenseCreated(service.id);
                onClose();
            } else {
                toast.error('فشل في إنشاء المصروف');
            }
        } catch (error: any) {
            console.error('Error creating expense from service order:', error);
            toast.error(error.message || 'حدث خطأ في إنشاء المصروف');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get required information
    const tenantName = service.reservation?.user?.fullName || 'غير محدد';
    const unitNumber = service.reservation?.unit?.unitNumber || 'غير محدد';
    const buildingName = service.reservation?.unit?.building?.name || 'غير محدد';
    const serviceAmount = parseFloat(service.servicePrice?.toString() || '0').toFixed(2);

    // Check if service has required data
    const hasRequiredData = service.servicePrice && service.reservation?.unit?.buildingId;

    const serviceTypeLabels = {
        maintenance: 'صيانة',
        financial: 'مالي',
        administrative: 'إداري'
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                    إنشاء مصروف #{service.id}
                </h2>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="space-y-4">
                {/* Warning for missing data */}
                {!hasRequiredData && (
                    <div className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <svg className="w-5 h-5 text-yellow-400 mt-0.5 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm">
                            <p className="font-medium text-yellow-800">بيانات ناقصة</p>
                            <p className="text-yellow-700 mt-1">
                                {!service.servicePrice && 'سعر الخدمة غير محدد. '}
                                {!service.reservation?.unit?.buildingId && 'معرف المبنى غير محدد.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Compact Service Info */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-medium text-gray-900">تفاصيل الخدمة</h3>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="text-gray-600">النوع:</span>
                            <span className="mr-2 font-medium">{serviceTypeLabels[service.serviceType]}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">المبلغ:</span>
                            <span className="mr-2 font-bold text-green-600">{serviceAmount} OMR</span>
                        </div>
                        <div>
                            <span className="text-gray-600">الوحدة:</span>
                            <span className="mr-2">{unitNumber}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">المبنى:</span>
                            <span className="mr-2">{buildingName}</span>
                        </div>
                    </div>

                    <div className="text-sm">
                        <span className="text-gray-600">الوصف:</span>
                        <p className="mt-1 text-gray-800">{service.description}</p>
                    </div>
                </div>

                {/* Compact People Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">معلومات الأطراف</h3>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                        <div>
                            <span className="text-blue-700 font-medium">المستأجر:</span>
                            <p className="text-gray-800">{service.reservation?.user?.fullName}</p>
                            {service.reservation && service.reservation.user?.phone && (
                                <p className="text-gray-500 text-xs">{service.reservation.user.phone}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-4">
                    {/* Responsible Party */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            من يجب عليه الدفع <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.responsibleParty}
                            onChange={(e) => handleInputChange('responsibleParty', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="owner">المالك</option>
                            <option value="tenant">المستأجر</option>
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            ملاحظات إضافية
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            rows={3}
                            placeholder="ملاحظات اختيارية..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                    </div>
                </div>

                {/* Auto-filled data summary */}
                <div className="bg-green-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-green-800 mb-2">سيتم إنشاء المصروف بالبيانات التالية:</h4>
                    <div className="text-xs text-green-700 space-y-1">
                        <p>• المبنى: {buildingName} - الوحدة: {unitNumber}</p>
                        <p>• المبلغ: {serviceAmount} OMR</p>
                        <p>• التاريخ: {new Date().toLocaleDateString('ar-SA')}</p>
                        <p>• النوع: {serviceTypeLabels[service.serviceType]}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        إلغاء
                    </Button>
                    <Button
                        type="button"
                        isLoading={isSubmitting}
                        disabled={isSubmitting || !hasRequiredData}
                        onClick={handleSubmit}
                    >
                        {hasRequiredData ? 'إنشاء المصروف' : 'غير متاح'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

