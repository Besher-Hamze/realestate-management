import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import useForm from '@/hooks/useForm';
import { Payment, PaymentFormData, Reservation } from '@/lib/types';
import { paymentsApi, reservationsApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

interface PaymentFormProps {
  isEdit?: boolean;
  initialData?: Payment;
  preSelectedReservationId?: number;
  onSuccess?: (payment: Payment) => void;
}

const initialPaymentData: PaymentFormData = {
  reservationId: 0,
  amount: 0,
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'cash',
  status: 'paid',
  notes: '',
};

const paymentMethodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
];

const paymentStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'failed', label: 'Failed' },
];

export default function PaymentForm({
  isEdit = false,
  initialData,
  preSelectedReservationId,
  onSuccess,
}: PaymentFormProps) {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isLoadingReservations, setIsLoadingReservations] = useState(true);
  const [checkImage, setCheckImage] = useState<File | undefined>(undefined);

  // Set up initial data for edit mode or with preselected reservation
  const formInitialData: PaymentFormData = isEdit && initialData
    ? {
        reservationId: initialData.reservationId,
        amount: initialData.amount,
        paymentDate: initialData.paymentDate.split('T')[0],
        paymentMethod: initialData.paymentMethod,
        status: initialData.status,
        notes: initialData.notes,
      }
    : {
        ...initialPaymentData,
        reservationId: preSelectedReservationId || 0,
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
  } = useForm<PaymentFormData, Payment>(
    async (data) => {
      if (isEdit && initialData) {
        return paymentsApi.update(initialData.id, data, checkImage);
      }
      return paymentsApi.create(data, checkImage);
    },
    formInitialData,
    {
      onSuccess: (data) => {
        const successMessage = isEdit
          ? 'Payment updated successfully'
          : 'Payment created successfully';
        toast.success(successMessage);
        
        if (onSuccess) {
          onSuccess(data);
        } else {
          router.push(`/dashboard/payments/${data.id}`);
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
    } else if (preSelectedReservationId) {
      updateFormData({ reservationId: preSelectedReservationId });
    }
  }, [isEdit, initialData, preSelectedReservationId, resetForm, updateFormData]);

  // Fetch reservations for dropdown
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setIsLoadingReservations(true);
        const response = await reservationsApi.getAll();
        
        if (response.success) {
          // Filter to active reservations
          const activeReservations = response.data.filter(res => res.status === 'active');
          setReservations(activeReservations);
          
          // If we have a preSelectedReservationId or in edit mode, find the matching reservation
          if ((preSelectedReservationId || (isEdit && initialData)) && response.data.length > 0) {
            const id = preSelectedReservationId || (initialData?.reservationId || 0);
            const reservation = response.data.find(res => res.id === id);
            if (reservation) {
              setSelectedReservation(reservation);
              // If it's a new payment, set the default amount to the unit price
              if (!isEdit && reservation.unit && reservation.unit.price) {
                updateFormData({ amount: reservation.unit.price });
              }
            }
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
    
    fetchReservations();
  }, [isEdit, initialData, preSelectedReservationId, updateFormData]);

  // Handle reservation change
  const handleReservationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const reservationId = parseInt(e.target.value);
    updateFormData({ reservationId });
    
    // Find the selected reservation
    const reservation = reservations.find(res => res.id === reservationId);
    setSelectedReservation(reservation || null);
    
    // Set the default amount to the unit price if available
    if (reservation?.unit?.price) {
      updateFormData({ amount: reservation.unit.price });
    }
  };

  // Create reservation options for dropdown
  const reservationOptions = reservations.map((reservation) => {
    const unitNumber = reservation.unit?.unitNumber || 'Unknown';
    const tenantName = reservation.user?.fullName || 'Unknown';
    return {
      value: reservation.id,
      label: `${unitNumber} - ${tenantName}`,
    };
  });

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCheckImage(e.target.files[0]);
    }
  };

  // Format currency input
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      updateFormData({ amount: value === '' ? 0 : parseFloat(value) });
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
        
        {/* Reservation Selection */}
        <div className="space-y-4">
          <Select
            label="Reservation"
            id="reservationId"
            name="reservationId"
            value={formData.reservationId.toString()}
            onChange={handleReservationChange}
            options={reservationOptions}
            disabled={isLoadingReservations || isEdit || !!preSelectedReservationId}
            required
            fullWidth
            helpText={isLoadingReservations ? 'Loading reservations...' : 'Select the reservation for this payment'}
            emptyOptionLabel="Select a reservation"
          />
          
          {selectedReservation && (
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Reservation Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Unit:</span>
                  <span className="ml-2 font-medium">{selectedReservation.unit?.unitNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Tenant:</span>
                  <span className="ml-2 font-medium">{selectedReservation.user?.fullName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Period:</span>
                  <span className="ml-2">{new Date(selectedReservation.startDate).toLocaleDateString()} - {new Date(selectedReservation.endDate).toLocaleDateString()}</span>
                </div>
                {selectedReservation.unit?.price && (
                  <div>
                    <span className="text-gray-500">Monthly Rent:</span>
                    <span className="ml-2 font-medium">{formatCurrency(selectedReservation.unit.price)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Payment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Amount"
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount.toString()}
            onChange={handleAmountChange}
            required
            fullWidth
            leftIcon={<span className="text-gray-500">$</span>}
          />
          
          <Input
            label="Payment Date"
            id="paymentDate"
            name="paymentDate"
            type="date"
            value={formData.paymentDate}
            onChange={handleChange}
            required
            fullWidth
          />
          
          <Select
            label="Payment Method"
            id="paymentMethod"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            options={paymentMethodOptions}
            required
            fullWidth
          />
          
          <Select
            label="Status"
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={paymentStatusOptions}
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
            placeholder="Additional information about this payment..."
          />
        </div>
        
        {/* Check Image (only shown for check payment method) */}
        {formData.paymentMethod === 'check' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Check Image {isEdit ? '(Optional)' : '(Recommended)'}
            </label>
            <input
              type="file"
              id="checkImage"
              name="checkImage"
              onChange={handleFileChange}
              accept="image/*"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {initialData?.checkUrl && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">Current check image:</p>
                <a
                  href={initialData.checkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                >
                  View current check image
                </a>
              </div>
            )}
          </div>
        )}
        
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
            {isEdit ? 'Update Payment' : 'Create Payment'}
          </Button>
        </div>
      </form>
    </Card>
  );
}