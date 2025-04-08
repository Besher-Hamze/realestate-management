import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import useForm from '@/hooks/useForm';
import { ServiceOrder, ServiceOrderFormData, Reservation, Unit, ServiceType, ServiceSubtype } from '@/lib/types';
import { servicesApi, reservationsApi, unitsApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';

interface ServiceFormProps {
  isEdit?: boolean;
  initialData?: ServiceOrder;
  preSelectedReservationId?: number;
  preSelectedUnitId?: number;
  isTenant?: boolean;
  onSuccess?: (serviceOrder: ServiceOrder) => void;
}

const initialServiceData: ServiceOrderFormData = {
  reservationId: 0,
  serviceType: 'maintenance',
  serviceSubtype: 'electrical',
  description: '',
};

const serviceTypeOptions = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other' },
];

// Mapping of service types to their subtypes
const serviceSubtypeOptions: Record<ServiceType, { value: string; label: string }[]> = {
  maintenance: [
    { value: 'electrical', label: 'Electrical' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'hvac', label: 'HVAC' },
    { value: 'appliance', label: 'Appliance' },
    { value: 'structural', label: 'Structural' },
    { value: 'general', label: 'General' },
  ],
  cleaning: [
    { value: 'general', label: 'General Cleaning' },
    { value: 'deep', label: 'Deep Cleaning' },
    { value: 'windows', label: 'Window Cleaning' },
    { value: 'carpets', label: 'Carpet Cleaning' },
  ],
  security: [
    { value: 'locksmith', label: 'Locksmith' },
    { value: 'camera', label: 'Security Camera' },
    { value: 'alarm', label: 'Alarm System' },
    { value: 'general', label: 'General Security' },
  ],
  other: [
    { value: 'general', label: 'General Request' },
  ],
};

