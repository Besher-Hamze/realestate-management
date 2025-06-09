'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import { reservationsApi, servicesApi } from '@/lib/api';
import { Reservation, ServiceOrder } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import TenantServicesSummary from '@/components/dashboard/TenantServicesSummary';

export default function TenantDashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);

  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        setIsLoading(true);

        // جلب حجوزات المستأجر
        const reservationsResponse = await reservationsApi.getMy();
        if (reservationsResponse.success) {
          setReservations(reservationsResponse.data);

          // جلب طلبات الخدمة لكل حجز
          if (reservationsResponse.data.length > 0) {
            const reservationIds = reservationsResponse.data.map(res => res.id);
            const servicePromises = reservationIds.map(id =>
              servicesApi.getByReservationId(id)
            );

            const serviceResponses = await Promise.all(servicePromises);
            const allServices = serviceResponses.flatMap(res =>
              res.success ? res.data : []
            );

            setServiceOrders(allServices);
          }
        }
      } catch (error) {
        console.error('خطأ في جلب بيانات المستأجر:', error);
        toast.error('فشل في تحميل بيانات المستأجر');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantData();
  }, []);

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
          <p className="text-gray-600">جاري تحميل بيانات المستأجر...</p>
        </div>
      </div>
    );
  }

  // الحصول على العدد للإحصائيات
  const activeReservations = reservations.filter(r => r.status === 'active').length;
  const pendingServices = serviceOrders.filter(s => s.status === 'pending').length;
  const inProgressServices = serviceOrders.filter(s => s.status === 'in-progress').length;
  const completedServices = serviceOrders.filter(s => s.status === 'completed').length;

  // ترجمة حالة الحجز
  const translateReservationStatus = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'pending': return 'قيد الانتظار';
      case 'expired': return 'منتهي';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // ترجمة حالة الخدمة
  const translateServiceStatus = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'in-progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
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
      {/* رسالة الترحيب */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">مرحباً، {user?.fullName || 'المستأجر'}!</h1>
        <p className="mt-2 text-gray-600">
          إليك نظرة عامة على عقاراتك المستأجرة وطلبات الخدمة.
        </p>
      </div>

      {/* إحصائيات المستأجر */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">نظرة عامة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="h-full">
            <div className="flex items-center">
              <div className="rounded-lg p-3 bg-green-100">
                <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="text-sm font-medium text-gray-500">عقود الإيجار النشطة</h3>
                <p className="mt-1 text-xl font-semibold text-gray-900">{activeReservations}</p>
              </div>
            </div>
          </Card>

          <Card className="h-full">
            <div className="flex items-center">
              <div className="rounded-lg p-3 bg-yellow-100">
                <svg className="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="text-sm font-medium text-gray-500">طلبات الخدمة</h3>
                <p className="mt-1 text-xl font-semibold text-gray-900">{serviceOrders.length}</p>
              </div>
            </div>
          </Card>

          <Card className="h-full">
            <div className="flex items-center">
              <div className="rounded-lg p-3 bg-red-100">
                <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="text-sm font-medium text-gray-500">الطلبات قيد الانتظار</h3>
                <p className="mt-1 text-xl font-semibold text-gray-900">{pendingServices + inProgressServices}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* الوحدات المستأجرة الأخيرة */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">وحداتي المستأجرة</h2>
          <Link href="/tenant/units" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            عرض الكل
          </Link>
        </div>

        {reservations.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-500">ليس لديك أي وحدات مستأجرة حتى الآن.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservations.slice(0, 3).map((reservation) => (
              <Card key={reservation.id} className="h-full">
                <div className="p-1">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {reservation.unit?.unitNumber || 'وحدة'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {reservation.unit?.building?.name || 'مبنى'}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reservation.status === 'active' ? 'bg-green-100 text-green-800' :
                      reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        reservation.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                      }`}>
                      {translateReservationStatus(reservation.status)}
                    </span>
                  </div>

                  <div className="text-sm">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                      <div>
                        <span className="text-gray-500">تاريخ البدء:</span>
                        <p className="font-medium">{formatDate(reservation.startDate)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">تاريخ الانتهاء:</span>
                        <p className="font-medium">{formatDate(reservation.endDate)}</p>
                      </div>
                    </div>

                    {reservation.unit && (
                      <div className="mt-2 border-t border-gray-100 pt-2">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">

                          <div>
                            <span className="text-gray-500">الحمامات:</span>
                            <p className="font-medium">{reservation.unit.bathrooms}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">المساحة:</span>
                            <p className="font-medium">{reservation.unit.area} م²</p>
                          </div>
                          <div>
                            <span className="text-gray-500">الطابق:</span>
                            <p className="font-medium">{reservation.unit.floor}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <Link href={`/tenant/units/${reservation.unitId}`} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      عرض التفاصيل
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* طلبات الخدمة الأخيرة */}
      <div>
        <TenantServicesSummary limit={5} />
      </div>

      {/* الإجراءات السريعة */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/tenant/services/create">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex flex-col items-center p-4 text-center">
                <div className="rounded-full p-3 bg-green-100 mb-3">
                  <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="font-medium">تقديم طلب خدمة</h3>
              </div>
            </Card>
          </Link>

          <Link href="/tenant/units">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex flex-col items-center p-4 text-center">
                <div className="rounded-full p-3 bg-blue-100 mb-3">
                  <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h3 className="font-medium">عرض وحداتي</h3>
              </div>
            </Card>
          </Link>

          <Link href="/tenant/profile">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex flex-col items-center p-4 text-center">
                <div className="rounded-full p-3 bg-purple-100 mb-3">
                  <svg className="h-6 w-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="font-medium">تحديث الملف الشخصي</h3>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}