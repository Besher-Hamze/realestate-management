'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import { dashboardApi } from '@/lib/api';

interface GeneralStatistics {
  totalBuildings: number;
  totalUnits: number;
  unitsByStatus: Array<{ status: string; count: number }>;
  activeReservations: number;
  totalPayment: number;
  pendingServiceOrders: number;
}

interface UnitStatusResponse {
  unitsByCompany: Array<{
    companyName: string;
    totalUnits: number;
    availableUnits: number;
    rentedUnits: number;
    maintenanceUnits: number;
  }>;
  unitsByBuilding: Array<{
    buildingName: string;
    companyName: string;
    totalUnits: number;
    availableUnits: number;
    rentedUnits: number;
    maintenanceUnits: number;
  }>;
}

interface ServiceStatusResponse {
  serviceOrdersByType: Array<{
    serviceType: string;
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    rejected: number;
  }>;
  serviceOrdersByMonth: Array<{
    month: string;
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    rejected: number;
  }>;
}

// Calculated stat types used for display
interface UnitStatusStatistics {
  available: number;
  rented: number;
  maintenance: number;
}

interface ServiceStatusStatistics {
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number; // Note: API uses 'rejected' but UI expects 'cancelled'
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [generalStats, setGeneralStats] = useState<GeneralStatistics | null>(null);
  const [unitStats, setUnitStats] = useState<UnitStatusStatistics | null>(null);
  const [serviceStats, setServiceStats] = useState<ServiceStatusStatistics | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // جلب الإحصائيات العامة (Fetch general statistics)
        const statsResponse = await dashboardApi.getStatistics();
        if (statsResponse.success) {
          setGeneralStats(statsResponse.data);
        }

        // جلب إحصائيات حالة الوحدات (Fetch unit status statistics)
        const unitStatsResponse = await dashboardApi.getUnitsStatus();
        if (unitStatsResponse.success) {
          // Process the unit stats to match what the UI expects
          const unitData = unitStatsResponse.data as UnitStatusResponse;

          // Calculate totals from all companies
          const available = unitData.unitsByCompany.reduce(
            (sum, company) => sum + company.availableUnits, 0
          );
          const rented = unitData.unitsByCompany.reduce(
            (sum, company) => sum + company.rentedUnits, 0
          );
          const maintenance = unitData.unitsByCompany.reduce(
            (sum, company) => sum + company.maintenanceUnits, 0
          );

          setUnitStats({
            available,
            rented,
            maintenance
          });
        }

        // جلب إحصائيات حالة طلبات الخدمة (Fetch service request statistics)
        const serviceStatsResponse = await dashboardApi.getServicesStatus();
        console.log(serviceStatsResponse);

        if (serviceStatsResponse.success) {
          // Process the service stats to match what the UI expects
          const serviceData = serviceStatsResponse.data as ServiceStatusResponse;

          // Calculate totals across all service types
          const pending = serviceData.serviceOrdersByType.reduce(
            (sum, type) => sum + type.pending, 0
          );
          const inProgress = serviceData.serviceOrdersByType.reduce(
            (sum, type) => sum + type.inProgress, 0
          );
          const completed = serviceData.serviceOrdersByType.reduce(
            (sum, type) => sum + type.completed, 0
          );
          const cancelled = serviceData.serviceOrdersByType.reduce(
            (sum, type) => sum + type.rejected, 0
          );

          setServiceStats({
            pending,
            inProgress,
            completed,
            cancelled
          });
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
            value={generalStats?.totalUnits || 0}
            icon={
              <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }
            bgColor="bg-green-100"
          />

          <StatCard
            title="الحجوزات النشطة"
            value={generalStats?.activeReservations || 0}
            icon={
              <svg className="h-6 w-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            bgColor="bg-purple-100"
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

        </div>
      </div>

      {/* حالة طلبات الخدمة (Service request status) */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">طلبات الخدمة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            title="الملغاة"
            value={serviceStats?.cancelled || 0}
            icon={
              <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            bgColor="bg-red-100"
          />
        </div>
      </div>
    </div>
  );
}