export default function ServiceForm({
  isEdit = false,
  initialData,
  preSelectedReservationId,
  preSelectedUnitId,
  isTenant = false,
  onSuccess,
}: ServiceFormProps) {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType>('maintenance');
  const [attachmentFile, setAttachmentFile] = useState<File | undefined>(undefined);

  // Set up initial data for edit mode or with preselected reservation
  const formInitialData: ServiceOrderFormData = isEdit && initialData
    ? {
        reservationId: initialData.reservationId,
        serviceType: initialData.serviceType,
        serviceSubtype: initialData.serviceSubtype,
        description: initialData.description,
      }
    : preSelectedReservationId
      ? { ...initialServiceData, reservationId: preSelectedReservationId }
      : initialServiceData;

  // Form state using custom hook
  const {
    formData,
    handleChange,
    handleSubmit,
    updateFormData,
    isSubmitting,
    error,
    resetForm,
  } = useForm<ServiceOrderFormData, ServiceOrder>(
    async (data) => {
      if (isEdit && initialData) {
        return servicesApi.update(initialData.id, data, attachmentFile);
      }
      return servicesApi.create(data, attachmentFile);
    },
    formInitialData,
    {
      onSuccess: (data) => {
        const successMessage = isEdit
          ? 'Service request updated successfully'
          : 'Service request submitted successfully';
        toast.success(successMessage);
        
        if (onSuccess) {
          onSuccess(data);
        } else {
          if (isTenant) {
            router.push(`/tenant/services/${data.id}`);
          } else {
            router.push(`/dashboard/services/${data.id}`);
          }
        }
      },
      onError: (errorMessage) => {
        toast.error(errorMessage || 'An error occurred');
      },
    }
  );

  // Effect for when serviceType changes, update the serviceSubtype
  useEffect(() => {
    if (formData.serviceType !== selectedServiceType) {
      setSelectedServiceType(formData.serviceType as ServiceType);
      
      // Set first subtype option for the selected service type
      const firstSubtype = serviceSubtypeOptions[formData.serviceType as ServiceType][0].value;
      updateFormData({ serviceSubtype: firstSubtype as ServiceSubtype });
    }
  }, [formData.serviceType, selectedServiceType, updateFormData]);

  // Reset form when initialData changes (for editing) or when preSelectedReservationId changes
  useEffect(() => {
    if (isEdit && initialData) {
      resetForm();
      setSelectedServiceType(initialData.serviceType);
    } else if (preSelectedReservationId) {
      updateFormData({ reservationId: preSelectedReservationId });
    }
  }, [isEdit, initialData, preSelectedReservationId, resetForm, updateFormData]);

  // Fetch reservations based on conditions
  useEffect(() => {
    const fetchReservationsData = async () => {
      try {
        setIsLoadingReservations(true);
        
        let response;
        if (isTenant) {
          // Tenant can only see their own reservations
          response = await reservationsApi.getMy();
        } else {
          // Admins/Managers can see all reservations
          response = await reservationsApi.getAll();
        }
        
        if (response.success) {
          // Filter active reservations
          const activeReservations = response.data.filter(res => res.status === 'active');
          
          // If preSelectedUnitId is provided, filter by that unit
          const filteredReservations = preSelectedUnitId
            ? activeReservations.filter(res => res.unitId === preSelectedUnitId)
            : activeReservations;
          
          setReservations(filteredReservations);
          
          // Extract units from reservations for dropdown
          const extractedUnits = filteredReservations
            .filter(res => res.unit) // Filter out reservations without unit data
            .map(res => res.unit as Unit); // Extract unit data
          
          setUnits(extractedUnits);
          
          // If preSelectedReservationId is provided but not found in active reservations, show a warning
          if (
            preSelectedReservationId &&
            !filteredReservations.some(res => res.id === preSelectedReservationId)
          ) {
            toast.warning('The selected reservation is not active or not found');
          }
        } else {
          toast.error(response.message || 'Failed to load reservations');
        }
      } catch (error) {
        console.error('Error fetching reservations:', error);
        toast.error('An error occurred while loading reservations');
      } finally {
        setIsLoadingReservations(false);
      }
    };
    
    fetchReservationsData();
  }, [isTenant, preSelectedUnitId, preSelectedReservationId]);

  // Create reservation options for dropdown
  const reservationOptions = reservations.map((reservation) => {
    const unitNumber = reservation.unit?.unitNumber || 'Unknown Unit';
    const buildingName = reservation.unit?.building?.name || 'Unknown Building';
    return {
      value: reservation.id,
      label: `${unitNumber} - ${buildingName}`,
    };
  });

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachmentFile(e.target.files[0]);
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
        
        {/* Reservation Selection (only shown if not preselected) */}
        {!preSelectedReservationId && (
          <Select
            label="Select Property"
            id="reservationId"
            name="reservationId"
            value={formData.reservationId.toString()}
            onChange={handleChange}
            options={reservationOptions}
            disabled={isLoadingReservations || isEdit}
            required
            fullWidth
            helpText={isLoadingReservations ? 'Loading properties...' : undefined}
            emptyOptionLabel="Select a property"
          />
        )}
        
        {/* Service Type */}
        <Select
          label="Service Type"
          id="serviceType"
          name="serviceType"
          value={formData.serviceType}
          onChange={handleChange}
          options={serviceTypeOptions}
          required
          fullWidth
        />
        
        {/* Service Subtype (dependent on selected service type) */}
        <Select
          label="Service Subtype"
          id="serviceSubtype"
          name="serviceSubtype"
          value={formData.serviceSubtype}
          onChange={handleChange}
          options={serviceSubtypeOptions[selectedServiceType]}
          required
          fullWidth
        />
        
        {/* Description */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
            <span className="ml-1 text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            required
            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Please describe the issue in detail..."
          />
        </div>
        
        {/* Attachment File */}
        <div className="mb-4">
          <label htmlFor="attachmentFile" className="block text-sm font-medium text-gray-700 mb-1">
            Attachment (optional)
          </label>
          <input
            id="attachmentFile"
            name="attachmentFile"
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            You can attach images, documents, or other files related to your service request.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
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
            {isEdit ? 'Update Service Request' : 'Submit Service Request'}
          </Button>
        </div>
      </form>
    </Card>
  );
}