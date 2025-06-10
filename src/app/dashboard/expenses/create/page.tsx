'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Expense, RealEstateUnit } from '@/lib/types';
import { expensesApi, unitsApi } from '@/lib/api';
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
    preSelectedUnitId?: number;
    onSuccess?: (expense: Expense) => void;
}

const initialExpenseData: Partial<ExpenseFormData> = {
    unitId: 0,
    expenseType: 'maintenance',
    amount: 0,
    expenseDate: new Date().toISOString().split('T')[0] as any,
    notes: '',
};

export default function ExpenseForm({
    isEdit = false,
    initialData,
    preSelectedUnitId,
    onSuccess,
}: ExpenseFormProps) {
    const router = useRouter();
    const [units, setUnits] = useState<RealEstateUnit[]>([]);
    const [loadingUnits, setLoadingUnits] = useState(true);

    // Initialize form with validation schema
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
    } = useAsyncForm<ExpenseFormData>(
        expenseSchema,
        isEdit && initialData ? {
            unitId: initialData.unitId,
            expenseType: initialData.expenseType,
            amount: initialData.amount,
            expenseDate: initialData.expenseDate.split('T')[0] as any,
            notes: initialData.notes || '',
        } : preSelectedUnitId ? {
            ...initialExpenseData,
            unitId: preSelectedUnitId,
        } : initialExpenseData
    );

    // Load units on component mount
    useEffect(() => {
        const loadUnits = async () => {
            try {
                const response = await unitsApi.getAll();
                if (response.success) {
                    setUnits(response.data);
                } else {
                    toast.error('فشل في تحميل قائمة الوحدات');
                }
            } catch (error) {
                console.error('Error loading units:', error);
                toast.error('حدث خطأ في تحميل الوحدات');
            } finally {
                setLoadingUnits(false);
            }
        };

        loadUnits();
    }, []);

    // Reset form when editing data changes
    useEffect(() => {
        if (isEdit && initialData) {
            reset({
                unitId: initialData.unitId,
                expenseType: initialData.expenseType,
                amount: initialData.amount,
                expenseDate: initialData.expenseDate.split('T')[0] as any,
                notes: initialData.notes || '',
            });
        } else if (preSelectedUnitId) {
            reset({
                ...initialExpenseData,
                unitId: preSelectedUnitId,
            });
        }
    }, [isEdit, initialData, preSelectedUnitId, reset]);

    // Form submission handler
    const onSubmit = async (data: ExpenseFormData) => {
        try {
            let response;

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

    // Prepare unit options
    const unitOptions = units.map(unit => ({
        value: unit.id.toString(),
        label: `وحدة ${unit.unitNumber} - ${unit.building?.name || 'غير محدد'} (${unit.building?.buildingNumber || ''})`,
    }));

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
                        label="الوحدة"
                        register={register}
                        name="unitId"
                        error={errors.unitId}
                        options={unitOptions}
                        required
                        placeholder={loadingUnits ? "جاري التحميل..." : "اختر الوحدة"}
                        disabled={loadingUnits || isEdit}
                        helpText={loadingUnits ? 'جاري تحميل الوحدات...' : 'اختر الوحدة المراد تسجيل المصروف لها'}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    </div>

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
                        disabled={isSubmitting || loadingUnits}
                    >
                        {isEdit ? 'تحديث المصروف' : 'إنشاء المصروف'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}