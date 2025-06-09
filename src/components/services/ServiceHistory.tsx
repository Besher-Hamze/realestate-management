import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/utils';
import { ServiceOrder } from '@/lib/types';

// Define a type for service status history
interface ServiceStatusHistory {
  status: string;
  date: string;
  note?: string;
}

// Define the component props
interface ServiceHistoryProps {
  service: ServiceOrder;
}

// Helper function to translate status to Arabic
const translateStatus = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'قيد الانتظار';
    case 'in-progress':
      return 'قيد التنفيذ';
    case 'completed':
      return 'مكتمل';
    case 'rejected':
      return 'مرفوض';
    default:
      return status;
  }
};

// Helper function to format time
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// Helper function to get status note in Arabic
const getStatusNote = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'تم استلام طلب الخدمة وإضافته إلى قائمة الانتظار للمراجعة';
    case 'in-progress':
      return 'تمت مراجعة الطلب وتم تعيينه إلى فريق الصيانة';
    case 'completed':
      return 'تم إكمال طلب الخدمة بنجاح';
    case 'rejected':
      return 'تم رفض الطلب';
    default:
      return 'تحديث حالة الطلب';
  }
};

export default function ServiceHistory({ service }: ServiceHistoryProps) {
  const [statusHistory, setStatusHistory] = useState<ServiceStatusHistory[]>([]);

  useEffect(() => {
    // Check if service has serviceHistory, if yes use it, otherwise create a basic history
    if (service.serviceHistory && service.serviceHistory.length > 0) {

      // Use the actual service history from the API
      const history: ServiceStatusHistory[] = service.serviceHistory.map((historyItem) => ({
        status: historyItem.status,
        date: new Date(historyItem.date).toISOString(),
        note: getStatusNote(historyItem.status),
      }));
      setStatusHistory(history);
    } else {
      // Fallback: Create a basic history based on current status, creation date, and update date
      const history: ServiceStatusHistory[] = [
        {
          status: 'pending',
          date: service.createdAt,
          note: 'تم استلام طلب الخدمة وإضافته إلى قائمة الانتظار للمراجعة',
        },
      ];

      // Add additional status updates based on current status
      if (service.status !== 'pending') {
        if (service.status === 'in-progress' || service.status === 'completed' || service.status === 'rejected') {
          // If current status is in-progress, completed, or rejected, add an in-progress step
          // Use a date between created and updated for better UX
          const inProgressDate = new Date(
            (new Date(service.createdAt).getTime() + new Date(service.updatedAt).getTime()) / 2
          ).toISOString();

          history.push({
            status: 'in-progress',
            date: inProgressDate,
            note: 'تمت مراجعة الطلب وتم تعيينه إلى فريق الصيانة',
          });
        }

        if (service.status === 'completed' || service.status === 'rejected') {
          history.push({
            status: service.status,
            date: service.updatedAt,
            note:
              service.status === 'completed'
                ? 'تم إكمال طلب الخدمة بنجاح'
                : 'تم رفض الطلب',
          });
        }
      }

      setStatusHistory(history);
    }
  }, [service]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">مسار حالة الطلب</h2>

      <div className="flow-root">
        <ul className="-mb-8">
          {statusHistory.map((event, index) => (
            <li key={index}>
              <div className="relative pb-8">
                {index !== statusHistory.length - 1 ? (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${event.status === 'pending'
                        ? 'bg-yellow-100'
                        : event.status === 'in-progress'
                          ? 'bg-blue-100'
                          : event.status === 'completed'
                            ? 'bg-green-100'
                            : 'bg-red-100'
                        }`}
                    >
                      {event.status === 'pending' ? (
                        <svg
                          className="h-5 w-5 text-yellow-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ) : event.status === 'in-progress' ? (
                        <svg
                          className="h-5 w-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      ) : event.status === 'completed' ? (
                        <svg
                          className="h-5 w-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 mr-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        {formatTime(event.date)} - {formatDate(event.date)}
                      </p>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-700 font-medium">
                        {translateStatus(event.status)}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">{event.note}</p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Progress indicator */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>تقدم الطلب</span>
          <span>
            {service.status === 'pending' && '25%'}
            {service.status === 'in-progress' && '75%'}
            {(service.status === 'completed' || service.status === 'rejected') && '100%'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${service.status === 'pending' ? 'bg-yellow-400 w-1/4' :
              service.status === 'in-progress' ? 'bg-blue-500 w-3/4' :
                service.status === 'completed' ? 'bg-green-500 w-full' :
                  'bg-red-500 w-full'
              }`}
          />
        </div>
      </div>

      {/* Next expected action */}
      {service.status !== 'completed' && service.status !== 'rejected' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-blue-600 mt-0.5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-800">الخطوة التالية</h4>
              <p className="mt-1 text-sm text-blue-700">
                {service.status === 'pending'
                  ? 'ننتظر مراجعة الطلب من قبل فريق الإدارة وتحديد الفني المناسب.'
                  : 'العمل جاري حالياً، سيتم تحديث الحالة عند اكتمال المهمة.'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}