'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ServiceOrder } from '@/lib/types';
import { servicesApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ServiceHistory from '@/components/services/ServiceHistory';
import ServiceComments from '@/components/services/ServiceComments';
import { formatDate } from '@/lib/utils';

interface TenantServiceDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function TenantServiceDetailPage({ params }: TenantServiceDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [service, setService] = useState<ServiceOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // جلب تفاصيل الخدمة عند تحميل المكون
  useEffect(() => {
    fetchService();
  }, [id]);

  // جلب بيانات الخدمة
  const fetchService = async () => {
    try {
      setIsLoading(true);
      const response = await servicesApi.getById(id);
      console.log(response);

      if (response.success) {
        // Parse serviceHistory if it's a JSON string
        const serviceData = { ...response.data };

        if (serviceData.serviceHistory && typeof serviceData.serviceHistory === 'string') {
          try {
            serviceData.serviceHistory = JSON.parse(serviceData.serviceHistory);
          } catch (parseError) {
            console.error('Error parsing serviceHistory:', parseError);
            serviceData.serviceHistory = []; // Fallback to empty array
          }
        }

        // Ensure serviceHistory is an array
        if (!Array.isArray(serviceData.serviceHistory)) {
          serviceData.serviceHistory = [];
        }

        setService(serviceData);
      } else {
        toast.error(response.message || 'فشل في جلب تفاصيل الخدمة');
      }
    } catch (error) {
      console.error('خطأ في جلب الخدمة:', error);
      toast.error('حدث خطأ أثناء جلب تفاصيل الخدمة');
    } finally {
      setIsLoading(false);
    }
  };

  // حذف الخدمة
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await servicesApi.delete(id);

      if (response.success) {
        toast.success('تم حذف طلب الخدمة بنجاح');
        router.push('/tenant/services');
      } else {
        toast.error(response.message || 'فشل في حذف طلب الخدمة');
        setDeleteModalOpen(false);
      }
    } catch (error) {
      console.error('خطأ في حذف الخدمة:', error);
      toast.error('حدث خطأ أثناء حذف طلب الخدمة');
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // التحقق من إمكانية التعديل (فقط الطلبات المعلقة)
  const canEdit = () => {
    return service && service.status === 'pending';
  };

  // التحقق من إمكانية الحذف (فقط الطلبات المعلقة)
  const canDelete = () => {
    return service && service.status === 'pending';
  };

  // عرض حالة التحميل
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

  // عرض حالة عدم العثور
  if (!service) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">طلب الخدمة غير موجود</h2>
        <p className="text-gray-600 mb-6">طلب الخدمة الذي تبحث عنه غير موجود أو ليس لديك صلاحية لعرضه.</p>
        <Link href="/tenant/services">
          <Button>العودة إلى طلبات الخدمة</Button>
        </Link>
      </div>
    );
  }

  // الحصول على لون شارة الحالة
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // الحصول على وصف الحالة
  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return 'تم استلام طلبك وهو في انتظار المراجعة.';
      case 'in-progress':
        return 'يعمل فريق الصيانة لدينا حاليًا على طلبك.';
      case 'completed':
        return 'تم إكمال طلبك. يرجى إعلامنا إذا كان لديك أي مشاكل أخرى.';
      case 'cancelled':
      case 'rejected':
        return 'تم إلغاء طلبك. يرجى الاتصال بمدير العقار للحصول على مزيد من المعلومات.';
      default:
        return '';
    }
  };

  // ترجمة حالة الخدمة
  const translateStatus = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'in-progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      case 'cancelled':
      case 'rejected': return 'ملغي';
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
      case 'locksmith': return 'أقفال';
      case 'camera': return 'كاميرات أمنية';
      case 'alarm': return 'نظام إنذار';
      default: return subtype;
    }
  };

  return (
    <div className="space-y-6">
      {/* الترويسة مع مسار التنقل */}
      <div className="flex flex-col space-y-4">
        <nav className="text-sm text-gray-500 mb-2">
          <ol className="flex space-x-2">
            <li>
              <Link href="/tenant" className="hover:text-primary-600">لوحة التحكم</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <Link href="/tenant/services" className="hover:text-primary-600">طلبات الخدمة</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">#{service.id}</span>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            طلب الخدمة #{service.id}
          </h1>

          <div className="flex space-x-3">
            {canEdit() && (
              <Link href={`/tenant/services/${service.id}/edit`}>
                <Button variant="outline">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  تعديل
                </Button>
              </Link>
            )}

            {canDelete() && (
              <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                حذف
              </Button>
            )}

            <Link href="/tenant/services/create">
              <Button variant="primary">طلب جديد</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* تنبيه للطلبات المعلقة */}
      {canEdit() && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mr-3">
              <h3 className="text-sm font-medium text-blue-800">
                يمكنك تعديل أو حذف هذا الطلب
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  نظراً لأن طلبك لا يزال قيد الانتظار، يمكنك تعديله أو حذفه. بمجرد أن يبدأ فريق الصيانة في العمل على طلبك، لن تتمكن من تعديله.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* شريط الحالة */}
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
            {(service.status === 'rejected' || service.status === 'cancelled') && (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="mr-3">
            <h3 className="text-sm font-medium">
              الحالة: {translateStatus(service.status)}
            </h3>
            <div className="mt-1 text-sm">
              <p>{getStatusDescription(service.status)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* تفاصيل الخدمة */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* المعلومات الرئيسية */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">تفاصيل الطلب</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">نوع الخدمة</h3>
                <p className="mt-1 text-base text-gray-900">
                  {translateServiceType(service.serviceType)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">النوع الفرعي للخدمة</h3>
                <p className="mt-1 text-base text-gray-900">
                  {translateServiceSubtype(service.serviceSubtype)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">تاريخ التقديم</h3>
                <p className="mt-1 text-base text-gray-900">
                  {formatDate(service.createdAt)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">آخر تحديث</h3>
                <p className="mt-1 text-base text-gray-900">
                  {formatDate(service.updatedAt)}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">الوصف</h3>
              <div className="p-4 bg-gray-50 rounded-md text-gray-900">
                {service.description}
              </div>
            </div>

            {service.attachmentFileUrl && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">المرفق</h3>
                <a
                  href={service.attachmentFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg className="ml-2 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  عرض المرفق
                </a>
              </div>
            )}
          </div>
        </Card>

        {/* معلومات العقار */}
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات العقار</h2>

              <div className="space-y-4">
                {service.reservation?.unit ? (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">الوحدة</h3>
                      <p className="mt-1 text-base text-gray-900">
                        {service.reservation.unit.unitNumber}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">المبنى</h3>
                      <p className="mt-1 text-base text-gray-900">
                        {service.reservation.unit.building?.name || 'غير متوفر'}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">العنوان</h3>
                      <p className="mt-1 text-base text-gray-900">
                        {service.reservation.unit.building?.address || 'غير متوفر'}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-200">
                      <Link href={`/tenant/units/${service.reservation.unit.id}`}>
                        <Button variant="outline" fullWidth>
                          عرض تفاصيل الوحدة
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">معلومات الوحدة غير متوفرة</p>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">هل تحتاج إلى مزيد من المساعدة؟</h2>
              <p className="text-gray-600 mb-4">
                إذا كنت بحاجة إلى مساعدة إضافية أو لديك أسئلة حول طلب الخدمة الخاص بك، يرجى الاتصال بمدير العقار.
              </p>
              <Link href="/tenant/services/create">
                <Button variant="primary" fullWidth>
                  تقديم طلب آخر
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Additional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service History */}
        <Card>
          <div className="p-6">
            <ServiceHistory service={service} />
          </div>
        </Card>
      </div>

      {/* نافذة تأكيد الحذف */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="حذف طلب الخدمة"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
              disabled={isDeleting}
            >
              حذف
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-gray-600">
            هل أنت متأكد من أنك تريد حذف طلب الخدمة{' '}
            <span className="font-medium">#{service.id}</span>؟
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="mr-3">
                <p className="text-sm text-yellow-700">
                  <strong>تحذير:</strong> لا يمكن التراجع عن هذا الإجراء. سيتم حذف الطلب نهائياً من النظام.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}