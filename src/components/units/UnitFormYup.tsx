'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { RealEstateUnit, Building, User } from '@/lib/types';
import { unitsApi, buildingsApi, usersApi } from '@/lib/api';
import { unitSchema, UnitFormData } from '@/lib/validations/schemas';
import { useAsyncForm } from '@/hooks/useYupForm';
import {
  FormInput,
  FormTextArea,
  FormSelect
} from '@/components/ui/FormInputs';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import { FLOOR_OPTIONS, UNIT_LAYOUT_OPTIONS, UNIT_STATUS_OPTIONS, UNIT_TYPE_OPTIONS } from '@/constants';

interface UnitFormYupProps {
  isEdit?: boolean;
  initialData?: RealEstateUnit;
  preSelectedBuildingId?: number;
  preSelectedOwnerId?: number;
  onSuccess?: (unit: RealEstateUnit) => void;
}

const initialUnitData: Partial<UnitFormData> = {
  buildingId: 0,
  ownerId: 0, // Add ownerId field
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
  preSelectedOwnerId,
  onSuccess,
}: UnitFormYupProps) {
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [owners, setOwners] = useState<User[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | undefined>(preSelectedOwnerId);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);

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
      ownerId: initialData.ownerId || 0,
      unitNumber: initialData.unitNumber,
      unitType: initialData.unitType,
      unitLayout: initialData.unitLayout,
      floor: initialData.floor,
      area: initialData.area,
      bathrooms: initialData.bathrooms,
      price: initialData.price,
      status: initialData.status,
      description: initialData.description || '',
    } : {
      ...initialUnitData,
      buildingId: preSelectedBuildingId || 0,
      ownerId: preSelectedOwnerId || 0,
    }
  );

  // Watch unit type to conditionally show layout field
  const watchedUnitType = watch('unitType');

  // Fetch owners function
  const fetchOwners = async () => {
    try {
      setIsLoadingOwners(true);
      const response = await usersApi.getAll();

      if (response.success) {
        // تصفية المستخدمين للحصول على الملاك فقط
        const ownerUsers = response.data.filter(user => user.role === 'owner');
        setOwners(ownerUsers);
      } else {
        toast.error(response.message || 'فشل في جلب قائمة الملاك');
      }
    } catch (error) {
      console.error('خطأ في جلب الملاك:', error);
      toast.error('حدث خطأ أثناء جلب قائمة الملاك');
    } finally {
      setIsLoadingOwners(false);
    }
  };

  // تحويل قائمة الملاك إلى خيارات للقائمة المنسدلة
  const ownerOptions = [
    { value: '', label: 'اختر المالك' },
    ...owners.map(owner => ({
      value: owner.id.toString(),
      label: `${owner.fullName} (${owner.username})`
    }))
  ];

  // التعامل مع تغيير المالك المحدد
  const handleOwnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const ownerId = value ? parseInt(value, 10) : undefined;
    setSelectedOwnerId(ownerId);
    setValue('ownerId', ownerId || 0);
  };

  // Load buildings and owners on component mount
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
    fetchOwners();
  }, []);

  // Update selectedOwnerId when preSelectedOwnerId changes
  useEffect(() => {
    if (preSelectedOwnerId) {
      setSelectedOwnerId(preSelectedOwnerId);
      setValue('ownerId', preSelectedOwnerId);
    }
  }, [preSelectedOwnerId, setValue]);

  // Reset form when editing data changes
  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        buildingId: initialData.buildingId,
        ownerId: initialData.ownerId || 0,
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
      setSelectedOwnerId(initialData.ownerId);
    } else if (preSelectedBuildingId) {
      reset({
        ...initialUnitData,
        buildingId: preSelectedBuildingId,
        ownerId: preSelectedOwnerId || 0,
      });
    }
  }, [isEdit, initialData, preSelectedBuildingId, preSelectedOwnerId, reset]);

  // Clear layout when unit type is not apartment
  useEffect(() => {
    if (watchedUnitType !== 'apartment') {
      setValue('unitLayout', null);
    }
  }, [watchedUnitType, setValue]);

  // Form submission handler
  const onSubmit = async (data: UnitFormData) => {
    try {
      // Validate owner selection
      if (!selectedOwnerId) {
        toast.error('يرجى اختيار المالك');
        return;
      }

      // Clear layout if not apartment
      if (data.unitType !== 'apartment') {
        data.unitLayout = null;
      }

      // Include ownerId in submission data
      const submitData = {
        ...data,
        ownerId: selectedOwnerId,
      };

      let response;

      if (isEdit && initialData) {
        response = await unitsApi.update(initialData.id, submitData);
      } else {
        response = await unitsApi.create(submitData);
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
        {/* Owner Selection Section */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-900">معلومات الملكية</h3>
            <p className="text-sm text-gray-500 mt-1">اختيار المالك المسؤول عن هذه الوحدة</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Select
                label="المالك"
                id="ownerId"
                name="ownerId"
                value={selectedOwnerId?.toString() || ''}
                onChange={handleOwnerChange}
                options={ownerOptions}
                required
                disabled={isLoadingOwners}
                fullWidth
              />
              {isLoadingOwners && (
                <p className="text-sm text-gray-500 mt-1">جاري تحميل قائمة الملاك...</p>
              )}
              {!isLoadingOwners && owners.length === 0 && (
                <p className="text-sm text-red-500 mt-1">لا يوجد ملاك متاحون. يرجى إضافة مالك أولاً.</p>
              )}
              {!selectedOwnerId && (
                <p className="text-sm text-red-500 mt-1">يرجى اختيار المالك</p>
              )}
            </div>
          </div>
        </div>

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
              startIcon={<span className="text-gray-500">OMR</span>}
            />
          </div>

          {isEdit && (
            <FormSelect
              label="حالة الوحدة"
              register={register}
              name="status"
              error={errors.status}
              options={UNIT_STATUS_OPTIONS}
              required
              placeholder="اختر حالة الوحدة"
            />
          )}
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
            disabled={isSubmitting || loadingBuildings || !selectedOwnerId}
          >
            {isEdit ? 'تحديث الوحدة' : 'إنشاء الوحدة'}
          </Button>
        </div>
      </form>
    </Card>
  );
}