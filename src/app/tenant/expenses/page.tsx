'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Expense, Building, RealEstateUnit, ExpenseStatistics } from '@/lib/types';
import { expensesApi, buildingsApi, unitsApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { formatCurrency } from '@/lib/utils';
import EnhancedExpenseList from '@/components/expenses/EnhancedExpenseList';
import { EXPENSE_TYPE_OPTIONS } from '@/constants';

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [units, setUnits] = useState<RealEstateUnit[]>([]);
    const [filteredUnits, setFilteredUnits] = useState<RealEstateUnit[]>([]);
    const [statistics, setStatistics] = useState<ExpenseStatistics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [buildingFilter, setBuildingFilter] = useState<string>('all');
    const [unitFilter, setUnitFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all'); // all, this_month, last_month, this_year

    // Filter options
    const typeOptions = [
        { value: 'all', label: 'جميع الأنواع' },
        ...EXPENSE_TYPE_OPTIONS,
    ];

    const buildingOptions = [
        { value: 'all', label: 'جميع المباني' },
        ...buildings.map(building => ({
            value: building.id.toString(),
            label: `${building.name} - ${building.buildingNumber}`
        }))
    ];

    const unitOptions = [
        { value: 'all', label: 'جميع الوحدات' },
        ...filteredUnits.map(unit => ({
            value: unit.id.toString(),
            label: `وحدة ${unit.unitNumber}${unit.building ? ` - ${unit.building.name}` : ''}`
        }))
    ];

    const dateOptions = [
        { value: 'all', label: 'جميع التواريخ' },
        { value: 'this_month', label: 'هذا الشهر' },
        { value: 'last_month', label: 'الشهر الماضي' },
        { value: 'this_year', label: 'هذا العام' },
    ];

    // Load initial data
    useEffect(() => {
        fetchInitialData();
    }, []);

    // Apply filters when expenses or filters change
    useEffect(() => {
        applyFilters();
    }, [expenses, typeFilter, buildingFilter, unitFilter, dateFilter]);

    // Update units when building filter changes
    useEffect(() => {
        filterUnitsByBuilding();
        if (buildingFilter !== 'all') {
            setUnitFilter('all');
        }
    }, [buildingFilter, units]);

    const fetchInitialData = async () => {
        try {
            setIsLoading(true);
            await Promise.all([
                fetchExpenses(),
                fetchBuildings(),
                fetchUnits(),
                // fetchStatistics(),
            ]);
        } catch (error) {
            console.error('خطأ في جلب البيانات الأولية:', error);
            toast.error('حدث خطأ أثناء جلب البيانات');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchExpenses = async () => {
        try {
            const response = await expensesApi.getAll();
            if (response.success) {
                setExpenses(response.data);
            } else {
                toast.error(response.message || 'فشل في جلب المصاريف');
            }
        } catch (error) {
            console.error('خطأ في جلب المصاريف:', error);
            toast.error('حدث خطأ أثناء جلب المصاريف');
        }
    };

    const fetchBuildings = async () => {
        try {
            const response = await buildingsApi.getAll();
            if (response.success) {
                setBuildings(response.data);
            }
        } catch (error) {
            console.error('خطأ في جلب المباني:', error);
        }
    };

    const fetchUnits = async () => {
        try {
            const response = await unitsApi.getAll();
            if (response.success) {
                setUnits(response.data);
                setFilteredUnits(response.data);
            }
        } catch (error) {
            console.error('خطأ في جلب الوحدات:', error);
        }
    };

    // const fetchStatistics = async () => {
    //     try {
    //         const response = await expensesApi.getStatistics();
    //         if (response.success) {
    //             setStatistics(response.data);
    //         }
    //     } catch (error) {
    //         console.error('خطأ في جلب الإحصائيات:', error);
    //     }
    // };

    const filterUnitsByBuilding = () => {
        if (buildingFilter === 'all') {
            setFilteredUnits(units);
        } else {
            const filtered = units.filter(unit => unit.buildingId.toString() === buildingFilter);
            setFilteredUnits(filtered);
        }
    };

    const applyFilters = () => {
        let filtered = [...expenses];

        // Type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(expense => expense.expenseType === typeFilter);
        }

        // Building filter
        if (buildingFilter !== 'all') {
            filtered = filtered.filter(expense =>
                expense.unit?.buildingId?.toString() === buildingFilter
            );
        }

        // Unit filter
        if (unitFilter !== 'all') {
            filtered = filtered.filter(expense =>
                expense.unit?.id.toString() === unitFilter
            );
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            filtered = filtered.filter(expense => {
                const expenseDate = new Date(expense.expenseDate);

                switch (dateFilter) {
                    case 'this_month':
                        return expenseDate.getMonth() === currentMonth &&
                            expenseDate.getFullYear() === currentYear;
                    case 'last_month':
                        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                        return expenseDate.getMonth() === lastMonth &&
                            expenseDate.getFullYear() === lastMonthYear;
                    case 'this_year':
                        return expenseDate.getFullYear() === currentYear;
                    default:
                        return true;
                }
            });
        }

        setFilteredExpenses(filtered);
    };

    const resetFilters = () => {
        setTypeFilter('all');
        setBuildingFilter('all');
        setUnitFilter('all');
        setDateFilter('all');
    };

    const handleDelete = (id: number) => {
        setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));
        // fetchStatistics(); // Refresh statistics
    };

    // Calculate totals for filtered expenses
    const calculateTotal = (type?: string) => {
        const expensesToCalculate = type
            ? filteredExpenses.filter(expense => expense.expenseType === type)
            : filteredExpenses;

        return expensesToCalculate.reduce((sum, expense) => sum + Number(expense.amount), 0);
    };

    const getExpenseCount = (type?: string) => {
        if (!type) return filteredExpenses.length;
        return filteredExpenses.filter(expense => expense.expenseType === type).length;
    };

    return (
        <div className="space-y-6">

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex flex-col space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-64">
                            <Select
                                label="نوع المصروف"
                                id="typeFilter"
                                name="typeFilter"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                options={typeOptions}
                                fullWidth
                            />
                        </div>
                        <div className="w-full sm:w-64">
                            <Select
                                label="المبنى"
                                id="buildingFilter"
                                name="buildingFilter"
                                value={buildingFilter}
                                onChange={(e) => setBuildingFilter(e.target.value)}
                                options={buildingOptions}
                                fullWidth
                            />
                        </div>
                        <div className="w-full sm:w-64">
                            <Select
                                label="الوحدة"
                                id="unitFilter"
                                name="unitFilter"
                                value={unitFilter}
                                onChange={(e) => setUnitFilter(e.target.value)}
                                options={unitOptions}
                                fullWidth
                                disabled={buildingFilter === 'all' && filteredUnits.length === units.length}
                            />
                        </div>
                        <div className="w-full sm:w-64">
                            <Select
                                label="الفترة الزمنية"
                                id="dateFilter"
                                name="dateFilter"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                options={dateOptions}
                                fullWidth
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                        <button
                            onClick={resetFilters}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            إعادة تعيين المرشحات
                        </button>

                        <div className="text-sm text-gray-600">
                            عرض {filteredExpenses.length} من أصل {expenses.length} مصروف
                            {(typeFilter !== 'all' || buildingFilter !== 'all' || unitFilter !== 'all' || dateFilter !== 'all') && (
                                <span className="mr-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                    مفلترة
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <EnhancedExpenseList
                    expenses={filteredExpenses}
                    isLoading={isLoading}
                    onRefresh={fetchInitialData}
                    onDelete={() => { }}
                />
            </div>
        </div>
    );
}