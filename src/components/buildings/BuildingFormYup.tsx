'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Building, Company } from '@/lib/types';
import { buildingsApi, companiesApi } from '@/lib/api';
import { buildingSchema, BuildingFormData } from '@/lib/validations/schemas';
import { useAsyncForm } from '@/hooks/useYupForm';
import {
  FormInput,
  FormTextArea,
  FormSelect
} from '@/components/ui/FormInputs';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { BUILDING_TYPE_OPTIONS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';

interface BuildingFormYupProps {
  isEdit?: boolean;
  initialData?: Building;
  onSuccess?: (building: Building) => void;
}


const initialBuildingData: Partial<BuildingFormData> = {
  companyId: 0,
  buildingNumber: '',
  name: '',
  address: '',
  buildingType: 'residential',
  totalUnits: 0,
  totalFloors: 0,
  internalParkingSpaces: 0,
  description: '',
};

export default function BuildingForm({
  isEdit = false,
  initialData,
  onSuccess,
}: BuildingFormYupProps) {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Initialize form with validation schema
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useAsyncForm<BuildingFormData>(
    buildingSchema,
    isEdit && initialData ? {
      buildingNumber: initialData.buildingNumber,
      name: initialData.name,
      address: initialData.address,
      buildingType: initialData.buildingType,
      totalUnits: initialData.totalUnits,
      totalFloors: initialData.totalFloors,
      internalParkingSpaces: initialData.internalParkingSpaces || 0,
      description: initialData.description || '',
    } : initialBuildingData
  );

  // Load companies on component mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await companiesApi.getAll();
        if (response.success) {
          setCompanies(response.data);
        } else {
          toast.error('فشل في تحميل قائمة الشركات');
        }
      } catch (error) {
        console.error('Error loading companies:', error);
        toast.error('حدث خطأ في تحميل الشركات');
      } finally {
        setLoadingCompanies(false);
      }
    };

    loadCompanies();
  }, []);

  // Reset form when editing data changes
  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        buildingNumber: initialData.buildingNumber,
        name: initialData.name,
        address: initialData.address,
        buildingType: initialData.buildingType,
        totalUnits: initialData.totalUnits,
        totalFloors: initialData.totalFloors,
        internalParkingSpaces: initialData.internalParkingSpaces || 0,
        description: initialData.description || '',
      });
    }
  }, [isEdit, initialData, reset]);

  // Form submission handler
  const onSubmit = async (data: BuildingFormData) => {
    try {
      let response;

      if (isEdit && initialData) {
        response = await buildingsApi.update(initialData.id, data);
      } else {
        response = await buildingsApi.create(data);
      }

      if (response.success) {
        const successMessage = isEdit
          ? 'تم تحديث المبنى بنجاح'
          : 'تم إنشاء المبنى بنجاح';
        toast.success(successMessage);

        if (onSuccess) {
          onSuccess(response.data);
        } else {
          router.push(`/dashboard/buildings/${response.data.id}`);
        }
      } else {
        toast.error(response.message || 'حدث خطأ ما');
      }
    } catch (error: any) {
      console.error('Building form submission error:', error);
      toast.error(error.message || 'حدث خطأ في الإرسال');
      throw error;
    }
  };

  // Prepare company options
  const companyOptions = companies.map(company => ({
    value: company.id.toString(),
    label: company.name,
  }));

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Building Information Section */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-900">معلومات المبنى الأساسية</h3>
            <p className="text-sm text-gray-500 mt-1">يرجى إدخال المعلومات الأساسية للمبنى</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <FormInput
              label="رقم المبنى"
              register={register}
              name="buildingNumber"
              error={errors.buildingNumber}
              required
              helpText="رقم تعريف المبنى الفريد"
            />

            <FormInput
              label="اسم المبنى"
              register={register}
              name="name"
              error={errors.name}
              required
              helpText="الاسم التجاري أو الشائع للمبنى"
            />

            <FormSelect
              label="نوع المبنى"
              register={register}
              name="buildingType"
              error={errors.buildingType}
              options={BUILDING_TYPE_OPTIONS}
              required
              placeholder="اختر نوع المبنى"
            />
          </div>

          <FormInput
            label="عنوان المبنى"
            register={register}
            name="address"
            error={errors.address}
            required
            helpText="العنوان الكامل للمبنى"
          />
        </div>

        {/* Building Specifications Section */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-900">مواصفات المبنى</h3>
            <p className="text-sm text-gray-500 mt-1">تفاصيل المبنى والوحدات</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormInput
              label="إجمالي الوحدات"
              register={register}
              name="totalUnits"
              type="number"
              min="1"
              max="1000"
              error={errors.totalUnits}
              required
              helpText="العدد الكلي للوحدات في المبنى"
            />

            <FormInput
              label="إجمالي الطوابق"
              register={register}
              name="totalFloors"
              type="number"
              min="1"
              max="200"
              error={errors.totalFloors}
              required
              helpText="عدد الطوابق في المبنى"
            />

            <FormInput
              label="مواقف السيارات الداخلية"
              register={register}
              name="internalParkingSpaces"
              type="number"
              min="0"
              max="10000"
              error={errors.internalParkingSpaces}
              helpText="عدد مواقف السيارات (اختياري)"
            />
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-900">معلومات إضافية</h3>
            <p className="text-sm text-gray-500 mt-1">وصف وتفاصيل إضافية حول المبنى</p>
          </div>

          <FormTextArea
            label="وصف المبنى"
            register={register}
            name="description"
            rows={4}
            error={errors.description}
            helpText="وصف تفصيلي للمبنى ومرافقه (اختياري)"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting || loadingCompanies}
          >
            {isEdit ? 'تحديث المبنى' : 'إنشاء المبنى'}
          </Button>
        </div>
      </form>
    </Card>
  );
}