import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import useForm from '@/hooks/useForm';
import { Building, Company, CreateBuildingFormData, UpdateBuildingFormData } from '@/lib/types';
import { buildingsApi, companiesApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import { BUILDING_TYPE_OPTIONS } from '@/constants/options';

interface BuildingFormProps {
  isEdit?: boolean;
  initialData?: Building;
  onSuccess?: (building: Building) => void;
}

const initialBuildingData: CreateBuildingFormData = {
  buildingNumber: '',
  name: '',
  address: '',
  buildingType: 'residential',
  totalUnits: 0,
  totalFloors: 1,
  internalParkingSpaces: 0,
  description: '',
};

export default function BuildingForm({
  isEdit = false,
  initialData,
  onSuccess,
}: BuildingFormProps) {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  // إعداد البيانات الأولية لوضع التعديل
  const formInitialData = isEdit && initialData
    ? {
      buildingNumber: initialData.buildingNumber,
      companyId: initialData.companyId,
      name: initialData.name,
      address: initialData.address,
      buildingType: initialData.buildingType,
      totalUnits: initialData.totalUnits,
      totalFloors: initialData.totalFloors,
      internalParkingSpaces: initialData.internalParkingSpaces,
      description: initialData.description,
    }
    : initialBuildingData;

  const {
    formData,
    handleChange,
    handleSubmit,
    isSubmitting,
    error,
    resetForm,
  } = useForm<CreateBuildingFormData | UpdateBuildingFormData, Building>(
    async (data) => {
      if (isEdit && initialData) {
        return await buildingsApi.update(initialData.id, data as UpdateBuildingFormData);
      }
      return await buildingsApi.create(data as CreateBuildingFormData);
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

  // جلب الشركات للقائمة المنسدلة
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setIsLoadingCompanies(true);
        const response = await companiesApi.getAll();

        if (response.success) {
          setCompanies(response.data);
        } else {
          toast.error(response.message || 'فشل في تحميل الشركات');
        }
      } catch (error) {
        console.error('خطأ في جلب الشركات:', error);
        toast.error('حدث خطأ أثناء تحميل الشركات');
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);



  return (
    <Card>
      <form onSubmit={async (e) => await handleSubmit(e, formData)} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md mb-4">
            {error}
          </div>
        )}


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="رقم المبنى"
            id="buildingNumber"
            name="buildingNumber"
            value={formData.buildingNumber}
            onChange={handleChange}
            required
            fullWidth
            helpText="الرقم الخارجي للمبنى"
          />

          <Input
            label="اسم المبنى"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            fullWidth
          />
        </div>

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
          options={BUILDING_TYPE_OPTIONS}
          required
          fullWidth
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="إجمالي الوحدات"
            id="totalUnits"
            name="totalUnits"
            type="number"
            value={(formData.totalUnits || 0).toString()}
            onChange={handleChange}
            min="0"
            required
            fullWidth
          />

          <Input
            label="عدد الطوابق"
            id="totalFloors"
            name="totalFloors"
            type="number"
            value={(formData.totalFloors || 1).toString()}
            onChange={handleChange}
            min="1"
            required
            fullWidth
          />

          <Input
            label="عدد المواقف الداخلية"
            id="internalParkingSpaces"
            name="internalParkingSpaces"
            type="number"
            value={(formData.internalParkingSpaces || 0).toString()}
            onChange={handleChange}
            min="0"
            required
            fullWidth
          />
        </div>

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