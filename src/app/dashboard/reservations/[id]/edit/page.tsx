'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { use } from 'react';
import ReservationForm from '@/components/reservations/ReservationForm';
import Card from '@/components/ui/Card';
import { reservationsApi } from '@/lib/api';
import { Reservation } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { ReservationStatus } from '@/types';

interface EditReservationPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function EditReservationPage({ params }: EditReservationPageProps) {

    // reservations/${reservation.id}/edit?status=active
    // get the status if it exists in the url
    const searchParams = useSearchParams();
    const quryStatus = searchParams.get('status') as ReservationStatus;
    const router = useRouter();
    const resolvedParams = use(params);
    const reservationId = resolvedParams.id;

    const [reservation, setReservation] = useState<Reservation | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReservation = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await reservationsApi.getById(reservationId);
                if (response.success) {
                    if (quryStatus) {
                        console.log("Query Status : ", quryStatus);

                        setReservation({
                            ...response.data,
                            status: quryStatus,
                        });
                    } else {
                        setReservation(response.data);
                    }

                } else {
                    setError(response.message || 'فشل في تحميل بيانات الحجز');
                    toast.error(response.message || 'فشل في تحميل بيانات الحجز');
                }
            } catch (err) {
                console.error('خطأ في جلب بيانات الحجز:', err);
                setError('حدث خطأ أثناء تحميل بيانات الحجز');
                toast.error('حدث خطأ أثناء تحميل بيانات الحجز');
            } finally {
                setIsLoading(false);
            }
        };

        if (reservationId) {
            fetchReservation();
        }
    }, [reservationId]);

    const handleSuccess = (updatedReservation: Reservation) => {
        router.push(`/dashboard/reservations/${updatedReservation.id}`);
    };

    return (
        <div className="space-y-6">
            {/* العنوان مع مسار التنقل */}
            <div className="flex flex-col space-y-2">
                <nav className="text-sm text-gray-500 mb-2">
                    <ol className="flex space-x-2">
                        <li>
                            <Link href="/dashboard" className="hover:text-primary-600">لوحة التحكم</Link>
                        </li>
                        <li>
                            <span className="mx-1">/</span>
                            <Link href="/dashboard/reservations" className="hover:text-primary-600">المستأجرين </Link>
                        </li>
                        <li>
                            <span className="mx-1">/</span>
                            <Link href={`/dashboard/reservations/${reservationId}`} className="hover:text-primary-600">
                                {reservation?.id || reservationId}
                            </Link>
                        </li>
                        <li>
                            <span className="mx-1">/</span>
                            <span className="text-gray-700">تعديل</span>
                        </li>
                    </ol>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900">تعديل الحجز</h1>
                <p className="text-gray-600">
                    تعديل تفاصيل الحجز الحالي.
                </p>
            </div>

            {/* عرض حالة التحميل */}
            {isLoading && (
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
                        <p className="text-gray-600">جاري تحميل بيانات الحجز...</p>
                    </div>
                </div>
            )}

            {/* عرض رسالة الخطأ */}
            {error && !isLoading && (
                <Card>
                    <div className="p-6 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">حدث خطأ</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <div className="flex justify-center">
                            <button
                                onClick={() => router.push('/dashboard/reservations')}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                العودة إلى المستأجرين
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            {/* نموذج تعديل الحجز */}
            {!isLoading && !error && reservation && (
                <ReservationForm
                    isEdit={true}
                    initialData={reservation}
                    onSuccess={handleSuccess}
                    preSelectedUserId={reservation.userId}
                />
            )}
        </div>
    );
}
