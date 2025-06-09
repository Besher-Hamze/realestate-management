import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { ServiceOrder, ServiceType } from '@/lib/types';
import Button from '@/components/ui/Button';
import { ServiceListFilter } from './ServiceListFilter';

interface ServiceListProps {
  services: ServiceOrder[];
  isLoading: boolean;
  refetch: () => void;
  forTenant?: boolean;
}

export default function ServiceList({
  services,
  isLoading,
  refetch,
  forTenant = false,
}: ServiceListProps) {
  const router = useRouter();
  const [filteredServices, setFilteredServices] = useState<ServiceOrder[]>(services);

  // Update filtered services when services prop changes
  useState(() => {
    setFilteredServices(services);
  }, [services]);

  // عرض حالة التحميل
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

  // عرض حالة عدم وجود خدمات
  if (services.length === 0) {
    return (
      <div className="p-8 text-center">
        <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد طلبات خدمة</h3>
        <p className="text-gray-500 mb-4">
          {forTenant
            ? 'لم تقم بتقديم أي طلبات خدمة بعد. يمكنك تقديم طلب جديد عند الحاجة.'
            : 'لا توجد طلبات خدمة في النظام.'}
        </p>
        {forTenant && (
          <Link href="/tenant/services/create">
            <Button>تقديم طلب خدمة</Button>
          </Link>
        )}
      </div>
    );
  }

  // عرض حالة عدم وجود نتائج مفلترة
  if (filteredServices.length === 0 && services.length > 0) {
    return (
      <div>
        <ServiceListFilter services={services} onFilterChange={setFilteredServices} />
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

  // ترجمة حالة الخدمة
  const translateStatus = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'in-progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      case 'rejected': return 'مرفوض';
      default: return status.replace('-', ' ');
    }
  };

  // ترجمة نوع الخدمة
  const translateServiceType = (type: string) => {
    switch (type) {
      case 'maintenance': return 'صيانة';
      case 'financial': return 'مالي';
      case 'administrative': return 'إداري';
      default: return type;
    }
  };

  // ترجمة النوع الفرعي للخدمة
  const translateServiceSubtype = (subtype: string) => {
    switch (subtype) {
      // Maintenance category
      case 'electrical': return 'كهربائي';
      case 'plumbing': return 'سباكة';
      case 'hvac': return 'تكييف وتدفئة';
      case 'appliance': return 'أجهزة منزلية';
      case 'structural': return 'هيكلي';
      case 'general': return 'عام';
      case 'general_cleaning': return 'تنظيف عام';
      case 'deep': return 'تنظيف عميق';
      case 'windows': return 'تنظيف نوافذ';
      case 'carpets': return 'تنظيف سجاد';
      // Financial category
      case 'postpone_payment': return 'تأجيل دفعة';
      case 'advance_payment': return 'تقديم دفعة';
      case 'replace_check': return 'استبدال شيك';
      case 'other_financial': return 'أخرى (مالية)';
      // Administrative category
      case 'cancel_contract': return 'إلغاء عقد';
      case 'renew_contract': return 'تجديد عقد';
      case 'change_unit': return 'استبدال وحدة';
      case 'eviction': return 'إخلاء';
      case 'other_administrative': return 'أخرى (إدارية)';
      // Existing extra keys
      case 'locksmith': return 'أقفال';
      case 'camera': return 'كاميرات أمنية';
      case 'alarm': return 'نظام إنذار';
      default: return subtype;
    }
  };

  // الحصول على لون شارة الحالة
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Component */}
      <ServiceListFilter services={services} onFilterChange={setFilteredServices} />

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          طلبات الخدمة ({filteredServices.length})
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
                  تاريخ التقديم
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
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
                    <div className="flex items-center justify-start">
                      <span className="text-sm font-medium">{translateServiceType(service.serviceType)}</span>
                      <span className="mr-2 text-sm text-gray-500">({translateServiceSubtype(service.serviceSubtype)})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm text-gray-900 truncate max-w-xs" title={service.description}>
                      {service.description.length > 50
                        ? `${service.description.substring(0, 50)}...`
                        : service.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">{formatDate(service.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(service.status)}`}>
                      {translateStatus(service.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={forTenant ? `/tenant/services/${service.id}` : `/dashboard/services/${service.id}`}>
                      <Button size="sm" variant="text">عرض</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}