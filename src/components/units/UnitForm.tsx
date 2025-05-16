import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { RealEstateUnit, Building, CreateUnitFormData, UpdateUnitFormData } from '@/lib/types';
import { unitsApi, buildingsApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import {
    UNIT_TYPE_OPTIONS,
    UNIT_LAYOUT_OPTIONS,
    UNIT_STATUS_OPTIONS,
    FLOOR_OPTIONS
} from '@/constants/options';

interface UnitFormProps {
    isEdit?: boolean;
    initialData?: RealEstateUnit;
    preSelectedBuildingId?: number;
    onSuccess?: (unit: RealEstateUnit) => void;
}

const initialUnitData: CreateUnitFormData = {
    buildingId: 0,
    unitNumber: '',
    unitType: 'apartment',
    unitLayout: '2bhk',
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
}: UnitFormProps) {
    const router = useRouter();
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);
    const [formData, setFormData] = useState<CreateUnitFormData | UpdateUnitFormData>(
        isEdit && initialData
            ? {
                unitNumber: initialData.unitNumber,
                unitType: initialData.unitType,
                unitLayout: initialData.unitLayout || '2bhk',
                floor: initialData.floor,
                area: initialData.area,
                bathrooms: initialData.bathrooms,
                price: initialData.price,
                status: initialData.status,
                description: initialData.description,
            }
            : preSelectedBuildingId
                ? { ...initialUnitData, buildingId: preSelectedBuildingId }
                : initialUnitData
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string>('');

    // إعادة تعيين النموذج عند تغيير البيانات الأولية
    useEffect(() => {
        if (isEdit && initialData) {
            setFormData({
                unitNumber: initialData.unitNumber,
                unitType: initialData.unitType,
                unitLayout: initialData.unitLayout || '2bhk',
                floor: initialData.floor,
                area: initialData.area,
                bathrooms: initialData.bathrooms,
                price: initialData.price,
                status: initialData.status,
                description: initialData.description,
            });
        } else if (preSelectedBuildingId) {
            setFormData({ ...initialUnitData, buildingId: preSelectedBuildingId });
        } else {
            setFormData(initialUnitData);
        }
    }, [isEdit, initialData, preSelectedBuildingId]);

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

    // التعامل مع تغييرات الحقول
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    // التعامل مع إدخال الأرقام
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numericValue = value === '' ? 0 : parseFloat(value);
        setFormData(prevData => ({ ...prevData, [name]: numericValue }));
    };

    // تقديم النموذج
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            let response;

            if (isEdit && initialData) {
                response = await unitsApi.update(initialData.id, formData as UpdateUnitFormData);
            } else {
                response = await unitsApi.create(formData as CreateUnitFormData);
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
                setError(response.message || 'حدث خطأ أثناء حفظ الوحدة');
                toast.error(response.message || 'حدث خطأ');
            }
        } catch (error) {
            console.error('خطأ في حفظ الوحدة:', error);
            setError('حدث خطأ أثناء حفظ الوحدة');
            toast.error('حدث خطأ أثناء حفظ الوحدة');
        } finally {
            setIsSubmitting(false);
        }
    };

    // إنشاء خيارات المباني للقائمة المنسدلة
    const buildingOptions = buildings.map((building) => ({
        value: building.id,
        label: `${building.buildingNumber} - ${building.name}`,
    }));

    return (
        <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md mb-4">
                        {error}
                    </div>
                )}

                <Select
                    label="المبنى"
                    id="buildingId"
                    name="buildingId"
                    value={(formData as any).buildingId}
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
                    <Select
                        label="نوع الوحدة"
                        id="unitType"
                        name="unitType"
                        value={formData.unitType}
                        onChange={handleChange}
                        options={UNIT_TYPE_OPTIONS}
                        required
                        fullWidth
                    />

                    <Select
                        label="تخطيط الوحدة"
                        id="unitLayout"
                        name="unitLayout"
                        value={formData.unitLayout || ''}
                        onChange={handleChange}
                        options={UNIT_LAYOUT_OPTIONS}
                        fullWidth
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="الطابق"
                        id="floor"
                        name="floor"
                        value={formData.floor}
                        onChange={handleChange}
                        options={FLOOR_OPTIONS}
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

                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <Input
                        label="عدد الحمامات"
                        id="bathrooms"
                        name="bathrooms"
                        type="number"
                        value={formData.bathrooms.toString()}
                        onChange={handleNumberChange}
                        min="0"
                        step="1"
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
                        options={UNIT_STATUS_OPTIONS}
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