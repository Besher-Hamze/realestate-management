'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { ServiceOrder } from '@/lib/types';
import { servicesApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FormInput, FormSelect, FormTextArea } from '@/components/ui/FormInputs';
import React from 'react';

interface ServiceEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Service type options
const serviceTypeOptions = [
  { value: 'maintenance', label: 'صيانة' },
  { value: 'financial', label: 'مالي' },
  { value: 'administrative', label: 'إداري' },
];

// Service status options
const statusOptions = [
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'in-progress', label: 'قيد التنفيذ' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغي' },
];

// Subtype options based on main type
const subtypeOptions = {
  maintenance: [
    { value: 'electrical', label: 'كهربائي' },
    { value: 'plumbing', label: 'سباكة' },
    { value: 'hvac', label: 'تكييف وتدفئة' },
    { value: 'appliance', label: 'أجهزة منزلية' },
    { value: 'structural', label: 'هيكلي' },
    { value: 'general', label: 'عام' },
  ],
  financial: [
    { value: 'postpone_payment', label: 'تأجيل دفعة' },
    { value: 'advance_payment', label: 'تقديم دفعة' },
    { value: 'replace_check', label: 'استبدال شيك' },
    { value: 'other_financial', label: 'أخرى (مالية)' },
  ],
  administrative: [
    { value: 'cancel_contract', label: 'إلغاء عقد' },
    { value: 'renew_contract', label: 'تجديد عقد' },
    { value: 'change_unit', label: 'استبدال وحدة' },
    { value: 'eviction', label: 'إخلاء' },
    { value: 'other_administrative', label: 'أخرى (إدارية)' },
  ],
};

export default function ServiceEditPage({ params }: ServiceEditPageProps) {
  // Use React.use() to unwrap the params Promise
  const { id } = React.use(params);
  const router = useRouter();

  const [service, setService] = useState<ServiceOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    serviceType: '',
    serviceSubtype: '',
    description: '',
    status: '',
  });

  // Load service data
  useEffect(() => {
    fetchService();
  }, [id]);

  const fetchService = async () => {
    try {
      setIsLoading(true);
      const response = await servicesApi.getById(id);

      if (response.success) {
        const serviceData = response.data;
        setService(serviceData);
        setFormData({
          serviceType: serviceData.serviceType || '',
          serviceSubtype: serviceData.serviceSubtype || '',
          description: serviceData.description || '',
          status: serviceData.status || '',
        });
      } else {
        toast.error(response.message || 'فشل في جلب تفاصيل الخدمة');
        router.push('/dashboard/services');
      }
    } catch (error) {
      console.error('خطأ في جلب الخدمة:', error);
      toast.error('حدث خطأ أثناء جلب تفاصيل الخدمة');
      router.push('/dashboard/services');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset subtype when main type changes
      ...(name === 'serviceType' ? { serviceSubtype: '' } : {})
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.serviceType || !formData.serviceSubtype || !formData.description) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await servicesApi.update(id, {
        serviceType: formData.serviceType,
        serviceSubtype: formData.serviceSubtype,
        description: formData.description,
        status: formData.status,
      });

      if (response.success) {
        toast.success('تم تحديث طلب الخدمة بنجاح');
        router.push(`/dashboard/services/${id}`);
        router.refresh(); // Force refresh the page data
      } else {
        toast.error(response.message || 'فشل في تحديث طلب الخدمة');
      }
    } catch (error) {
      console.error('خطأ في تحديث الخدمة:', error);
      toast.error('حدث خطأ أثناء تحديث طلب الخدمة');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available subtypes based on selected main type
  const getSubtypeOptions = () => {
    if (!formData.serviceType || !subtypeOptions[formData.serviceType as keyof typeof subtypeOptions]) {
      return [];
    }
    return subtypeOptions[formData.serviceType as keyof typeof subtypeOptions];
  };

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
          <p className="text-gray-600">جاري تحميل تفاصيل طلب الخدمة...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">طلب الخدمة غير موجود</h2>
        <p className="text-gray-600 mb-6">طلب الخدمة الذي تبحث عنه غير موجود أو ليس لديك صلاحية لتعديله.</p>
        <Link href="/dashboard/services">
          <Button>العودة إلى طلبات الخدمة</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with breadcrumbs */}
      <div className="flex flex-col space-y-4">
        <nav className="text-sm text-gray-500 mb-2">
          <ol className="flex space-x-2">
            <li>
              <Link href="/dashboard" className="hover:text-primary-600">لوحة التحكم</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <Link href="/dashboard/services" className="hover:text-primary-600">طلبات الخدمة</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <Link href={`/dashboard/services/${id}`} className="hover:text-primary-600">#{service.id}</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">تعديل</span>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            تعديل طلب الخدمة #{service.id}
          </h1>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">تعديل تفاصيل الطلب</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Service Type */}
            <div>
              <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-1">
                نوع الخدمة *
              </label>
              <select
                id="serviceType"
                name="serviceType"
                value={formData.serviceType}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">اختر نوع الخدمة</option>
                {serviceTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Subtype */}
            <div>
              <label htmlFor="serviceSubtype" className="block text-sm font-medium text-gray-700 mb-1">
                النوع الفرعي للخدمة *
              </label>
              <select
                id="serviceSubtype"
                name="serviceSubtype"
                value={formData.serviceSubtype}
                onChange={handleInputChange}
                required
                disabled={!formData.serviceType}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {formData.serviceType ? 'اختر النوع الفرعي' : 'اختر نوع الخدمة أولاً'}
                </option>
                {getSubtypeOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              حالة الطلب *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">اختر حالة الطلب</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              وصف الطلب *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="صف المشكلة أو الطلب بالتفصيل..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Link href={`/dashboard/services/${id}`}>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                إلغاء
              </Button>
            </Link>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              حفظ التغييرات
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
