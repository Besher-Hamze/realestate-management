import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { ServiceOrder } from '@/lib/types';
import { servicesApi, reservationsApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface TenantServicesSummaryProps {
  limit?: number;
}

export default function TenantServicesSummary({ limit = 3 }: TenantServicesSummaryProps) {
  const router = useRouter();
  const [services, setServices] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    total: 0,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setIsLoading(true);

      // First get all reservations
      const reservationsResponse = await reservationsApi.getMy();

      if (reservationsResponse.success) {
        const reservationIds = reservationsResponse.data.map(res => res.id);

        // If there are reservations, get service orders for each
        if (reservationIds.length > 0) {
          const servicePromises = reservationIds.map(id =>
            servicesApi.getByReservationId(id)
          );

          const serviceResponses = await Promise.all(servicePromises);
          const allServices = serviceResponses.flatMap(res =>
            res.success ? res.data : []
          );

          // Sort by newest first
          allServices.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          setServices(allServices);

          // Calculate statistics
          const pending = allServices.filter(s => s.status === 'pending').length;
          const inProgress = allServices.filter(s => s.status === 'in-progress').length;
          const completed = allServices.filter(s => s.status === 'completed').length;

          setStatistics({
            pending,
            inProgress,
            completed,
            total: allServices.length
          });
        } else {
          setServices([]);
        }
      } else {
        toast.error(reservationsResponse.message || 'فشل في جلب الحجوزات');
      }
    } catch (error) {
      console.error('خطأ في جلب الخدمات:', error);
      toast.error('حدث خطأ أثناء جلب طلبات الخدمة');
    } finally {
      setIsLoading(false);
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

  // Get status badge class
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

  if (isLoading) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-center">
            <svg
              className="animate-spin h-6 w-6 text-primary-500 mr-2"
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
            <span>جاري تحميل طلبات الخدمة...</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">طلبات الخدمة</h2>
          <Link href="/tenant/services">
            <Button variant="outline" size="sm">
              عرض الكل
            </Button>
          </Link>
        </div>

        {/* Services Status Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
            <div className="text-2xl font-bold text-primary-700">{statistics.total}</div>
            <div className="text-sm text-primary-600">إجمالي الطلبات</div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
            <div className="text-2xl font-bold text-yellow-700">{statistics.pending}</div>
            <div className="text-sm text-yellow-600">قيد الانتظار</div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="text-2xl font-bold text-blue-700">{statistics.inProgress}</div>
            <div className="text-sm text-blue-600">قيد التنفيذ</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="text-2xl font-bold text-green-700">{statistics.completed}</div>
            <div className="text-sm text-green-600">مكتملة</div>
          </div>
        </div>

        {/* Progress Bar */}
        {statistics.total > 0 && (
          <div className="mb-6">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="flex h-full">
                <div 
                  className="bg-yellow-400" 
                  style={{ 
                    width: `${(statistics.pending / statistics.total) * 100}%` 
                  }}
                ></div>
                <div 
                  className="bg-blue-500" 
                  style={{ 
                    width: `${(statistics.inProgress / statistics.total) * 100}%` 
                  }}
                ></div>
                <div 
                  className="bg-green-500" 
                  style={{ 
                    width: `${(statistics.completed / statistics.total) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <div>قيد الانتظار: {Math.round((statistics.pending / statistics.total) * 100)}%</div>
              <div>قيد التنفيذ: {Math.round((statistics.inProgress / statistics.total) * 100)}%</div>
              <div>مكتملة: {Math.round((statistics.completed / statistics.total) * 100)}%</div>
            </div>
          </div>
        )}

        {/* Recent Services */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">أحدث طلبات الخدمة</h3>
          
          {services.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p>لا توجد طلبات خدمة حتى الآن.</p>
              <Link href="/tenant/services/create" className="mt-2 inline-block">
                <Button variant="primary" size="sm" className="mt-2">
                  تقديم طلب جديد
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {services.slice(0, limit).map((service) => (
                <div 
                  key={service.id} 
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/tenant/services/${service.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {translateServiceType(service.serviceType)}
                        </span>
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(service.status)}`}>
                          {translateStatus(service.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {service.description}
                      </p>
                    </div>
                    <Link href={`/tenant/services/${service.id}`}>
                      <Button variant="text" size="sm" className="text-primary-600">
                        عرض
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              
              {services.length > limit && (
                <div className="text-center mt-4">
                  <Link href="/tenant/services">
                    <Button variant="outline" size="sm">
                      عرض المزيد ({services.length - limit})
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Quick Action Button */}
        <div className="text-center mt-6">
          <Link href="/tenant/services/create">
            <Button variant="primary">
              <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              تقديم طلب خدمة جديد
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
