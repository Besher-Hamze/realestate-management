'use client';

import { useState, useEffect } from 'react';
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
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ServiceDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  // Use React.use() to unwrap the params Promise
  const { id } = React.use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [service, setService] = useState<ServiceOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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
            const parsed = JSON.parse(serviceData.serviceHistory);

            // Filter out invalid entries and keep only valid objects
            if (Array.isArray(parsed)) {
              serviceData.serviceHistory = parsed.filter(item =>
                item &&
                typeof item === 'object' &&
                item.status &&
                item.date &&
                typeof item.status === 'string'
              );
            } else {
              serviceData.serviceHistory = [];
            }
          } catch (parseError) {
            console.error('Error parsing serviceHistory:', parseError);
            serviceData.serviceHistory = []; // Fallback to empty array
          }
        }

        // Ensure serviceHistory is an array
        if (!Array.isArray(serviceData.serviceHistory)) {
          serviceData.serviceHistory = [];
        }

        console.log('Processed serviceHistory:', serviceData.serviceHistory);
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
        router.push('/dashboard/services');
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

  // فتح نافذة تحديث الحالة
  const openStatusUpdateModal = (status: string) => {
    setNewStatus(status);
    setStatusUpdateModalOpen(true);
  };

  // تحديث حالة الخدمة
  const handleStatusUpdate = async () => {
    if (!service || !newStatus) return;

    try {
      setIsUpdatingStatus(true);
      const response = await servicesApi.update(service.id, {
        serviceType: service.serviceType,
        serviceSubtype: service.serviceSubtype,
        description: service.description,
        status: newStatus,
      });

      if (response.success) {
        let statusText = '';
        switch (newStatus) {
          case 'pending': statusText = 'قيد الانتظار'; break;
          case 'in-progress': statusText = 'قيد التنفيذ'; break;
          case 'completed': statusText = 'مكتمل'; break;
          case 'rejected': statusText = 'ملغي'; break;
          default: statusText = newStatus.replace('-', ' ');
        }
        toast.success(`تم تحديث حالة طلب الخدمة إلى ${statusText}`);
        setStatusUpdateModalOpen(false);
        // Refresh the service data to show updated status
        await fetchService();
      } else {
        toast.error(response.message || 'فشل في تحديث حالة طلب الخدمة');
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة الخدمة:', error);
      toast.error('حدث خطأ أثناء تحديث حالة طلب الخدمة');
    } finally {
      setIsUpdatingStatus(false);
    }
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
        <Link href="/dashboard/services">
          <Button>العودة إلى طلبات الخدمة</Button>
        </Link>
      </div>
    );
  }

  // ترجمة حالة الخدمة
  const translateStatus = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'in-progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      case 'rejected': return 'ملغي';
      default: return status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
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

  // الحصول على وصف الحالة
  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return 'تم استلام الطلب وهو في انتظار المراجعة والمعالجة.';
      case 'in-progress':
        return 'يعمل فريق الصيانة حاليًا على معالجة هذا الطلب.';
      case 'completed':
        return 'تم إكمال الطلب بنجاح. يمكن إغلاق هذا الطلب.';
      case 'rejected':
        return 'تم رفض أو إلغاء هذا الطلب. تم إشعار المستأجر بالقرار.';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* الترويسة مع مسار التنقل والإجراءات */}
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
              <span className="text-gray-700">#{service.id}</span>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            طلب الخدمة #{service.id}
          </h1>
          {/* <div className="flex space-x-3">
            <Link href={`/dashboard/services/${service.id}/edit`}>
              <Button variant="outline">تعديل</Button>
            </Link>
            <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>حذف</Button>
          </div> */}
        </div>
      </div>

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
            {service.status === 'rejected' && (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="mr-3">
            <h3 className="text-sm font-medium">
              الحالة الحالية: {translateStatus(service.status)}
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">تفاصيل الطلب</h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(service.status)}`}
              >
                {translateStatus(service.status)}
              </span>
            </div>

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

        {/* معلومات العقار والمستأجر */}
        <div className="space-y-6">
          {/* إجراءات تحديث الحالة */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">تحديث الحالة</h2>

              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                  fullWidth
                  disabled={service.status === 'pending'}
                  onClick={() => openStatusUpdateModal('pending')}
                >
                  تحديد كقيد الانتظار
                </Button>

                <Button
                  variant="outline"
                  className="border-blue-500 text-blue-700 hover:bg-blue-50"
                  fullWidth
                  disabled={service.status === 'in-progress'}
                  onClick={() => openStatusUpdateModal('in-progress')}
                >
                  تحديد كقيد التنفيذ
                </Button>

                <Button
                  variant="outline"
                  className="border-green-500 text-green-700 hover:bg-green-50"
                  fullWidth
                  disabled={service.status === 'completed'}
                  onClick={() => openStatusUpdateModal('completed')}
                >
                  تحديد كمكتمل
                </Button>

                <Button
                  variant="outline"
                  className="border-red-500 text-red-700 hover:bg-red-50"
                  fullWidth
                  disabled={service.status === 'rejected'}
                  onClick={() => openStatusUpdateModal('rejected')}
                >
                  تحديد كملغي
                </Button>
              </div>
            </div>
          </Card>

          {/* معلومات العقار */}
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
                      <h3 className="text-sm font-medium text-gray-500">الطابق</h3>
                      <p className="mt-1 text-base text-gray-900">
                        {service.reservation.unit.floor}
                      </p>
                    </div>

                    {user && (user.role === "manager" || user.role === "admin") && <div className="pt-4 mt-4 border-t border-gray-200">
                      <Link href={`/dashboard/units/${service.reservation.unit.id}`}>
                        <Button variant="outline" fullWidth>
                          عرض تفاصيل الوحدة
                        </Button>
                      </Link>
                    </div>}
                  </>
                ) : (
                  <p className="text-gray-500">معلومات الوحدة غير متوفرة</p>
                )}
              </div>
            </div>
          </Card>

          {/* معلومات المستأجر */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات المستأجر</h2>

              <div className="space-y-4">
                {service?.user ? (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">الاسم</h3>
                      <p className="mt-1 text-base text-gray-900">
                        {service.user.fullName}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">البريد الإلكتروني</h3>
                      <p className="mt-1 text-base text-gray-900">
                        {service.user.email}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">الهاتف</h3>
                      <p className="mt-1 text-base text-gray-900">
                        {service.user.phone}
                      </p>
                    </div>

                    {user && (user.role === "manager" || user.role === "admin") &&
                      < div className="pt-4 mt-4 border-t border-gray-200">
                        <Link href={`/dashboard/users/${service.user.id}`}>
                          <Button variant="outline" fullWidth>
                            عرض ملف المستأجر
                          </Button>
                        </Link>
                      </div>
                    }
                  </>
                ) : (
                  <p className="text-gray-500">معلومات المستأجر غير متوفرة</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div >

      {/* مسار الحالة والتعليقات */}
      < div className="grid grid-cols-1 lg:grid-cols-2 gap-6" >
        {/* مسار حالة الطلب */}
        < Card >
          <div className="p-6">
            <ServiceHistory
              service={service}
            />
          </div>
        </Card >


      </div >

      {/* نافذة تأكيد الحذف */}
      < Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)
        }
        title="حذف طلب الخدمة"
        footer={
          < div className="flex justify-end space-x-3" >
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
          </div >
        }
      >
        <p className="text-gray-600">
          هل أنت متأكد من أنك تريد حذف طلب الخدمة هذا؟ لا يمكن التراجع عن هذا الإجراء.
        </p>
      </Modal >

      {/* نافذة تأكيد تحديث الحالة */}
      < Modal
        isOpen={statusUpdateModalOpen}
        onClose={() => setStatusUpdateModalOpen(false)}
        title="تحديث الحالة"
        footer={
          < div className="flex justify-end space-x-3" >
            <Button
              variant="outline"
              onClick={() => setStatusUpdateModalOpen(false)}
              disabled={isUpdatingStatus}
            >
              إلغاء
            </Button>
            <Button
              variant="primary"
              onClick={handleStatusUpdate}
              isLoading={isUpdatingStatus}
              disabled={isUpdatingStatus}
            >
              تحديث الحالة
            </Button>
          </div >
        }
      >
        <p className="text-gray-600">
          هل أنت متأكد من أنك تريد تغيير الحالة إلى{" "}
          <span className="font-medium">
            {translateStatus(newStatus)}
          </span>
          ؟
        </p>
        {
          newStatus === 'rejected' && (
            <p className="mt-2 text-red-600 text-sm">
              ملاحظة: إلغاء طلب الخدمة سيؤدي إلى إخطار المستأجر بأن طلبه لن تتم معالجته.
            </p>
          )
        }
        {
          newStatus === 'completed' && (
            <p className="mt-2 text-green-600 text-sm">
              ملاحظة: تحديد الطلب كمكتمل سيؤدي إلى إخطار المستأجر بأن طلبه قد تم حله بنجاح.
            </p>
          )
        }
        {
          newStatus === 'in-progress' && (
            <p className="mt-2 text-blue-600 text-sm">
              ملاحظة: تحديد الطلب كقيد التنفيذ سيؤدي إلى إخطار المستأجر بأن العمل قد بدأ.
            </p>
          )
        }
      </Modal >
    </div >
  );
}