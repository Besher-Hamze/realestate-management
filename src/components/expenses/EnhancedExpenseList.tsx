'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Expense } from '@/lib/types';
import Table, { TableColumn } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { expensesApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { EXPENSE_TYPE_OPTIONS } from '@/constants';

interface EnhancedExpenseListProps {
    expenses: Expense[];
    isLoading: boolean;
    onRefresh: () => void;
    onDelete?: (id: number) => void;
}

export default function EnhancedExpenseList({
    expenses,
    isLoading,
    onRefresh,
    onDelete,
}: EnhancedExpenseListProps) {
    const router = useRouter();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handle row click to view details
    const handleRowClick = (expense: Expense) => {
        router.push(`/dashboard/expenses/${expense.id}`);
    };

    // Open delete confirmation modal
    const openDeleteModal = (expense: Expense, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedExpense(expense);
        setDeleteModalOpen(true);
    };

    // Delete expense
    const handleDelete = async () => {
        if (!selectedExpense) return;

        try {
            setIsDeleting(true);
            const response = await expensesApi.delete(selectedExpense.id);

            if (response.success) {
                toast.success('تم حذف المصروف بنجاح');
                setDeleteModalOpen(false);
                if (onDelete) {
                    onDelete(selectedExpense.id);
                }
                onRefresh();
            } else {
                toast.error(response.message || 'فشل في حذف المصروف');
            }
        } catch (error) {
            console.error('خطأ في حذف المصروف:', error);
            toast.error('حدث خطأ أثناء حذف المصروف');
        } finally {
            setIsDeleting(false);
        }
    };

    // Get translated expense type name
    const getExpenseTypeName = (type: string): string => {
        const typeOption = EXPENSE_TYPE_OPTIONS.find(option => option.value === type);
        return typeOption?.label || type;
    };

    // Get expense type color
    const getExpenseTypeColor = (type: string): string => {
        switch (type) {
            case 'maintenance':
                return 'bg-orange-100 text-orange-800';
            case 'utilities':
                return 'bg-blue-100 text-blue-800';
            case 'insurance':
                return 'bg-green-100 text-green-800';
            case 'cleaning':
                return 'bg-purple-100 text-purple-800';
            case 'security':
                return 'bg-red-100 text-red-800';
            case 'management':
                return 'bg-gray-100 text-gray-800';
            case 'repairs':
                return 'bg-yellow-100 text-yellow-800';
            case 'other':
                return 'bg-indigo-100 text-indigo-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Get expense type icon
    const getExpenseTypeIcon = (type: string): JSX.Element => {
        switch (type) {
            case 'maintenance':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
                    </svg>
                );
            case 'utilities':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                );
            case 'insurance':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                );
            case 'cleaning':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                );
            case 'security':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                );
            case 'management':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                );
            case 'repairs':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                );
        }
    };

    // Table columns definition
    const columns: TableColumn<Expense>[] = [
        {
            key: 'expenseDate',
            header: 'تاريخ المصروف',
            cell: (expense: Expense) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{formatDate(expense.expenseDate)}</span>
                    <span className="text-xs text-gray-500">
                        {new Date(expense.expenseDate).toLocaleDateString('ar-SA', {
                            weekday: 'short'
                        })}
                    </span>
                </div>
            ),
        },
        {
            key: 'expenseType',
            header: 'نوع المصروف',
            cell: (expense: Expense) => (
                <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getExpenseTypeColor(expense.expenseType)}`}>
                        <span className="mr-1">{getExpenseTypeIcon(expense.expenseType)}</span>
                        {getExpenseTypeName(expense.expenseType)}
                    </span>
                </div>
            ),
        },
        {
            key: 'unit',
            header: 'الوحدة',
            cell: (expense: Expense) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                        {expense.unit ? `وحدة ${expense.unit.unitNumber}` : `وحدة #${expense.unitId}`}
                    </span>
                    {expense.unit?.building && (
                        <span className="text-sm text-gray-500">
                            {expense.unit.building.name}
                        </span>
                    )}
                    {expense.unit?.building?.buildingNumber && (
                        <span className="text-xs text-gray-400">
                            مبنى رقم {expense.unit.building.buildingNumber}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'amount',
            header: 'المبلغ',
            cell: (expense: Expense) => (
                <div className="flex flex-col items-end">
                    <span className="font-bold text-lg text-gray-900">{formatCurrency(expense.amount)}</span>
                    <span className="text-xs text-gray-500">ريال عماني</span>
                </div>
            ),
        },
        {
            key: 'notes',
            header: 'الملاحظات',
            cell: (expense: Expense) => (
                <div className="max-w-xs">
                    {expense.notes ? (
                        <div className="group relative">
                            <span className="text-gray-600 truncate block cursor-help">
                                {expense.notes.length > 30 ? `${expense.notes.substring(0, 30)}...` : expense.notes}
                            </span>
                            {expense.notes.length > 30 && (
                                <div className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-1 text-sm text-gray-700 bg-white border border-gray-200 rounded-md shadow-lg">
                                    {expense.notes}
                                </div>
                            )}
                        </div>
                    ) : (
                        <span className="text-gray-400 italic">لا توجد ملاحظات</span>
                    )}
                </div>
            ),
        },
        {
            key: 'createdAt',
            header: 'تاريخ الإنشاء',
            cell: (expense: Expense) => (
                <div className="flex flex-col">
                    <span className="text-sm text-gray-600">{formatDate(expense.createdAt)}</span>
                    <span className="text-xs text-gray-400">
                        {new Date(expense.createdAt).toLocaleTimeString('ar-SA', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                </div>
            ),
        },
        {
            key: 'actions',
            header: 'الإجراءات',
            cell: (expense: Expense) => (
                <div className="flex gap-2">
                    <Button
                        size="xs"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/expenses/${expense.id}`);
                        }}
                        title="عرض التفاصيل"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </Button>
                    <Button
                        size="xs"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/expenses/${expense.id}/edit`);
                        }}
                        title="تعديل"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </Button>
                    <Button
                        size="xs"
                        variant="danger"
                        onClick={(e) => openDeleteModal(expense, e)}
                        title="حذف"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Table
                data={expenses}
                columns={columns}
                keyExtractor={(expense) => expense.id}
                isLoading={isLoading}
                emptyMessage="لم يتم العثور على مصاريف"
                onRowClick={handleRowClick}
            />

            {/* Delete confirmation modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="حذف المصروف"
            >
                <div className="p-6">
                    <p className="text-gray-600 mb-4">
                        هل أنت متأكد أنك تريد حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.
                    </p>

                    {selectedExpense && (
                        <div className="bg-gray-50 rounded-md p-4 mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">نوع المصروف:</span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getExpenseTypeColor(selectedExpense.expenseType)}`}>
                                    <span className="mr-1">{getExpenseTypeIcon(selectedExpense.expenseType)}</span>
                                    {getExpenseTypeName(selectedExpense.expenseType)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">المبلغ:</span>
                                <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedExpense.amount)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">التاريخ:</span>
                                <span className="text-sm text-gray-600">{formatDate(selectedExpense.expenseDate)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">الوحدة:</span>
                                <span className="text-sm text-gray-600">
                                    {selectedExpense.unit ? `وحدة ${selectedExpense.unit.unitNumber}` : `وحدة #${selectedExpense.unitId}`}
                                    {selectedExpense.unit?.building && ` - ${selectedExpense.unit.building.name}`}
                                </span>
                            </div>
                            {selectedExpense.notes && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                    <span className="text-sm font-medium text-gray-700 block mb-1">الملاحظات:</span>
                                    <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                                        {selectedExpense.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

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
                            حذف
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}