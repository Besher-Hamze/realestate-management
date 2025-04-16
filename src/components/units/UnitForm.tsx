import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import useForm from '@/hooks/useForm';
import { Unit, UnitFormData, UnitStatus, Building } from '@/lib/types';
import { unitsApi, buildingsApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';

interface UnitFormProps {
    isEdit?: boolean;
    initialData?: Unit;
    preSelectedBuildingId?: number;
    onSuccess?: (unit: Unit) => void;
}

const initialUnitData: UnitFormData = {
    buildingId: 0,
    unitNumber: '',
    floor: 1,
    area: 0,
    bedrooms: 1,
    bathrooms: 1,
    price: 0,
    status: 'available',
    description: '',
};

const statusOptions = [
    { value: 'available', label: 'متاحة' },
    { value: 'rented', label: 'مؤجرة' },
    { value: 'maintenance', label: 'تحت الصيانة' },
];

export default function UnitForm({
    isEdit = false,
    initialData,
    preSelectedBuildingId,
    onSuccess,
}: UnitFormProps) {
    const router = useRouter();
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);

    // إعداد البيانات الأولية لوضع التعديل أو مع مبنى محدد مسبقًا
    const formInitialData: UnitFormData = isEdit && initialData
        ? {
            buildingId: initialData.buildingId,
            unitNumber: initialData.unitNumber,
            floor: initialData.floor,
            area: initialData.area,
            bedrooms: initialData.bedrooms,
            bathrooms: initialData.bathrooms,
            price: initialData.price,
            status: initialData.status,
            description: initialData.description,
        }
        : preSelectedBuildingId
            ? { ...initialUnitData, buildingId: preSelectedBuildingId }
            : initialUnitData;

    // حالة النموذج باستخدام الخطاف المخصص
    const {
        formData,
        handleChange,
        handleSubmit,
        updateFormData,
        isSubmitting,
        error,
        resetForm,
    } = useForm<UnitFormData, Unit>(
        async (data) => {
            if (isEdit && initialData) {
                return unitsApi.update(initialData.id, data);
            }
            return unitsApi.create(data);
        },
        formInitialData,
        {
            onSuccess: (data) => {
                const successMessage = isEdit
                    ? 'تم تحديث الوحدة بنجاح'
                    : 'تم إنشاء الوحدة بنجاح';
                toast.success(successMessage);

                if (onSuccess) {
                    onSuccess(data);
                } else {
                    router.push(`/dashboard/units/${data.id}`);
                }
            },
            onError: (errorMessage) => {
                toast.error(errorMessage || 'حدث خطأ');
            },
        }
    );

    // إعادة تعيين النموذج عند تغيير البيانات الأولية (للتعديل) أو عند تغيير معرف المبنى المحدد مسبقًا
    useEffect(() => {
        if (isEdit && initialData) {
            resetForm();
        } else if (preSelectedBuildingId) {
            updateFormData({ buildingId: preSelectedBuildingId });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEdit, initialData?.id, preSelectedBuildingId]);

    // جلب المباني للقائمة المنسدلة
    useEffect(() => {
        const fetchBuildings = async () => {
            try {
                setIsLoadingBuildings(true);
                const response = await buildingsApi.getAll();

                if (response.success) {
                    setBuildings(response.data);
                } else {
                    toast.error(response.message || 'فشل في تحميل المباني');
                }
            } catch (error) {
                console.error('خطأ في جلب المباني:', error);
                toast.error('حدث خطأ أثناء تحميل المباني');
            } finally {
                setIsLoadingBuildings(false);
            }
        };

        fetchBuildings();
    }, []);

    // إنشاء خيارات المباني للقائمة المنسدلة
    const buildingOptions = buildings.map((building) => ({
        value: building.id,
        label: building.name,
    }));

    // التعامل مع إدخال الأرقام للتأكد من أنها رقمية
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numericValue = value === '' ? 0 : parseFloat(value);
        updateFormData({ [name]: numericValue } as unknown as Partial<UnitFormData>);
    };

    return (
        <Card>
            <form onSubmit={(e) => handleSubmit(e, formData)} className="space-y-6">
                {error && (
                    <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md mb-4">
                        {error}
                    </div>
                )}

                <Select
                    label="المبنى"
                    id="buildingId"
                    name="buildingId"
                    value={formData.buildingId}
                    onChange={handleChange}
                    options={buildingOptions}
                    disabled={isLoadingBuildings || isEdit}
                    required
                    fullWidth
                    helpText={isLoadingBuildings ? 'جاري تحميل المباني...' : undefined}
                />

                <Input
                    label="رقم الوحدة"
                    id="unitNumber"
                    name="unitNumber"
                    value={formData.unitNumber}
                    onChange={handleChange}
                    required
                    fullWidth
                    helpText="معرف فريد لهذه الوحدة (مثال: A101، 2B، إلخ.)"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="الطابق"
                        id="floor"
                        name="floor"
                        type="number"
                        value={formData.floor.toString()}
                        onChange={handleNumberChange}
                        min="0"
                        required
                        fullWidth
                    />

                    <Input
                        label="المساحة (م²)"
                        id="area"
                        name="area"
                        type="number"
                        value={formData.area.toString()}
                        onChange={handleNumberChange}
                        step="0.01"
                        min="0"
                        required
                        fullWidth
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="عدد غرف النوم"
                        id="bedrooms"
                        name="bedrooms"
                        type="number"
                        value={formData.bedrooms.toString()}
                        onChange={handleNumberChange}
                        min="0"
                        required
                        fullWidth
                    />

                    <Input
                        label="عدد الحمامات"
                        id="bathrooms"
                        name="bathrooms"
                        type="number"
                        value={formData.bathrooms.toString()}
                        onChange={handleNumberChange}
                        min="0"
                        step="0.5"
                        required
                        fullWidth
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="السعر"
                        id="price"
                        name="price"
                        type="number"
                        value={formData.price.toString()}
                        onChange={handleNumberChange}
                        step="0.01"
                        min="0"
                        required
                        fullWidth
                        leftIcon={
                            <span className="text-gray-500">$</span>
                        }
                    />

                    <Select
                        label="الحالة"
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        options={statusOptions}
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
                        {isEdit ? 'تحديث الوحدة' : 'إنشاء الوحدة'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}