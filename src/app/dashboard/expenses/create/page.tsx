'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Expense, RealEstateUnit, Building } from '@/lib/types';
import { expensesApi, unitsApi, buildingsApi } from '@/lib/api';
import { expenseSchema, ExpenseFormData } from '@/lib/validations/schemas';
import { useAsyncForm } from '@/hooks/useYupForm';
import {
    FormInput,
    FormTextArea,
    FormSelect,
} from '@/components/ui/FormInputs';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { EXPENSE_TYPE_OPTIONS } from '@/constants';

interface ExpenseFormProps {
    isEdit?: boolean;
    initialData?: Expense;
    preSelectedBuildingId?: number;
    preSelectedUnitId?: number;
    onSuccess?: (expense: Expense) => void;
}

const RESPONSIBLE_PARTY_OPTIONS = [
    { value: 'owner', label: 'المالك' },
    { value: 'tenant', label: 'المستأجر' },
];

export default function ExpenseForm({
    isEdit = false,
    initialData,
    preSelectedBuildingId,
    preSelectedUnitId,
    onSuccess,
}: ExpenseFormProps) {
    const router = useRouter();
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [units, setUnits] = useState<RealEstateUnit[]>([]);
    const [loadingBuildings, setLoadingBuildings] = useState(true);
    const [loadingUnits, setLoadingUnits] = useState(false);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

    // Initialize form with validation schema
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
        watch,
        getValues,
    } = useAsyncForm<ExpenseFormData>(expenseSchema, {
        buildingId: preSelectedBuildingId || (initialData?.buildingId || ''),
        unitId: preSelectedUnitId || (initialData?.unitId || ''),
        responsibleParty: initialData?.responsibleParty || 'owner',
        expenseType: initialData?.expenseType || 'maintenance',
        amount: initialData?.amount || '',
        expenseDate: initialData?.expenseDate ? initialData.expenseDate.split('T')[0] : new Date().toISOString().split('T')[0],
        notes: initialData?.notes || '',
        attachmentDescription: initialData?.attachmentDescription || '',
    });

    // Watch buildingId for dynamic unit loading
    const watchedBuildingId = watch('buildingId');

    // Handle file upload change
    const handleAttachmentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        const file = files?.[0] || null;
        setAttachmentFile(file);
        setValue('attachmentFile', file);
    };

    // Set initial values when initialData changes (for edit mode)
    useEffect(() => {
        if (isEdit && initialData) {
            setValue('buildingId', initialData.buildingId.toString());
            setValue('unitId', initialData.unitId ? initialData.unitId.toString() : '');
            setValue('responsibleParty', initialData.responsibleParty);
            setValue('expenseType', initialData.expenseType);
            setValue('amount', initialData.amount.toString());
            setValue('expenseDate', initialData.expenseDate.split('T')[0]);
            setValue('notes', initialData.notes || '');
            setValue('attachmentDescription', initialData.attachmentDescription || '');
        }
    }, [isEdit, initialData, setValue]);

    // Load buildings on component mount
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
    }, []);

    // Load units when building changes
    useEffect(() => {
        if (watchedBuildingId > 0) {
            setLoadingUnits(true);
            const loadUnits = async () => {
                try {
                    const response = await unitsApi.getByBuildingId(watchedBuildingId);
                    if (response.success) {
                        setUnits(response.data);
                    } else {
                        setUnits([]);
                        toast.error('فشل في تحميل قائمة الوحدات');
                    }
                } catch (error) {
                    console.error('Error loading units:', error);
                    setUnits([]);
                    toast.error('حدث خطأ في تحميل الوحدات');
                } finally {
                    setLoadingUnits(false);
                }
            };

            loadUnits();
        } else {
            setUnits([]);
            setLoadingUnits(false);
        }
    }, [watchedBuildingId]);

    // Form submission handler
    const onSubmit = async (data: ExpenseFormData) => {
        try {
            let response;
            if (data.unitId == 0) {
                data.unitId = undefined;
            }

            if (isEdit && initialData) {
                response = await expensesApi.update(initialData.id, data);
            } else {

                response = await expensesApi.create(data);
            }

            if (response.success) {
                const successMessage = isEdit
                    ? 'تم تحديث المصروف بنجاح'
                    : 'تم إنشاء المصروف بنجاح';
                toast.success(successMessage);

                if (onSuccess) {
                    onSuccess(response.data);
                } else {
                    router.push(`/dashboard/expenses/${response.data.id}`);
                }
            } else {
                toast.error(response.message || 'حدث خطأ ما');
            }
        } catch (error: any) {
            console.error('Expense form submission error:', error);
            toast.error(error.message || 'حدث خطأ في الإرسال');
            throw error;
        }
    };

    // Prepare building options
    const buildingOptions = buildings.map(building => ({
        value: building.id.toString(),
        label: `${building.name} - ${building.buildingNumber}`,
    }));

    // Prepare unit options
    const unitOptions = [
        { value: "0", label: 'بدون تحديد وحدة' },
        ...units.map(unit => ({
            value: unit.id.toString(),
            label: `وحدة ${unit.unitNumber} - ${unit.unitType}`,
        }))
    ];

    // Format current date for input
    const getCurrentDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    return (
        <Card>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Information Section */}
                <div className="space-y-6">
                    <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-lg font-medium text-gray-900">معلومات المصروف الأساسية</h3>
                        <p className="text-sm text-gray-500 mt-1">يرجى إدخال المعلومات الأساسية للمصروف</p>
                    </div>

                    <FormSelect
                        label="المبنى"
                        register={register}
                        name="buildingId"
                        error={errors.buildingId}
                        options={buildingOptions}
                        required
                        placeholder={loadingBuildings ? "جاري التحميل..." : "اختر المبنى"}
                        disabled={loadingBuildings}
                        helpText={loadingBuildings ? 'جاري تحميل المباني...' : 'اختر المبنى المراد تسجيل المصروف له'}
                    />

                    <FormSelect
                        label="الوحدة (اختياري)"
                        register={register}
                        name="unitId"
                        error={errors.unitId}
                        options={unitOptions}
                        placeholder={loadingUnits ? "جاري التحميل..." : "اختر الوحدة (اختياري)"}
                        disabled={loadingUnits || !watchedBuildingId || Number(watchedBuildingId) === 0}
                        helpText={!watchedBuildingId || Number(watchedBuildingId) === 0 ? 'يرجى اختيار المبنى أولاً' : 'اختر الوحدة المحددة إذا كان المصروف خاص بوحدة معينة'}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormSelect
                            label="الطرف المسؤول"
                            register={register}
                            name="responsibleParty"
                            error={errors.responsibleParty}
                            options={RESPONSIBLE_PARTY_OPTIONS}
                            required
                            placeholder="اختر الطرف المسؤول"
                            helpText="حدد من سيتحمل مسؤولية هذا المصروف"
                        />

                        <FormSelect
                            label="نوع المصروف"
                            register={register}
                            name="expenseType"
                            error={errors.expenseType}
                            options={EXPENSE_TYPE_OPTIONS}
                            required
                            placeholder="اختر نوع المصروف"
                            helpText="حدد نوع المصروف المناسب"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput
                            label="المبلغ"
                            register={register}
                            name="amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            error={errors.amount}
                            required
                            helpText="المبلغ المدفوع بالريال العماني"
                            startIcon={<span className="text-gray-500">OMR</span>}
                        />

                        <FormInput
                            label="تاريخ المصروف"
                            register={register}
                            name="expenseDate"
                            type="date"
                            max={getCurrentDate()}
                            error={errors.expenseDate}
                            required
                            helpText="تاريخ تنفيذ المصروف"
                        />
                    </div>
                </div>

                {/* Attachment Section */}
                <div className="space-y-6">
                    <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-lg font-medium text-gray-900">المرفقات</h3>
                        <p className="text-sm text-gray-500 mt-1">إرفاق المستندات والملفات ذات الصلة</p>
                    </div>

                    {/* Custom File Input */}
                    <div>
                        <label htmlFor="attachmentFile" className="block text-sm font-medium text-gray-700 mb-2">
                            ملف مرفق (اختياري)
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 48 48"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <div className="flex text-sm text-gray-600">
                                    <label
                                        htmlFor="attachmentFile"
                                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                                    >
                                        <span>رفع ملف</span>
                                        <input
                                            id="attachmentFile"
                                            name="attachmentFile"
                                            type="file"
                                            className="sr-only"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleAttachmentFileChange}
                                        />
                                    </label>
                                    <p className="pl-1">أو سحب وإفلات</p>
                                </div>
                                <p className="text-xs text-gray-500">
                                    PDF, DOC, DOCX حتى 10MB
                                </p>
                                {attachmentFile && (
                                    <p className="text-sm text-green-600 mt-2">
                                        تم اختيار: {attachmentFile.name}
                                    </p>
                                )}
                            </div>
                        </div>
                        {errors.attachmentFile && (
                            <p className="mt-2 text-sm text-red-600">{errors.attachmentFile.message}</p>
                        )}
                        <p className="mt-2 text-sm text-gray-500">
                            يمكن إرفاق ملف PDF أو Word (الحد الأقصى 10 ميجابايت)
                        </p>
                    </div>

                    <FormInput
                        label="وصف المرفق (اختياري)"
                        register={register}
                        name="attachmentDescription"
                        error={errors.attachmentDescription}
                        helpText="وصف مختصر للملف المرفق"
                        placeholder="مثل: فاتورة الصيانة، عقد المقاول، إلخ..."
                    />
                </div>

                {/* Additional Information Section */}
                <div className="space-y-6">
                    <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-lg font-medium text-gray-900">معلومات إضافية</h3>
                        <p className="text-sm text-gray-500 mt-1">ملاحظات وتفاصيل إضافية</p>
                    </div>

                    <FormTextArea
                        label="ملاحظات"
                        register={register}
                        name="notes"
                        rows={4}
                        error={errors.notes}
                        helpText="أي ملاحظات إضافية حول المصروف (اختياري)"
                        placeholder="مثل: تفاصيل الصيانة، اسم المقاول، رقم الفاتورة، إلخ..."
                    />
                </div>

                {/* Expense Type Guidelines */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">إرشادات أنواع المصاريف:</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                        <p><strong>صيانة:</strong> الصيانة الدورية والوقائية للمبنى والوحدات</p>
                        <p><strong>خدمات:</strong> فواتير الكهرباء، الماء، الإنترنت، والهاتف</p>
                        <p><strong>تأمين:</strong> أقساط التأمين على المبنى والممتلكات</p>
                        <p><strong>تنظيف:</strong> خدمات التنظيف والنظافة العامة</p>
                        <p><strong>أمن:</strong> خدمات الأمن والحراسة</p>
                        <p><strong>إدارة:</strong> الرسوم الإدارية وأتعاب الإدارة</p>
                        <p><strong>إصلاحات:</strong> إصلاح الأعطال والأضرار</p>
                        <p><strong>أخرى:</strong> أي مصاريف أخرى لا تندرج تحت الفئات السابقة</p>
                    </div>
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
                        disabled={isSubmitting || loadingBuildings}
                    >
                        {isEdit ? 'تحديث المصروف' : 'إنشاء المصروف'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}