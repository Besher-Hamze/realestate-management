import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import useForm from '@/hooks/useForm';
import { Company, CompanyFormData } from '@/lib/types';
import { companiesApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

interface CompanyFormProps {
  isEdit?: boolean;
  initialData?: Company;
  onSuccess?: (company: Company) => void;
}

const initialCompanyData: CompanyFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
};

export default function CompanyForm({
  isEdit = false,
  initialData,
  onSuccess,
}: CompanyFormProps) {
  const router = useRouter();
  const [logoImage, setLogoImage] = useState<File | undefined>(undefined);
  const [createManager, setCreateManager] = useState(false);

  // Set up initial data for edit mode
  const formInitialData = isEdit && initialData
    ? {
        name: initialData.name,
        email: initialData.email,
        phone: initialData.phone,
        address: initialData.address,
      }
    : initialCompanyData;

  // Form state using custom hook
  const {
    formData,
    handleChange,
    handleSubmit,
    updateFormData,
    isSubmitting,
    error,
    resetForm,
  } = useForm<CompanyFormData, any>(
    async (data) => {
      if (isEdit && initialData) {
        return companiesApi.update(initialData.id, data, logoImage);
      }
      return companiesApi.create(data, logoImage);
    },
    formInitialData,
    {
      onSuccess: (data) => {
        const successMessage = isEdit
          ? 'Company updated successfully'
          : 'Company created successfully';
        toast.success(successMessage);
        console.log(data);
        
        if (onSuccess) {
          onSuccess(data.company);
        } else {
          router.push(`/dashboard/companies/${data.company.id}`);
        }
      },
      onError: (errorMessage) => {
        toast.error(errorMessage || 'An error occurred');
      },
    }
  );

  // Reset form when initialData changes (for editing)
  useEffect(() => {
    if (isEdit && initialData) {
      resetForm();
    }
  }, [isEdit, initialData, resetForm]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setLogoImage(e.target.files[0]);
    }
  };

  // Toggle manager creation section
  const toggleManagerSection = () => {
    setCreateManager(!createManager);
    
    // Clear manager fields when toggling off
    if (createManager) {
      updateFormData({
        managerFullName: '',
        managerEmail: '',
        managerPhone: '',
      });
    }
  };

  return (
    <Card>
      <form onSubmit={(e) => handleSubmit(e, formData)} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              fullWidth
            />
            
            <Input
              label="Email"
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
            />
            
            <Input
              label="Phone"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              fullWidth
            />
            
            <Input
              label="Address"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              fullWidth
            />
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Company Logo (Optional)
            </label>
            <input
              type="file"
              id="logoImage"
              name="logoImage"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <p className="mt-1 text-sm text-gray-500">
              Upload a company logo (PNG, JPG)
            </p>
            
            {/* Show current logo if in edit mode */}
            {isEdit && initialData?.logoUrl && (
              <div className="mt-2">
                <p className="text-sm text-gray-700">Current logo:</p>
                <div className="mt-1 relative w-32 h-32 border border-gray-200 rounded-md overflow-hidden">
                  <img
                    src={initialData.logoUrl}
                    alt={`${initialData.name} logo`}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Manager creation section - only for new companies */}
        {!isEdit && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Company Manager</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleManagerSection}
              >
                {createManager ? 'Remove Manager' : 'Add Manager'}
              </Button>
            </div>
            
            {createManager && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Manager Full Name"
                  id="managerFullName"
                  name="managerFullName"
                  value={formData.managerFullName || ''}
                  onChange={handleChange}
                  required
                  fullWidth
                />
                
                <Input
                  label="Manager Email"
                  id="managerEmail"
                  name="managerEmail"
                  type="email"
                  value={formData.managerEmail || ''}
                  onChange={handleChange}
                  required
                  fullWidth
                />
                
                <Input
                  label="Manager Phone"
                  id="managerPhone"
                  name="managerPhone"
                  value={formData.managerPhone || ''}
                  onChange={handleChange}
                  required
                  fullWidth
                />
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isEdit ? 'Update Company' : 'Create Company'}
          </Button>
        </div>
      </form>
    </Card>
  );
}