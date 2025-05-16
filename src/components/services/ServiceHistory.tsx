import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/utils';

// Define a type for service status history
interface ServiceStatusHistory {
  status: string;
  date: string;
  note?: string;
}

// Define the component props
interface ServiceHistoryProps {
  serviceId: number;
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
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

export default function ServiceHistory({
  serviceId,
  currentStatus,
  createdAt,
  updatedAt,
}: ServiceHistoryProps) {
  const [statusHistory, setStatusHistory] = useState<ServiceStatusHistory[]>([]);

  // In a real implementation, you would fetch the history from an API
  // Here, we'll simulate it based on the available information
  useEffect(() => {
    // Create a history based on current status, creation date, and update date
    const history: ServiceStatusHistory[] = [
      {
        status: 'pending',
        date: createdAt,
        note: 'تم استلام طلب الخدمة وإضافته إلى قائمة الانتظار للمراجعة',
      },
    ];

    // Add additional status updates based on current status
    if (currentStatus !== 'pending') {
      if (currentStatus === 'in-progress' || currentStatus === 'completed' || currentStatus === 'rejected') {
        // If current status is in-progress, completed, or rejected, add an in-progress step
        // Use a date between created and updated for better UX
        const inProgressDate = new Date(
          (new Date(createdAt).getTime() + new Date(updatedAt).getTime()) / 2
        ).toISOString();

        history.push({
          status: 'in-progress',
          date: inProgressDate,
          note: 'تمت مراجعة الطلب وتم تعيينه إلى فريق الصيانة',
        });
      }

      if (currentStatus === 'completed' || currentStatus === 'rejected') {
        history.push({
          status: currentStatus,
          date: updatedAt,
          note:
            currentStatus === 'completed'
              ? 'تم إكمال طلب الخدمة بنجاح'
              : 'تم رفض الطلب',
        });
      }
    }

    setStatusHistory(history);
  }, [serviceId, currentStatus, createdAt, updatedAt]);

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
                      className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                        event.status === 'pending'
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
                        {formatDate(event.date)}
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
    </div>
  );
}
