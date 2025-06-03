'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { companiesApi } from '@/lib/api';
import { Company } from '@/lib/types';
import CompanyForm from '@/components/companies/CompanyFormYup';

export default function EditCompanyPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const [initialData, setInitialData] = useState<Company | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    // Memoize the company ID to prevent unnecessary re-renders
    const companyId = useMemo(() => {
        return params.id ? Number(params.id) : undefined;
    }, [params.id]);

    // Fetch company data
    useEffect(() => {
        // Create a flag to prevent state updates after unmount
        let isMounted = true;

        const fetchCompanyData = async () => {
            // Only fetch if user is an admin and we have a company ID
            if (companyId && user?.role === 'admin') {
                try {
                    const data = await companiesApi.getById(companyId);
                    if (isMounted) {
                        setInitialData(data.data);
                        setIsLoading(false);
                    }
                } catch (error) {
                    if (isMounted) {
                        toast.error('فشل في جلب بيانات الشركة');
                        router.push('/dashboard/companies');
                    }
                }
            } else if (isMounted) {
                setIsLoading(false);
            }
        };

        fetchCompanyData();

        // Cleanup function to prevent state updates if component unmounts
        return () => {
            isMounted = false;
        };
    }, [companyId, user, router]);

    // Check user permissions
    useEffect(() => {
        if (user && user.role !== 'admin') {
            toast.error('ليس لديك صلاحية إدارة الشركات');
            router.push('/dashboard/companies');
        }
    }, [user, router]);

    // Don't render anything until permissions and data are checked
    if (!user || user.role !== 'admin' || isLoading) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Navigation and Title */}
            <div className="flex flex-col space-y-2">
                <nav className="text-sm text-gray-500 mb-2">
                    <ol className="flex space-x-2">
                        <li>
                            <Link href="/dashboard" className="hover:text-primary-600">لوحة التحكم</Link>
                        </li>
                        <li>
                            <span className="mx-1">/</span>
                            <Link href="/dashboard/companies" className="hover:text-primary-600">الشركات</Link>
                        </li>
                        <li>
                            <span className="mx-1">/</span>
                            <span className="text-gray-700">تعديل</span>
                        </li>
                    </ol>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900">تعديل الشركة</h1>
                <p className="text-gray-600">قم بتحديث معلومات الشركة</p>
            </div>

            {/* Company Form */}
            <CompanyForm
                isEdit={true}
                initialData={initialData}
                onSuccess={() => router.push('/dashboard/companies')}
            />
        </div>
    );
}