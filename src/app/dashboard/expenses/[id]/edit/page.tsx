
"use client";
import { expensesApi } from '@/lib/api';
import { use, useState, useEffect } from 'react';
import ExpenseForm from '../../create/page';

export default function EditExpenseForm({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [expense, setExpense] = useState<any>(null);

    useEffect(() => {
        expensesApi.getById(id).then((e) => {
            setExpense(e.data as any);
        });
    }, [])
    return <ExpenseForm isEdit={true}
        initialData={expense}
    />;
}
