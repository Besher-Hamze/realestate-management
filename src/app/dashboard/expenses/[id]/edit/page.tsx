
"use client";
import { expensesApi } from '@/lib/api';
import { use, useState, useEffect } from 'react';
import ExpenseForm from '../../create/page';
import { Expense } from '@/lib/types';

export default function EditExpenseForm({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [expense, setExpense] = useState<Expense | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadExpense = async () => {
            try {
                const response = await expensesApi.getById(id);
                if (response.success) {
                    setExpense(response.data);
                }
            } catch (error) {
                console.error('Error loading expense:', error);
            } finally {
                setLoading(false);
            }
        };

        loadExpense();
    }, [id]);

    if (loading) {
        return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
    }

    if (!expense) {
        return <div className="text-center text-red-600">لم يتم العثور على المصروف</div>;
    }

    return <ExpenseForm isEdit={true} initialData={expense} />;
}
