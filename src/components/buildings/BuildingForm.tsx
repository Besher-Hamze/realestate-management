import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import useForm from '@/hooks/useForm';
import { Building, BuildingFormData, BuildingType } from '@/lib/types';
import { buildingsApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';

interface BuildingFormProps {
  isEdit?: boolean;
  initialData?: Building;
  onSuccess?: (building: Building) => void;
}

const initialBuildingData: BuildingFormData = {
  name: '',
  address: '',
  buildingType: 'apartment',
  totalUnits: 0,
  description: '',
};

const buildingTypeOptions = [
  { value: 'apartment', label: 'مبنى شقق' },
  { value: 'villa', label: 'فيلا' },
];

export default function BuildingForm({
  isEdit = false,
  initialData,
  onSuccess,
}: BuildingFormProps) {
  const router = useRouter();

  // إعداد البيانات الأولية لوضع التعديل
  const formInitialData = isEdit && initialData
    ? {
        name: initialData.name,
        address: initialData.address,
        buildingType: initialData.buildingType,
        totalUnits: initialData.totalUnits,
        description: initialData.description,
      }
    : initialBuildingData;

  // حالة النموذج باستخدام الخطاف المخصص
  const {
    formData,
    handleChange,
    handleSubmit,
    isSubmitting,
    error,
    resetForm,
  } = useForm<BuildingFormData, Building>(
    async (data) => {
      if (isEdit && initialData) {
        return await buildingsApi.update(initialData.id, data);
      }
      return await buildingsApi.create(data);
    },
    formInitialData,
    {
      onSuccess: (data) => {
        const successMessage = isEdit
          ? 'تم تحديث المبنى بنجاح'
          : 'تم إنشاء المبنى بنجاح';
        toast.success(successMessage);
        
        if (onSuccess) {
          onSuccess(data);
        } else {
          router.push(`/dashboard/buildings/${data.id}`);
        }
      },
      onError: (errorMessage) => {
        toast.error(errorMessage || 'حدث خطأ ما');
      },
    }
  );

  // إعادة تعيين النموذج عند تغيير البيانات الأولية (للتعديل)
  useEffect(() => {
    if (isEdit && initialData) {
      resetForm();
    }
  }, [isEdit, initialData, resetForm]);

  return (
    <Card>
      <form onSubmit={async (e) => await handleSubmit(e, formData)} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <Input
          label="اسم المبنى"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          fullWidth
        />
        
        <Input
          label="العنوان"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
          fullWidth
        />
        
        <Select
          label="نوع المبنى"
          id="buildingType"
          name="buildingType"
          value={formData.buildingType}
          onChange={handleChange}
          options={buildingTypeOptions}
          required
          fullWidth
        />
        
        <Input
          label="إجمالي الوحدات"
          id="totalUnits"
          name="totalUnits"
          type="number"
          value={formData.totalUnits.toString()}
          onChange={handleChange}
          min="0"
          required
          fullWidth
        />
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            الوصف
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
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
            disabled={isSubmitting}
          >
            {isEdit ? 'تحديث المبنى' : 'إنشاء المبنى'}
          </Button>
        </div>
      </form>
    </Card>
  );
}