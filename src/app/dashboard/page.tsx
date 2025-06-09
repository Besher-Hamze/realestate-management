'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import { dashboardApi } from '@/lib/api';
import {
  GeneralStatistics,
  UnitStatusStatistics,
  ServiceStatusStatistics
} from '@/lib/types';

// New interface to match the actual API response structure
interface ServiceStatusResponse {
  serviceOrdersByType: {
    serviceType: string;
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    rejected: number;
  }[];
  serviceOrdersByMonth: {
    month: string;
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    rejected: number;
  }[];
}

// New interface for the unit statistics response structure
interface UnitStatusResponse {
  unitsByCompany: {
    companyName: string;
    totalUnits: number;
    availableUnits: number;
    rentedUnits: number;
    maintenanceUnits: number;
  }[];
  unitsByBuilding: {
    buildingName: string;
    companyName: string;
    totalUnits: number;
    availableUnits: number;
    rentedUnits: number;
    maintenanceUnits: number;
  }[];
}

// Service type translation mapping
const serviceTypeTranslations = {
  maintenance: 'صيانة',
  electrical: 'كهربائي',
  plumbing: 'سباكة',
  hvac: 'تكييف وتدفئة',
  appliance: 'أجهزة منزلية',
  structural: 'هيكلي',
  general: 'عام',
  financial: 'مالي',
  administrative: 'إداري',
  cleaning: 'تنظيف',
  security: 'أمن',
  locksmith: 'أقفال',
  camera: 'كاميرات أمنية',
  alarm: 'نظام إنذار'
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [generalStats, setGeneralStats] = useState<GeneralStatistics | null>(null);
  const [unitStats, setUnitStats] = useState<UnitStatusStatistics | null>(null);
  const [serviceStats, setServiceStats] = useState<ServiceStatusStatistics | null>(null);
  const [serviceResponse, setServiceResponse] = useState<ServiceStatusResponse | null>(null);
  const [unitResponse, setUnitResponse] = useState<UnitStatusResponse | null>(null);

  const isAdmin = useAuth().user?.role == "admin";
  // Helper function to transform the unit statistics data
  const transformUnitStats = (data: UnitStatusResponse): UnitStatusStatistics => {
    // Default values if data is invalid
    if (!data || !data.unitsByCompany || !Array.isArray(data.unitsByCompany)) {
      return {
        available: 0,
        rented: 0,
        maintenance: 0,
        total: 0
      };
    }

    // Aggregate data from all companies
    const aggregated: UnitStatusStatistics = {
      available: 0,
      rented: 0,
      maintenance: 0,
      total: 0
    };

    data.unitsByCompany.forEach(company => {
      aggregated.available += company.availableUnits || 0;
      aggregated.rented += company.rentedUnits || 0;
      aggregated.maintenance += company.maintenanceUnits || 0;
      aggregated.total += company.totalUnits || 0;
    });

    return aggregated;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // جلب الإحصائيات العامة (Fetch general statistics)
        const statsResponse = await dashboardApi.getStatistics();
        console.log(statsResponse);

        if (statsResponse.success) {
          setGeneralStats(statsResponse.data);
        }

        // جلب إحصائيات حالة الوحدات (Fetch unit status statistics)
        const unitStatsResponse = await dashboardApi.getUnitsStatus();
        if (unitStatsResponse.success) {
          console.log(unitStatsResponse.data);

          // Store the original response
          setUnitResponse(unitStatsResponse.data);

          // Transform the data to match the expected format
          const transformedUnitStats = transformUnitStats(unitStatsResponse.data);
          setUnitStats(transformedUnitStats);
        }

        // جلب إحصائيات حالة طلبات الخدمة (Fetch service request statistics)
        const serviceStatsResponse = await dashboardApi.getServicesStatus();
        if (serviceStatsResponse.success) {
          console.log(serviceStatsResponse.data);

          // Store the original response
          setServiceResponse(serviceStatsResponse.data);

          // Calculate totals from the received data
          const aggregated: ServiceStatusStatistics = {
            pending: 0,
            inProgress: 0,
            completed: 0,
            rejected: 0,
            total: 0
          };

          // Sum up all service types
          if (serviceStatsResponse.data?.serviceOrdersByType) {
            serviceStatsResponse.data.serviceOrdersByType.forEach(item => {
              aggregated.pending += item.pending;
              aggregated.inProgress += item.inProgress;
              aggregated.completed += item.completed;
              aggregated.rejected += item.rejected;
              aggregated.total += item.total;
            });
          }

          setServiceStats(aggregated);
        }
      } catch (error) {
        console.error('خطأ في جلب بيانات لوحة التحكم:', error);
        toast.error('فشل في تحميل بيانات لوحة التحكم');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // مكون بطاقة الإحصائيات (Stats card component)
  const StatCard = ({ title, value, icon, bgColor }: { title: string; value: number | string; icon: React.ReactNode; bgColor: string }) => (
    <Card className="h-full">
      <div className="flex items-center">
        <div className={`rounded-lg p-3 ${bgColor}`}>{icon}</div>
        <div className="mr-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );

  // عرض حالة التحميل (Display loading state)
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
          <p className="text-gray-600">جاري تحميل بيانات لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6">
      {/* رسالة الترحيب (Welcome message) */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">مرحباً بعودتك، {user?.fullName || 'المستخدم'}!</h1>
        <p className="mt-2 text-gray-600">
          إليك نظرة عامة على نظام إدارة العقارات الخاص بك.
        </p>
      </div>

      {/* الإحصائيات العامة (General statistics) */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">نظرة عامة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي المباني"
            value={generalStats?.totalBuildings || 0}
            icon={
              <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            bgColor="bg-blue-100"
          />

          <StatCard
            title="إجمالي الوحدات"
            value={generalStats?.totalUnits || unitStats?.total || 0}
            icon={
              <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }
            bgColor="bg-green-100"
          />

          <StatCard
            title="إجمالي المستأجرين"
            value={generalStats?.totalTenants || 0}
            icon={
              <svg className="h-6 w-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            bgColor="bg-indigo-100"
          />

          <StatCard
            title="المستأجرين  النشطة"
            value={generalStats?.activeReservations || 0}
            icon={
              <svg className="h-6 w-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            bgColor="bg-purple-100"
          />

          <StatCard
            title="طلبات الخدمة المعلقة"
            value={generalStats?.totalPendingServices || serviceStats?.pending || 0}
            icon={
              <svg className="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            bgColor="bg-yellow-100"
          />

          <StatCard
            title="الإيرادات"
            value={generalStats?.totalPayment ? `${generalStats.totalPayment} $` : '$0'}
            icon={
              <svg className="h-6 w-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            bgColor="bg-emerald-100"
          />
        </div>
      </div>

      {/* حالة الوحدات (Unit status) */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">حالة الوحدات</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="الوحدات المتاحة"
            value={unitStats?.available || 0}
            icon={
              <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            bgColor="bg-green-100"
          />

          <StatCard
            title="الوحدات المؤجرة"
            value={unitStats?.rented || 0}
            icon={
              <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            bgColor="bg-blue-100"
          />

          <StatCard
            title="الوحدات قيد الصيانة"
            value={unitStats?.maintenance || 0}
            icon={
              <svg className="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            bgColor="bg-yellow-100"
          />

          <StatCard
            title="إجمالي الوحدات"
            value={unitStats?.total || 0}
            icon={
              <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
              </svg>
            }
            bgColor="bg-gray-100"
          />
        </div>
      </div>

      {/* حالة طلبات الخدمة (Service request status) */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">طلبات الخدمة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="الطلبات المعلقة"
            value={serviceStats?.pending || 0}
            icon={
              <svg className="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            bgColor="bg-yellow-100"
          />

          <StatCard
            title="قيد التنفيذ"
            value={serviceStats?.inProgress || 0}
            icon={
              <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
            bgColor="bg-blue-100"
          />

          <StatCard
            title="المكتملة"
            value={serviceStats?.completed || 0}
            icon={
              <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            bgColor="bg-green-100"
          />

          <StatCard
            title="المرفوضة"
            value={serviceStats?.rejected || 0}
            icon={
              <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            bgColor="bg-red-100"
          />

          <StatCard
            title="إجمالي الطلبات"
            value={serviceStats?.total || 0}
            icon={
              <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            }
            bgColor="bg-gray-100"
          />
        </div>
      </div>

      {/* إضافة قسم لعرض تفاصيل أنواع الخدمات */}
      {serviceResponse?.serviceOrdersByType && serviceResponse.serviceOrdersByType.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">تفاصيل أنواع الخدمات</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviceResponse.serviceOrdersByType.map((serviceType, index) => (
              <Card key={index} className="p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  {serviceTypeTranslations[serviceType.serviceType as keyof typeof serviceTypeTranslations] || serviceType.serviceType}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">المعلقة:</span>
                    <span className="font-medium">{serviceType.pending}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">قيد التنفيذ:</span>
                    <span className="font-medium">{serviceType.inProgress}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">المكتملة:</span>
                    <span className="font-medium">{serviceType.completed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">المرفوضة:</span>
                    <span className="font-medium">{serviceType.rejected}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-1 border-t border-gray-200">
                    <span>الإجمالي:</span>
                    <span>{serviceType.total}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* إضافة قسم لعرض إحصائيات الطلبات حسب الشهر */}
      {serviceResponse?.serviceOrdersByMonth && serviceResponse.serviceOrdersByMonth.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">إحصائيات الطلبات حسب الشهر</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {
              serviceResponse.serviceOrdersByMonth.map((monthData, index) => {
                // تنسيق التاريخ بالعربية (Format date in Arabic)
                const dateParts = monthData.month.split('-');
                const year = dateParts[0];
                const month = parseInt(dateParts[1]);

                // أسماء الأشهر بالعربية (Arabic month names)
                const arabicMonths = [
                  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
                ];

                const formattedDate = `${arabicMonths[month - 1]} ${year}`;

                return (
                  <Card key={index} className="p-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">{formattedDate}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">المعلقة:</span>
                        <span className="font-medium">{monthData.pending}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">قيد التنفيذ:</span>
                        <span className="font-medium">{monthData.inProgress}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">المكتملة:</span>
                        <span className="font-medium">{monthData.completed}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">المرفوضة:</span>
                        <span className="font-medium">{monthData.rejected}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold pt-1 border-t border-gray-200">
                        <span>الإجمالي:</span>
                        <span>{monthData.total}</span>
                      </div>
                    </div>
                  </Card>
                )

              })}
          </div>


        </div>
      )}


      {/* إضافة قسم لعرض تفاصيل الوحدات حسب المبنى */}
      {unitResponse?.unitsByBuilding && unitResponse.unitsByBuilding.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">تفاصيل الوحدات حسب المبنى</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unitResponse.unitsByBuilding.map((building, index) => (
              <Card key={index} className="p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">{building.buildingName}</h3>
                <p className="text-sm text-gray-500 mb-3">{building.companyName}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">الوحدات المتاحة:</span>
                    <span className="font-medium">{building.availableUnits}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">الوحدات المؤجرة:</span>
                    <span className="font-medium">{building.rentedUnits}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">الوحدات قيد الصيانة:</span>
                    <span className="font-medium">{building.maintenanceUnits}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-1 border-t border-gray-200">
                    <span>إجمالي الوحدات:</span>
                    <span>{building.totalUnits}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* إضافة قسم لعرض تفاصيل الوحدات حسب الشركة */}
      {unitResponse?.unitsByCompany && unitResponse.unitsByCompany.length > 0 && isAdmin && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">تفاصيل الوحدات حسب الشركة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unitResponse.unitsByCompany.map((company, index) => (
              <Card key={index} className="p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">{company.companyName}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">الوحدات المتاحة:</span>
                    <span className="font-medium">{company.availableUnits}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">الوحدات المؤجرة:</span>
                    <span className="font-medium">{company.rentedUnits}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">الوحدات قيد الصيانة:</span>
                    <span className="font-medium">{company.maintenanceUnits}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-1 border-t border-gray-200">
                    <span>إجمالي الوحدات:</span>
                    <span>{company.totalUnits}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}