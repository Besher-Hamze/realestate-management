'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { RealEstateUnit, Building } from '@/lib/types';
import { unitsApi, buildingsApi } from '@/lib/api';
import { unitSchema, UnitFormData } from '@/lib/validations/schemas';
import { useAsyncForm } from '@/hooks/useYupForm';
import {
  FormInput,
  FormTextArea,
  FormSelect
} from '@/components/ui/FormInputs';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FLOOR_OPTIONS, UNIT_LAYOUT_OPTIONS, UNIT_STATUS_OPTIONS, UNIT_TYPE_OPTIONS } from '@/constants';

interface UnitFormYupProps {
  isEdit?: boolean;
  initialData?: RealEstateUnit;
  preSelectedBuildingId?: number;
  onSuccess?: (unit: RealEstateUnit) => void;
}





const initialUnitData: Partial<UnitFormData> = {
  buildingId: 0,
  unitNumber: '',
  unitType: 'apartment',
  unitLayout: null,
  floor: '1',
  area: 0,
  bathrooms: 1,
  price: 0,
  status: 'available',
  description: '',
};

export default function UnitForm({
  isEdit = false,
  initialData,
  preSelectedBuildingId,
  onSuccess,
}: UnitFormYupProps) {
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);

  // Initialize form with validation schema
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useAsyncForm<UnitFormData>(
    unitSchema,
    isEdit && initialData ? {
      buildingId: initialData.buildingId,
      unitNumber: initialData.unitNumber,
      unitType: initialData.unitType,
      unitLayout: initialData.unitLayout,
      floor: initialData.floor,
      area: initialData.area,
      bathrooms: initialData.bathrooms,
      price: initialData.price,
      status: initialData.status,
      description: initialData.description || '',
    } : preSelectedBuildingId ? {
      ...initialUnitData,
      buildingId: preSelectedBuildingId,
    } : initialUnitData
  );

  // Watch unit type to conditionally show layout field
  const watchedUnitType = watch('unitType');

  // Load buildings on component mount
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const response = await buildingsApi.getAll();
        if (response.success) {
          setBuildings(response.data);
        } else {
          toast.error('فشل في تحميل قائمة المباني');
        }
      } catch (error) {
        console.error('Error loading buildings:', error);
        toast.error('حدث خطأ في تحميل المباني');
      } finally {
        setLoadingBuildings(false);
      }
    };

    loadBuildings();
  }, []);

  // Reset form when editing data changes
  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        buildingId: initialData.buildingId,
        unitNumber: initialData.unitNumber,
        unitType: initialData.unitType,
        unitLayout: initialData.unitLayout,
        floor: initialData.floor,
        area: initialData.area,
        bathrooms: initialData.bathrooms,
        price: initialData.price,
        status: initialData.status,
        description: initialData.description || '',
      });
    } else if (preSelectedBuildingId) {
      reset({
        ...initialUnitData,
        buildingId: preSelectedBuildingId,
      });
    }
  }, [isEdit, initialData, preSelectedBuildingId, reset]);

  // Clear layout when unit type is not apartment
  useEffect(() => {
    if (watchedUnitType !== 'apartment') {
      setValue('unitLayout', null);
    }
  }, [watchedUnitType, setValue]);

  // Form submission handler
  const onSubmit = async (data: UnitFormData) => {
    try {
      // Clear layout if not apartment
      if (data.unitType !== 'apartment') {
        data.unitLayout = null;
      }

      let response;

      if (isEdit && initialData) {
        response = await unitsApi.update(initialData.id, data);
      } else {
        response = await unitsApi.create(data);
      }

      if (response.success) {
        const successMessage = isEdit
          ? 'تم تحديث الوحدة بنجاح'
          : 'تم إنشاء الوحدة بنجاح';
        toast.success(successMessage);

        if (onSuccess) {
          onSuccess(response.data);
        } else {
          router.push(`/dashboard/units/${response.data.id}`);
        }
      } else {
        toast.error(response.message || 'حدث خطأ ما');
      }
    } catch (error: any) {
      console.error('Unit form submission error:', error);
      toast.error(error.message || 'حدث خطأ في الإرسال');
      throw error;
    }
  };

  // Prepare building options
  const buildingOptions = buildings.map(building => ({
    value: building.id.toString(),
    label: `${building.buildingNumber} - ${building.name}`,
  }));

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Unit Information Section */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-900">معلومات الوحدة الأساسية</h3>
            <p className="text-sm text-gray-500 mt-1">يرجى إدخال المعلومات الأساسية للوحدة</p>
          </div>

          <FormSelect
            label="المبنى"
            register={register}
            name="buildingId"
            error={errors.buildingId}
            options={buildingOptions}
            required
            placeholder={loadingBuildings ? "جاري التحميل..." : "اختر المبنى"}
            disabled={loadingBuildings || isEdit}
            helpText={loadingBuildings ? 'جاري تحميل المباني...' : 'اختر المبنى الذي تنتمي إليه الوحدة'}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="رقم الوحدة"
              register={register}
              name="unitNumber"
              error={errors.unitNumber}
              required
              helpText="معرف فريد لهذه الوحدة (مثال: A101، 2B، إلخ.)"
            />

            <FormSelect
              label="نوع الوحدة"
              register={register}
              name="unitType"
              error={errors.unitType}
              options={UNIT_TYPE_OPTIONS}
              required
              placeholder="اختر نوع الوحدة"
            />
          </div>

          {/* Conditional Layout Field for Apartments */}
          {watchedUnitType === 'apartment' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormSelect
                label="تخطيط الوحدة"
                register={register}
                name="unitLayout"
                error={errors.unitLayout}
                options={UNIT_LAYOUT_OPTIONS}
                placeholder="اختر تخطيط الوحدة"
                helpText="تخطيط الشقة (عدد الغرف والصالات)"
              />
            </div>
          )}
        </div>

        {/* Unit Specifications Section */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-900">مواصفات الوحدة</h3>
            <p className="text-sm text-gray-500 mt-1">التفاصيل الفنية والمواصفات</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormSelect
              label="الطابق"
              register={register}
              name="floor"
              error={errors.floor}
              options={FLOOR_OPTIONS}
              required
              placeholder="اختر الطابق"
            />

            <FormInput
              label="المساحة (م²)"
              register={register}
              name="area"
              type="number"
              min="1"
              step="0.1"
              error={errors.area}
              required
              helpText="المساحة بالمتر المربع"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="عدد الحمامات"
              register={register}
              name="bathrooms"
              type="number"
              min="0"
              max="50"
              error={errors.bathrooms}
              required
              helpText="عدد دورات المياه في الوحدة"
            />

            <FormInput
              label="السعر"
              register={register}
              name="price"
              type="number"
              min="1"
              step="0.01"
              error={errors.price}
              required
              helpText="سعر الإيجار للوحدة"
              startIcon={<span className="text-gray-500">ر.س</span>}
            />
          </div>

          {isEdit && <FormSelect
            label="حالة الوحدة"
            register={register}
            name="status"
            error={errors.status}
            options={UNIT_STATUS_OPTIONS}
            required
            placeholder="اختر حالة الوحدة"
          />}
        </div>

        {/* Additional Information Section */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-900">معلومات إضافية</h3>
            <p className="text-sm text-gray-500 mt-1">وصف وتفاصيل إضافية حول الوحدة</p>
          </div>

          <FormTextArea
            label="وصف الوحدة"
            register={register}
            name="description"
            rows={4}
            error={errors.description}
            helpText="وصف تفصيلي للوحدة ومرافقها (اختياري)"
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
            disabled={isSubmitting || loadingBuildings}
          >
            {isEdit ? 'تحديث الوحدة' : 'إنشاء الوحدة'}
          </Button>
        </div>
      </form>
    </Card>
  );
}