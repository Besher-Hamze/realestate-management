// Example usage pages for the new Yup-validated forms

// ===== COMPANY CREATE PAGE =====
// src/app/dashboard/companies/create/page.tsx
'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import CompanyFormYup from '@/components/companies/CompanyFormYup';
import { Company } from '@/lib/types';

export default function CreateCompanyPage() {
  const router = useRouter();

  const handleSuccess = (company: Company) => {
    router.push(`/dashboard/companies/${company.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">إضافة شركة جديدة</h1>
        <p className="mt-2 text-sm text-gray-600">
          قم بملء النموذج أدناه لإضافة شركة جديدة إلى النظام
        </p>
      </div>

      <Suspense fallback={<div>جاري التحميل...</div>}>
        <CompanyFormYup onSuccess={handleSuccess} />
      </Suspense>
    </div>
  );
}

// ===== BUILDING CREATE PAGE =====
// src/app/dashboard/buildings/create/page.tsx
'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import BuildingFormYup from '@/components/buildings/BuildingFormYup';
import { Building } from '@/lib/types';

export default function CreateBuildingPage() {
  const router = useRouter();

  const handleSuccess = (building: Building) => {
    router.push(`/dashboard/buildings/${building.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">إضافة مبنى جديد</h1>
        <p className="mt-2 text-sm text-gray-600">
          قم بملء النموذج أدناه لإضافة مبنى جديد إلى النظام
        </p>
      </div>

      <Suspense fallback={<div>جاري التحميل...</div>}>
        <BuildingFormYup onSuccess={handleSuccess} />
      </Suspense>
    </div>
  );
}

// ===== UNIT CREATE PAGE =====
// src/app/dashboard/units/create/page.tsx
'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import UnitFormYup from '@/components/units/UnitFormYup';
import { RealEstateUnit } from '@/lib/types';

export default function CreateUnitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buildingId = searchParams.get('buildingId');

  const handleSuccess = (unit: RealEstateUnit) => {
    router.push(`/dashboard/units/${unit.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">إضافة وحدة جديدة</h1>
        <p className="mt-2 text-sm text-gray-600">
          قم بملء النموذج أدناه لإضافة وحدة جديدة إلى النظام
        </p>
      </div>

      <Suspense fallback={<div>جاري التحميل...</div>}>
        <UnitFormYup
          preSelectedBuildingId={buildingId ? Number(buildingId) : undefined}
          onSuccess={handleSuccess}
        />
      </Suspense>
    </div>
  );
}

// ===== PAYMENT CREATE PAGE =====
// src/app/dashboard/payments/create/page.tsx
'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PaymentForm from '@/components/payments/PaymentFormYup';
import { Payment } from '@/lib/types';

export default function CreatePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('reservationId');

  const handleSuccess = (payment: Payment) => {
    router.push(`/dashboard/payments/${payment.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">إضافة دفعة جديدة</h1>
        <p className="mt-2 text-sm text-gray-600">
          قم بملء النموذج أدناه لتسجيل دفعة جديدة في النظام
        </p>
      </div>

      <Suspense fallback={<div>جاري التحميل...</div>}>
        <PaymentForm
          preSelectedReservationId={reservationId ? Number(reservationId) : undefined}
          onSuccess={handleSuccess}
        />
      </Suspense>
    </div>
  );
}

// ===== PAYMENT EDIT PAGE =====
// src/app/dashboard/payments/[id]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import PaymentForm from '@/components/payments/PaymentFormYup';
import { Payment } from '@/lib/types';
import { paymentsApi } from '@/lib/api';

export default function EditPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayment = async () => {
      try {
        const response = await paymentsApi.getById(Number(params.id));
        if (response.success) {
          setPayment(response.data);
        } else {
          toast.error('فشل في تحميل بيانات الدفعة');
          router.push('/dashboard/payments');
        }
      } catch (error) {
        console.error('Error loading payment:', error);
        toast.error('حدث خطأ في تحميل بيانات الدفعة');
        router.push('/dashboard/payments');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadPayment();
    }
  }, [params.id, router]);

  const handleSuccess = (updatedPayment: Payment) => {
    router.push(`/dashboard/payments/${updatedPayment.id}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">الدفعة غير موجودة</h1>
          <p className="mt-2 text-sm text-gray-600">
            لم يتم العثور على الدفعة المطلوبة
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">تعديل الدفعة</h1>
        <p className="mt-2 text-sm text-gray-600">
          قم بتعديل بيانات الدفعة رقم: {payment.id}
        </p>
      </div>

      <PaymentForm
        isEdit={true}
        initialData={payment}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
