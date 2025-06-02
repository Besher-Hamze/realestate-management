'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Building, BuildingFormData, Company } from '@/lib/types';
import { buildingsApi, companiesApi } from '@/lib/api';
import { 
  validateBuildingForm,
  UNIT_TYPE_OPTIONS 
} from '@/lib/validations';
import { 
  FormSection, 
  ValidationSummary, 
  FormActions,
  useFormValidation 
} from '@/components/ui/FormValidation';
import { 
  Input, 
  Select, 
  TextArea 
} from '@/components/ui/FormInput';
import Card from '@/components/ui/Card';

interface BuildingFormProps {
  isEdit?: boolean;
  initialData?: Building;
  onSuccess?: (building: Building) => void;
}

const BUILDING_TYPE_OPTIONS = [
  { value: 'residential', label: 'سكني' },
  { value: 'commercial', label: 'تجاري' },
  { value: 'mixed', label: 'مختلط' },
];

const initialBuildingData: BuildingFormData = {
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
}: BuildingFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<BuildingFormData>(initialBuildingData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Validation hook
  const { errors, validate, clearErrors, hasErrors } = useFormValidation(validateBuildingForm);

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

  // Initialize form data for edit mode
  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        companyId: initialData.companyId,
        buildingNumber: initialData.buildingNumber,
        name: initialData.name,
        address: initialData.address,
        buildingType: initialData.buildingType,
        totalUnits: initialData.totalUnits,
        totalFloors: initialData.totalFloors,
        internalParkingSpaces: initialData.internalParkingSpaces,
        description: initialData.description,
      });
    }
  }, [isEdit, initialData]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle number inputs
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseInt(value, 10),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Form submission
  const handleSubmit = async () => {
    // Clear previous errors
    clearErrors();

    // Validate form
    if (!validate(formData)) {
      toast.error('يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    setIsSubmitting(true);

    try {
      let response;
      if (isEdit && initialData) {
        response = await buildingsApi.update(initialData.id, formData);
      } else {
        response = await buildingsApi.create(formData);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare company options
  const companyOptions = companies.map(company => ({
    value: company.id.toString(),
    label: company.name,
  }));

  return (
    <Card>
      <div className="space-y-8">
        {/* Validation Summary */}
        {hasErrors && (
          <ValidationSummary errors={errors} />
        )}

        {/* Building Information Section */}
        <FormSection 
          title="معلومات المبنى الأساسية"
          description="يرجى إدخال المعلومات الأساسية للمبنى"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="الشركة المالكة"
              name="companyId"
              value={formData.companyId.toString()}
              onChange={handleChange}
              options={companyOptions}
              error={errors.companyId}
              required
              placeholder={loadingCompanies ? "جاري التحميل..." : "اختر الشركة"}
              disabled={loadingCompanies}
            />

            <Input
              label="رقم المبنى"
              name="buildingNumber"
              value={formData.buildingNumber}
              onChange={handleChange}
              error={errors.buildingNumber}
              required
              helpText="رقم تعريف المبنى الفريد"
            />

            <Input
              label="اسم المبنى"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
              helpText="الاسم التجاري أو الشائع للمبنى"
            />

            <Select
              label="نوع المبنى"
              name="buildingType"
              value={formData.buildingType}
              onChange={handleChange}
              options={BUILDING_TYPE_OPTIONS}
              error={errors.buildingType}
              required
              placeholder="اختر نوع المبنى"
            />
          </div>

          <Input
            label="عنوان المبنى"
            name="address"
            value={formData.address}
            onChange={handleChange}
            error={errors.address}
            required
            helpText="العنوان الكامل للمبنى"
          />
        </FormSection>

        {/* Building Specifications Section */}
        <FormSection 
          title="مواصفات المبنى"
          description="تفاصيل المبنى والوحدات"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="إجمالي الوحدات"
              name="totalUnits"
              type="number"
              min="1"
              max="1000"
              value={formData.totalUnits.toString()}
              onChange={handleChange}
              error={errors.totalUnits}
              required
              helpText="العدد الكلي للوحدات في المبنى"
            />

            <Input
              label="إجمالي الطوابق"
              name="totalFloors"
              type="number"
              min="1"
              max="200"
              value={formData.totalFloors.toString()}
              onChange={handleChange}
              error={errors.totalFloors}
              required
              helpText="عدد الطوابق في المبنى"
            />

            <Input
              label="مواقف السيارات الداخلية"
              name="internalParkingSpaces"
              type="number"
              min="0"
              max="10000"
              value={formData.internalParkingSpaces.toString()}
              onChange={handleChange}
              error={errors.internalParkingSpaces}
              helpText="عدد مواقف السيارات (اختياري)"
            />
          </div>
        </FormSection>

        {/* Additional Information Section */}
        <FormSection 
          title="معلومات إضافية"
          description="وصف وتفاصيل إضافية حول المبنى"
        >
          <TextArea
            label="وصف المبنى"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            error={errors.description}
            helpText="وصف تفصيلي للمبنى ومرافقه (اختياري)"
          />
        </FormSection>

        {/* Form Actions */}
        <FormActions
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          submitText={isEdit ? 'تحديث المبنى' : 'إنشاء المبنى'}
          cancelText="إلغاء"
          isLoading={isSubmitting}
          disabled={isSubmitting || loadingCompanies}
        />
      </div>
    </Card>
  );
}
