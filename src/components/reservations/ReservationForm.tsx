import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import useForm from '@/hooks/useForm';
import { Reservation, ReservationFormData, Unit, User } from '@/lib/types';
import { reservationsApi, unitsApi, usersApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';

interface NewUserCredentials {
  id: number;
  username: string;
  password: string;
  fullName: string;
}

interface ReservationFormProps {
  isEdit?: boolean;
  initialData?: Reservation;
  preSelectedUnitId?: number;
  preSelectedUserId?: number;
  onSuccess?: (reservation: Reservation) => void;
}

const initialReservationData: ReservationFormData = {
  unitId: 0,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  notes: '',
};

export default function ReservationForm({
  isEdit = false,
  initialData,
  preSelectedUnitId,
  preSelectedUserId,
  onSuccess,
}: ReservationFormProps) {
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isCreatingNewTenant, setIsCreatingNewTenant] = useState(false);
  const [contractFile, setContractFile] = useState<File | undefined>(undefined);
  const [identityFile, setIdentityFile] = useState<File | undefined>(undefined);
  const [commercialRegisterFile, setCommercialRegisterFile] = useState<File | undefined>(undefined);
  const [newUserCredentials, setNewUserCredentials] = useState<NewUserCredentials | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);

  // Set up initial data
  const formInitialData: ReservationFormData = isEdit && initialData
    ? {
        unitId: initialData.unitId,
        userId: initialData.userId,
        startDate: initialData.startDate.split('T')[0],
        endDate: initialData.endDate.split('T')[0],
        notes: initialData.notes,
      }
    : {
        ...initialReservationData,
        unitId: preSelectedUnitId || 0,
        userId: preSelectedUserId || undefined,
      };

  // Form state using custom hook
  const {
    formData,
    handleChange,
    handleSubmit,
    updateFormData,
    isSubmitting,
    error,
    resetForm,
  } = useForm<ReservationFormData, any>(
    async (data) => {
      const files: Record<string, File | undefined> = {
        contractImage: contractFile,
      };
      
      if (isCreatingNewTenant) {
        files.identityImage = identityFile;
        files.commercialRegisterImage = commercialRegisterFile;
      }
      
      if (isEdit && initialData) {
        return reservationsApi.update(initialData.id, data, contractFile);
      }
      return reservationsApi.create(data, files);
    },
    formInitialData,
    {
      onSuccess: (response) => {
        const successMessage = isEdit
          ? 'Reservation updated successfully'
          : 'Reservation created successfully';
        toast.success(successMessage);
        console.log(response);
        console.log(response.newUser);
        setNewUserCredentials(response.newUser);

        if (!isEdit && isCreatingNewTenant && response.newUser) {
          setNewUserCredentials(response.newUser);
          setShowCredentialsModal(true);
        } else if (onSuccess && response.reservation) {
          onSuccess(response.reservation);
        } else if (response.reservation) {
          router.push(`/dashboard/reservations/${response.reservation.id}`);
        } else {
          router.push('/dashboard/reservations');
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
    } else if (preSelectedUnitId) {
      updateFormData({ unitId: preSelectedUnitId });
    }
    
    if (preSelectedUserId) {
      updateFormData({ userId: preSelectedUserId });
      setIsCreatingNewTenant(false);
    }
  }, [isEdit, initialData, preSelectedUnitId, preSelectedUserId, resetForm, updateFormData]);

  // Fetch available units
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setIsLoadingUnits(true);
        
        // For edit, get all units. For create, get only available ones
        const response = isEdit
          ? await unitsApi.getAll()
          : await unitsApi.getAvailable();
        
        if (response.success) {
          setUnits(response.data);
        } else {
          toast.error(response.message || 'Failed to load units');
        }
      } catch (error) {
        console.error('Error fetching units:', error);
        toast.error('An error occurred while loading units');
      } finally {
        setIsLoadingUnits(false);
      }
    };
    
    fetchUnits();
  }, [isEdit]);

  // Fetch users for dropdown (for existing tenants)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const response = await usersApi.getAll();
        
        if (response.success) {
          const tenantUsers = response.data.filter(user => user.role === 'tenant');
          setUsers(tenantUsers);
        } else {
          toast.error(response.message || 'Failed to load tenants');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('An error occurred while loading tenants');
      } finally {
        setIsLoadingUsers(false);
      }
    };
    
    fetchUsers();
  }, []);

  // Create unit options for dropdown
  const unitOptions = units.map((unit) => {
    const buildingName = unit.building?.name || 'Unknown Building';
    return {
      value: unit.id,
      label: `${unit.unitNumber} - ${buildingName} (${unit.status})`,
    };
  });

  // Create user options for dropdown
  const userOptions = users.map((user) => ({
    value: user.id,
    label: `${user.fullName} (${user.email})`,
  }));

  // Toggle between existing tenant and new tenant
  const toggleTenantCreation = () => {
    setIsCreatingNewTenant(!isCreatingNewTenant);
    
    // Clear user ID when switching to new tenant
    if (!isCreatingNewTenant) {
      updateFormData({ userId: undefined });
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | undefined>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
    }
  };

  // Handle modal close and navigation
  const handleCredentialsModalClose = () => {
    setShowCredentialsModal(false);
    
    if (newUserCredentials) {
      // Navigate to the reservation page if it exists
      if (onSuccess && formData) {
        onSuccess(formData as any);
      } else {
        router.push('/dashboard/reservations');
      }
    }
  };

  // Copy credentials to clipboard
  const copyCredentials = () => {
    if (!newUserCredentials) return;
    
    const credentials = `
      Username: ${newUserCredentials.username}
      Password: ${newUserCredentials.password}
      Full Name: ${newUserCredentials.fullName}
    `;
    
    navigator.clipboard.writeText(credentials.trim())
      .then(() => toast.success('Credentials copied to clipboard!'))
      .catch(() => toast.error('Failed to copy credentials'));
  };

  return (
    <>
      <Card>
        <form onSubmit={(e) => handleSubmit(e, formData)} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md mb-4">
              {error}
            </div>
          )}
          
          {/* Unit Selection */}
          <Select
            label="Property Unit"
            id="unitId"
            name="unitId"
            value={formData.unitId.toString()}
            onChange={handleChange}
            options={unitOptions}
            disabled={isLoadingUnits || isEdit}
            required
            fullWidth
            helpText={isLoadingUnits ? 'Loading units...' : 'Select the unit for this reservation'}
            emptyOptionLabel="Select a unit"
          />
          
          {/* Tenant Selection Type Toggle (only for new reservations) */}
          {!isEdit && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">Tenant</label>
              <div className="mt-2 flex items-center space-x-4">
                <button
                  type="button"
                  onClick={toggleTenantCreation}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    !isCreatingNewTenant
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Existing Tenant
                </button>
                <button
                  type="button"
                  onClick={toggleTenantCreation}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    isCreatingNewTenant
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  New Tenant
                </button>
              </div>
            </div>
          )}
          
          {/* Existing Tenant Selection */}
          {!isCreatingNewTenant && !isEdit && (
            <Select
              label="Select Tenant"
              id="userId"
              name="userId"
              value={formData.userId?.toString() || ''}
              onChange={handleChange}
              options={userOptions}
              disabled={isLoadingUsers}
              required
              fullWidth
              helpText={isLoadingUsers ? 'Loading tenants...' : 'Select an existing tenant'}
              emptyOptionLabel="Select a tenant"
            />
          )}
          
          {/* New Tenant Form */}
          {isCreatingNewTenant && !isEdit && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-md">
              <h3 className="text-md font-medium text-gray-900">New Tenant Information</h3>
              
              <Input
                label="Full Name"
                id="fullName"
                name="fullName"
                value={formData.fullName || ''}
                onChange={handleChange}
                required
                fullWidth
              />
              
              <Input
                label="Email"
                id="email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleChange}
                required
                fullWidth
              />
              
              <Input
                label="Phone"
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                required
                fullWidth
              />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Identity Document (Optional)
                </label>
                <input
                  type="file"
                  id="identityImage"
                  name="identityImage"
                  onChange={(e) => handleFileChange(e, setIdentityFile)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Commercial Register (Optional)
                </label>
                <input
                  type="file"
                  id="commercialRegisterImage"
                  name="commercialRegisterImage"
                  onChange={(e) => handleFileChange(e, setCommercialRegisterFile)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
            </div>
          )}
          
          {/* Reservation Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              required
              fullWidth
            />
            
            <Input
              label="End Date"
              id="endDate"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              required
              fullWidth
            />
          </div>
          
          {/* Notes */}
          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Additional information about this reservation..."
            />
          </div>
          
          {/* Contract Document */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Contract Document {isEdit ? '(Optional)' : '(Required)'}
            </label>
            <input
              type="file"
              id="contractImage"
              name="contractImage"
              onChange={(e) => handleFileChange(e, setContractFile)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              required={!isEdit}
            />
            {initialData?.contractUrl && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">Current document:</p>
                <a
                  href={initialData.contractUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                >
                  View current contract
                </a>
              </div>
            )}
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
              {isEdit ? 'Update Reservation' : 'Create Reservation'}
            </Button>
          </div>
        </form>
      </Card>

      {/* New User Credentials Modal */}
      <Modal
        isOpen={showCredentialsModal}
        onClose={handleCredentialsModalClose}
        title="New Tenant Account Created"
        size="md"
      >
        <div className="p-6">
          {newUserCredentials && (
            <>
              <div className="mb-4">
                <p className="text-gray-700 mb-4">
                  A new tenant account has been created. Please share these credentials with the tenant:
                </p>
                
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md font-mono">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">Username:</span>
                    <span className="text-base text-blue-800">{newUserCredentials.username}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">Password:</span>
                    <span className="text-base text-blue-800">{newUserCredentials.password}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Full Name:</span>
                    <span className="text-base text-blue-800">{newUserCredentials.fullName}</span>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-500">
                  <p className="mb-2">
                    <span className="text-red-500">Important:</span> Please make sure to securely share these credentials 
                    with the tenant. They will need these details to log in to their account.
                  </p>
                  <p>
                    You may want to advise the tenant to change their password after their first login.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={copyCredentials}
                >
                  Copy Credentials
                </Button>
                <Button
                  onClick={handleCredentialsModalClose}
                >
                  Continue
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}