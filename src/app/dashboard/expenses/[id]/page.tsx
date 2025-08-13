'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Expense } from '@/lib/types';
import { expensesApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDate, formatCurrency } from '@/lib/utils';
import { EXPENSE_TYPE_OPTIONS } from '@/constants';

export default function ExpenseDetailPage() {
    const router = useRouter();
    const params = useParams();
    const expenseId = params?.id as string;

    const [expense, setExpense] = useState<Expense | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (expenseId) {
            fetchExpense();
        }
    }, [expenseId]);

    const fetchExpense = async () => {
        try {
            setIsLoading(true);
            const response = await expensesApi.getById(expenseId);
            if (response.success) {
                setExpense(response.data);
            } else {
                toast.error(response.message || 'فشل في جلب تفاصيل المصروف');
                router.push('/dashboard/expenses');
            }
        } catch (error) {
            console.error('خطأ في جلب تفاصيل المصروف:', error);
            toast.error('حدث خطأ أثناء جلب تفاصيل المصروف');
            router.push('/dashboard/expenses');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!expense) return;

        try {
            setIsDeleting(true);
            const response = await expensesApi.delete(expense.id);

            if (response.success) {
                toast.success('تم حذف المصروف بنجاح');
                router.push('/dashboard/expenses');
            } else {
                toast.error(response.message || 'فشل في حذف المصروف');
            }
        } catch (error) {
            console.error('خطأ في حذف المصروف:', error);
            toast.error('حدث خطأ أثناء حذف المصروف');
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
        }
    };

    const getExpenseTypeName = (type: string): string => {
        const typeOption = EXPENSE_TYPE_OPTIONS.find(option => option.value === type);
        return typeOption?.label || type;
    };

    const getExpenseTypeColor = (type: string): string => {
        switch (type) {
            case 'maintenance':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'utilities':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'insurance':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'cleaning':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'security':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'management':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'repairs':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'other':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="space-y-4">
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-48 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!expense) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">المصروف غير موجود</h3>
                <p className="text-gray-600 mb-4">المصروف المطلوب غير موجود أو تم حذفه.</p>
                <Link href="/dashboard/expenses">
                    <Button variant="primary">العودة إلى المصاريف</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <Link href="/dashboard/expenses" className="text-gray-500 hover:text-gray-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <span className="text-gray-500">/</span>
                        <span className="text-gray-900">تفاصيل المصروف</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        مصروف {getExpenseTypeName(expense.expenseType)}
                    </h1>
                    <p className="text-gray-600">
                        {expense.building?.name || `مبنى #${expense.buildingId}`}
                        {expense.unit && ` - وحدة ${expense.unit.unitNumber}`}
                    </p>
                </div>

                <div className="flex gap-3">
                    <Link href={`/dashboard/expenses/${expense.id}/edit`}>
                        <Button variant="outline">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            تعديل
                        </Button>
                    </Link>
                    <Button
                        variant="danger"
                        onClick={() => setDeleteModalOpen(true)}
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        حذف
                    </Button>
                </div>
            </div>

            {/* Expense Overview Card */}
            <Card>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                نوع المصروف
                            </label>
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getExpenseTypeColor(expense.expenseType)}`}>
                                {getExpenseTypeName(expense.expenseType)}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                المبلغ
                            </label>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(expense.amount)}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                تاريخ المصروف
                            </label>
                            <p className="text-gray-900 font-medium">
                                {formatDate(expense.expenseDate)}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                تاريخ التسجيل
                            </label>
                            <p className="text-gray-600">
                                {formatDate(expense.createdAt)}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Building and Unit Information Card */}
            <Card>
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات المبنى والوحدة</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Building Information */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                اسم المبنى
                            </label>
                            <p className="text-gray-900 font-medium">
                                {expense.building?.name || `مبنى #${expense.buildingId}`}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                رقم المبنى
                            </label>
                            <p className="text-gray-900 font-medium">
                                {expense.building?.buildingNumber || 'غير محدد'}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                عنوان المبنى
                            </label>
                            <p className="text-gray-600">
                                {expense.building?.address || 'غير محدد'}
                            </p>
                        </div>

                        {/* Unit Information */}
                        {expense.unit && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        رقم الوحدة
                                    </label>
                                    <p className="text-gray-900 font-medium">
                                        {expense.unit.unitNumber}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        نوع الوحدة
                                    </label>
                                    <p className="text-gray-900 font-medium">
                                        {expense.unit.unitType === 'apartment' ? 'شقة' :
                                            expense.unit.unitType === 'shop' ? 'محل' :
                                                expense.unit.unitType === 'office' ? 'مكتب' :
                                                    expense.unit.unitType === 'villa' ? 'فيلا' :
                                                        expense.unit.unitType === 'studio' ? 'استديو' :
                                                            expense.unit.unitType === 'room' ? 'غرفة' : expense.unit.unitType}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        الطابق
                                    </label>
                                    <p className="text-gray-900 font-medium">
                                        {expense.unit.floor}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        إجراءات الوحدة
                                    </label>
                                    <Link
                                        href={`/dashboard/units/${expense.unitId}`}
                                        className="text-primary-600 hover:text-primary-500 font-medium"
                                    >
                                        عرض تفاصيل الوحدة →
                                    </Link>
                                </div>
                            </>
                        )}

                        {/* Responsible Party */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                الطرف المسؤول
                            </label>
                            <p className="text-gray-900 font-medium">
                                {expense.responsibleParty === 'owner' ? 'المالك' : 'المستأجر'}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Notes Card */}
            {expense.notes && (
                <Card>
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">الملاحظات</h3>
                        <div className="bg-gray-50 rounded-md p-4">
                            <p className="text-gray-700 whitespace-pre-wrap">
                                {expense.notes}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Attachment Card */}
            {expense.attachmentFile && (
                <Card>
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">المرفقات</h3>
                        <div className="bg-gray-50 rounded-md p-4">
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {expense.attachmentFile.split('/').pop() || 'ملف مرفق'}
                                    </p>
                                    {expense.attachmentDescription && (
                                        <p className="text-sm text-gray-500">
                                            {expense.attachmentDescription}
                                        </p>
                                    )}
                                </div>
                                <div className="flex-shrink-0">
                                    <a
                                        href={expense.attachmentFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        عرض الملف
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* System Information Card */}
            <Card>
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات النظام</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                تاريخ الإنشاء
                            </label>
                            <p className="text-gray-600">
                                {formatDate(expense.createdAt)}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                آخر تحديث
                            </label>
                            <p className="text-gray-600">
                                {formatDate(expense.updatedAt)}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="حذف المصروف"
            >
                <div className="p-6">
                    <p className="text-gray-600 mb-4">
                        هل أنت متأكد أنك تريد حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.
                    </p>

                    <div className="bg-gray-50 rounded-md p-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">نوع المصروف:</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getExpenseTypeColor(expense.expenseType).replace('border-', '').replace(' border-orange-200', '').replace(' border-blue-200', '').replace(' border-green-200', '').replace(' border-purple-200', '').replace(' border-red-200', '').replace(' border-gray-200', '').replace(' border-yellow-200', '').replace(' border-indigo-200', '')}`}>
                                {getExpenseTypeName(expense.expenseType)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">المبلغ:</span>
                            <span className="text-sm font-bold text-gray-900">{formatCurrency(expense.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">التاريخ:</span>
                            <span className="text-sm text-gray-600">{formatDate(expense.expenseDate)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">المبنى:</span>
                            <span className="text-sm text-gray-600">
                                {expense.building?.name || `مبنى #${expense.buildingId}`}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">الوحدة:</span>
                            <span className="text-sm text-gray-600">
                                {expense.unit ? `وحدة ${expense.unit.unitNumber}` : 'غير محدد'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">الطرف المسؤول:</span>
                            <span className="text-sm text-gray-600">
                                {expense.responsibleParty === 'owner' ? 'المالك' : 'المستأجر'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
                        <strong>ملاحظة:</strong> حذف سجل المصروفات قد يؤثر على سجلاتك المالية والتقارير.
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteModalOpen(false)}
                            disabled={isDeleting}
                        >
                            إلغاء
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            isLoading={isDeleting}
                            disabled={isDeleting}
                        >
                            حذف المصروف
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}