/**
 * Comprehensive Export Utilities with Puppeteer HTML-to-PDF
 * File: utils/export.ts
 * 
 * This file provides export functionality for all data types in the system
 * Supports both Excel (.xlsx) and PDF exports with perfect Arabic localization using Puppeteer
 */

import * as XLSX from 'xlsx';
import puppeteer, { Browser, Page } from 'puppeteer';
import {
    User,
    Building,
    RealEstateUnit,
    Company,
    Reservation,
    ServiceOrder,
    Payment,
    Expense,
    Role,
    BuildingType,
    CompanyType,
    UnitType,
    UnitLayout,
    UnitStatus,
    TenantType,
    ContractType,
    PaymentMethod,
    PaymentSchedule,
    ReservationStatus,
    ServiceType,
    ServiceStatus,
    PaymentStatus,
    ExpenseType,
    DepositPaymentMethod,
    DepositStatus
} from '@/lib/types';

// ===================================
// TYPES AND INTERFACES
// ===================================

interface ExportConfig {
    filename?: string;
    title?: string;
    includeStatistics?: boolean;
    headerColor?: string;
    landscape?: boolean;
    pageFormat?: 'A4' | 'A3' | 'Letter';
    margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
    };
}

interface SummaryInfo {
    label: string;
    value: string | number;
    icon?: string;
    color?: string;
}

interface StatGroup {
    label: string;
    items: Array<{ key: string; value: string | number; percentage?: number }>;
    type?: 'list' | 'chart' | 'grid';
}

interface PDFGenerationOptions {
    html: string;
    filename: string;
    config: ExportConfig;
}

type ExportableDataType = 'users' | 'buildings' | 'units' | 'companies' | 'reservations' | 'serviceOrders' | 'payments' | 'expenses';

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Safely normalize Arabic text for export
 */
const normalizeArabicText = (text: string | undefined | null): string => {
    if (!text) return '';

    try {
        return text
            .toString()
            .normalize('NFC')
            .trim()
            .replace(/[\u200E\u200F\u202A-\u202E]/g, ''); // Remove invisible RTL/LTR marks
    } catch (error) {
        console.warn('Text normalization failed:', error);
        return text?.toString() || '';
    }
};

/**
 * Format date for Arabic locale
 */
const formatArabicDate = (date: string | Date): string => {
    try {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    } catch (error) {
        console.warn('Date formatting failed:', error);
        return '';
    }
};

/**
 * Format currency for Arabic locale
 */
const formatArabicCurrency = (amount: number): string => {
    try {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'OMR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    } catch (error) {
        console.warn('Currency formatting failed:', error);
        return `${amount.toFixed(2)} ر.ع`;
    }
};

/**
 * Generate default filename
 */
const generateFilename = (type: string, extension: string): string => {
    const timestamp = new Date().toISOString().split('T')[0];
    const arabicTimestamp = new Date().toLocaleDateString('ar-SA').replace(/\//g, '-');
    return `${type}_report_${arabicTimestamp}_${timestamp}.${extension}`;
};

/**
 * Calculate percentage for statistics
 */
const calculatePercentage = (value: number, total: number): number => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
};

// ===================================
// ARABIC TRANSLATION MAPS
// ===================================

const TRANSLATIONS = {
    roles: {
        admin: 'مدير النظام',
        manager: 'مدير',
        accountant: 'محاسب',
        maintenance: 'صيانة',
        owner: 'مالك',
        tenant: 'مستأجر'
    } as Record<Role, string>,

    buildingTypes: {
        residential: 'سكني',
        commercial: 'تجاري',
        mixed: 'مختلط'
    } as Record<BuildingType, string>,

    companyTypes: {
        owner: 'مالك',
        agency: 'وكالة عقارية'
    } as Record<CompanyType, string>,

    unitTypes: {
        studio: 'استوديو',
        apartment: 'شقة',
        shop: 'محل تجاري',
        office: 'مكتب',
        villa: 'فيلا',
        room: 'غرفة'
    } as Record<UnitType, string>,

    unitLayouts: {
        studio: 'استوديو',
        '1bhk': 'غرفة وصالة',
        '2bhk': 'غرفتين وصالة',
        '3bhk': 'ثلاث غرف وصالة',
        '4bhk': 'أربع غرف وصالة',
        '5bhk': 'خمس غرف وصالة',
        '6bhk': 'ست غرف وصالة',
        '7bhk': 'سبع غرف وصالة',
        other: 'أخرى'
    } as Record<UnitLayout, string>,

    unitStatuses: {
        available: 'متاحة',
        rented: 'مؤجرة',
        maintenance: 'صيانة'
    } as Record<UnitStatus, string>,

    tenantTypes: {
        partnership: 'شراكة',
        commercial_register: 'سجل تجاري',
        person: 'شخص',
        embassy: 'سفارة',
        foreign_company: 'شركة أجنبية',
        government: 'حكومي',
        inheritance: 'وراثة',
        civil_registry: 'سجل مدني'
    } as Record<TenantType, string>,

    contractTypes: {
        residential: 'سكني',
        commercial: 'تجاري'
    } as Record<ContractType, string>,

    paymentMethods: {
        cash: 'نقدًا',
        checks: 'شيك'
    } as Record<PaymentMethod, string>,

    paymentSchedules: {
        monthly: 'شهري',
        quarterly: 'ربع سنوي',
        triannual: 'كل 4 أشهر',
        biannual: 'نصف سنوي',
        annual: 'سنوي'
    } as Record<PaymentSchedule, string>,

    reservationStatuses: {
        active: 'نشط',
        expired: 'منتهي',
        cancelled: 'ملغي'
    } as Record<ReservationStatus, string>,

    serviceTypes: {
        financial: 'مالي',
        maintenance: 'صيانة',
        administrative: 'إداري'
    } as Record<ServiceType, string>,

    serviceStatuses: {
        pending: 'قيد الانتظار',
        'in-progress': 'قيد التنفيذ',
        completed: 'مكتمل',
        rejected: 'مرفوض'
    } as Record<ServiceStatus, string>,

    paymentStatuses: {
        paid: 'مدفوعة',
        pending: 'قيد الانتظار',
        delayed: 'متأخرة',
        cancelled: 'ملغية'
    } as Record<PaymentStatus, string>,

    expenseTypes: {
        maintenance: 'صيانة',
        utilities: 'خدمات',
        insurance: 'تأمين',
        cleaning: 'تنظيف',
        security: 'أمن',
        management: 'إدارة',
        repairs: 'إصلاحات',
        other: 'أخرى'
    } as Record<ExpenseType, string>,

    depositPaymentMethods: {
        cash: 'نقدًا',
        check: 'شيك'
    } as Record<DepositPaymentMethod, string>,

    depositStatuses: {
        unpaid: 'غير مدفوع',
        paid: 'مدفوع',
        returned: 'مُسترد'
    } as Record<DepositStatus, string>,

    responsibleParties: {
        owner: 'المالك',
        tenant: 'المستأجر'
    },

    common: {
        yes: 'نعم',
        no: 'لا',
        total: 'إجمالي',
        reportDate: 'تاريخ التقرير',
        available: 'متاحة',
        rented: 'مؤجرة',
        maintenance: 'صيانة',
        active: 'نشطة',
        expired: 'منتهية',
        cancelled: 'ملغية',
        notSpecified: 'غير محدد',
        systemTitle: 'نظام إدارة العقارات',
        generatedOn: 'تم إنشاء هذا التقرير في',
        page: 'صفحة',
        of: 'من'
    }
};

// ===================================
// TRANSLATION HELPER FUNCTIONS
// ===================================

class TranslationService {
    static translate<T extends keyof typeof TRANSLATIONS>(
        category: T,
        key: string
    ): string {
        const translationMap = TRANSLATIONS[category] as Record<string, string>;
        return normalizeArabicText(translationMap[key] || key);
    }

    static translateRole = (role: Role): string =>
        this.translate('roles', role);

    static translateBuildingType = (type: BuildingType): string =>
        this.translate('buildingTypes', type);

    static translateCompanyType = (type: CompanyType): string =>
        this.translate('companyTypes', type);

    static translateUnitType = (type: UnitType): string =>
        this.translate('unitTypes', type);

    static translateUnitLayout = (layout: UnitLayout): string =>
        this.translate('unitLayouts', layout);

    static translateUnitStatus = (status: UnitStatus): string =>
        this.translate('unitStatuses', status);

    static translateTenantType = (type: TenantType): string =>
        this.translate('tenantTypes', type);

    static translateContractType = (type: ContractType): string =>
        this.translate('contractTypes', type);

    static translatePaymentMethod = (method: PaymentMethod): string =>
        this.translate('paymentMethods', method);

    static translatePaymentSchedule = (schedule: PaymentSchedule): string =>
        this.translate('paymentSchedules', schedule);

    static translateReservationStatus = (status: ReservationStatus): string =>
        this.translate('reservationStatuses', status);

    static translateServiceType = (type: ServiceType): string =>
        this.translate('serviceTypes', type);

    static translateServiceStatus = (status: ServiceStatus): string =>
        this.translate('serviceStatuses', status);

    static translatePaymentStatus = (status: PaymentStatus): string =>
        this.translate('paymentStatuses', status);

    static translateExpenseType = (type: ExpenseType): string =>
        this.translate('expenseTypes', type);

    static translateDepositPaymentMethod = (method: DepositPaymentMethod): string =>
        this.translate('depositPaymentMethods', method);

    static translateDepositStatus = (status: DepositStatus): string =>
        this.translate('depositStatuses', status);

    static translateResponsibleParty = (party: 'owner' | 'tenant'): string =>
        this.translate('responsibleParties', party);

    static translateCommon = (key: string): string =>
        this.translate('common', key);
}

// ===================================
// HTML TEMPLATE GENERATOR
// ===================================

class HTMLTemplateGenerator {
    private static getBaseCSS(): string {
        return `
        <style>
            /* Import Arabic Fonts */
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700;800&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap');
            
            /* CSS Reset */
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            /* Root Variables */
            :root {
                --primary-color: #2c3e50;
                --secondary-color: #3498db;
                --success-color: #27ae60;
                --warning-color: #f39c12;
                --danger-color: #e74c3c;
                --light-color: #ecf0f1;
                --dark-color: #2c3e50;
                --border-color: #bdc3c7;
                --shadow: 0 2px 10px rgba(0,0,0,0.1);
                --border-radius: 8px;
                --primary-font: 'Cairo', 'Noto Sans Arabic', Arial, sans-serif;
                --secondary-font: 'Noto Sans Arabic', Arial, sans-serif;
            }
            
            /* Body Styles */
            body {
                font-family: var(--primary-font);
                direction: rtl;
                text-align: right;
                line-height: 1.6;
                color: var(--dark-color);
                background: white;
                font-size: 14px;
                padding: 0;
                margin: 0;
            }
            
            /* Print Styles */
            @media print {
                body { 
                    padding: 0; 
                    margin: 0;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .no-print { display: none !important; }
                .page-break { page-break-before: always; }
                .avoid-break { page-break-inside: avoid; }
            }
            
            /* Container */
            .report-container {
                max-width: 100%;
                margin: 0 auto;
                padding: 30px;
                background: white;
                min-height: 100vh;
            }
            
            /* Header Styles */
            .report-header {
                text-align: center;
                margin-bottom: 40px;
                padding: 30px 20px;
                background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
                color: white;
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
                position: relative;
                overflow: hidden;
            }
            
            .report-header::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -50%;
                width: 200%;
                height: 200%;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="white" opacity="0.1"/></svg>') repeat;
                animation: float 20s ease-in-out infinite;
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-20px) rotate(180deg); }
            }
            
            .report-title {
                font-size: 2.5rem;
                font-weight: 800;
                margin-bottom: 10px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                position: relative;
                z-index: 1;
            }
            
            .report-subtitle {
                font-size: 1.1rem;
                opacity: 0.9;
                font-weight: 400;
                position: relative;
                z-index: 1;
            }
            
            /* Summary Cards */
            .summary-section {
                margin-bottom: 40px;
            }
            
            .summary-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .summary-card {
                background: white;
                border-radius: var(--border-radius);
                padding: 25px;
                box-shadow: var(--shadow);
                border-left: 5px solid var(--secondary-color);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .summary-card::before {
                content: '';
                position: absolute;
                top: 0;
                right: 0;
                width: 100%;
                height: 2px;
                background: linear-gradient(90deg, var(--secondary-color), transparent);
            }
            
            .summary-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 5px 20px rgba(0,0,0,0.15);
            }
            
            .summary-card.success { border-left-color: var(--success-color); }
            .summary-card.warning { border-left-color: var(--warning-color); }
            .summary-card.danger { border-left-color: var(--danger-color); }
            
            .card-label {
                font-size: 0.9rem;
                color: #7f8c8d;
                margin-bottom: 8px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .card-value {
                font-size: 2rem;
                font-weight: 700;
                color: var(--primary-color);
                margin-bottom: 5px;
            }
            
            .card-icon {
                position: absolute;
                top: 20px;
                left: 20px;
                font-size: 2rem;
                opacity: 0.1;
            }
            
            /* Statistics Section */
            .stats-section {
                margin-bottom: 40px;
                background: #f8f9fa;
                border-radius: var(--border-radius);
                padding: 30px;
                box-shadow: var(--shadow);
            }
            
            .stats-title {
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 20px;
                color: var(--primary-color);
                border-bottom: 2px solid var(--secondary-color);
                padding-bottom: 10px;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }
            
            .stat-item {
                background: white;
                padding: 15px 20px;
                border-radius: var(--border-radius);
                border: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.3s ease;
            }
            
            .stat-item:hover {
                border-color: var(--secondary-color);
                transform: scale(1.02);
            }
            
            .stat-key {
                font-weight: 500;
                color: var(--dark-color);
            }
            
            .stat-value {
                font-weight: 700;
                color: var(--secondary-color);
                font-size: 1.1rem;
            }
            
            .stat-percentage {
                font-size: 0.8rem;
                color: #7f8c8d;
                margin-right: 5px;
            }
            
            /* Table Styles */
            .table-section {
                margin-bottom: 40px;
                background: white;
                border-radius: var(--border-radius);
                overflow: hidden;
                box-shadow: var(--shadow);
            }
            
            .table-container {
                overflow-x: auto;
                max-width: 100%;
            }
            
            .data-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.9rem;
                margin: 0;
            }
            
            .data-table thead {
                background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
                color: white;
            }
            
            .data-table th {
                padding: 15px 12px;
                text-align: right;
                font-weight: 600;
                font-size: 0.85rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border: none;
                white-space: nowrap;
            }
            
            .data-table td {
                padding: 12px;
                text-align: right;
                border-bottom: 1px solid #ecf0f1;
                vertical-align: middle;
                word-wrap: break-word;
            }
            
            .data-table tbody tr {
                transition: background-color 0.3s ease;
            }
            
            .data-table tbody tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            
            .data-table tbody tr:hover {
                background-color: #e3f2fd;
            }
            
            /* Special cell types */
            .currency-cell {
                direction: ltr;
                text-align: left;
                font-weight: 600;
                color: var(--success-color);
            }
            
            .number-cell {
                direction: ltr;
                text-align: center;
                font-weight: 500;
            }
            
            .status-cell {
                font-weight: 500;
            }
            
            .status-active { color: var(--success-color); }
            .status-pending { color: var(--warning-color); }
            .status-cancelled { color: var(--danger-color); }
            
            /* Footer */
            .report-footer {
                margin-top: 60px;
                padding: 30px;
                background: linear-gradient(135deg, #ecf0f1 0%, #bdc3c7 100%);
                border-radius: var(--border-radius);
                text-align: center;
                color: var(--dark-color);
                box-shadow: var(--shadow);
            }
            
            .footer-content {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .footer-item {
                padding: 15px;
                background: white;
                border-radius: var(--border-radius);
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            }
            
            .footer-item h4 {
                margin-bottom: 5px;
                color: var(--primary-color);
                font-size: 0.9rem;
            }
            
            .footer-item p {
                color: #7f8c8d;
                font-size: 0.8rem;
                margin: 0;
            }
            
            .footer-note {
                border-top: 1px solid #bdc3c7;
                padding-top: 20px;
                font-size: 0.8rem;
                color: #7f8c8d;
                font-style: italic;
            }
            
            /* Responsive Design */
            @media (max-width: 768px) {
                .report-container { padding: 15px; }
                .report-title { font-size: 2rem; }
                .summary-cards { grid-template-columns: 1fr; }
                .stats-grid { grid-template-columns: 1fr; }
                .footer-content { grid-template-columns: 1fr; }
                .data-table { font-size: 0.8rem; }
                .data-table th, .data-table td { padding: 8px; }
            }
            
            /* Utility Classes */
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 700; }
            .font-medium { font-weight: 500; }
            .text-primary { color: var(--primary-color); }
            .text-secondary { color: var(--secondary-color); }
            .text-success { color: var(--success-color); }
            .text-warning { color: var(--warning-color); }
            .text-danger { color: var(--danger-color); }
            .mb-10 { margin-bottom: 10px; }
            .mb-20 { margin-bottom: 20px; }
            .mb-30 { margin-bottom: 30px; }
        </style>
        `;
    }

    static generateCompleteHTML(
        title: string,
        headers: string[],
        rows: (string | number)[][],
        summaryInfo?: SummaryInfo[],
        additionalStats?: StatGroup[],
        config: ExportConfig = {}
    ): string {
        const normalizedTitle = normalizeArabicText(title);
        const currentDate = formatArabicDate(new Date());

        return `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${normalizedTitle}</title>
            ${this.getBaseCSS()}
        </head>
        <body>
            <div class="report-container">
                <!-- Header Section -->
                <div class="report-header">
                    <h1 class="report-title">${normalizedTitle}</h1>
                    <p class="report-subtitle">${TranslationService.translateCommon('systemTitle')}</p>
                </div>

                <!-- Summary Section -->
                ${summaryInfo && summaryInfo.length > 0 ? `
                <div class="summary-section avoid-break">
                    <div class="summary-cards">
                        ${summaryInfo.map((info, index) => `
                            <div class="summary-card ${info.color || (index % 3 === 0 ? 'success' : index % 3 === 1 ? 'warning' : 'danger')}">
                                <div class="card-label">${normalizeArabicText(info.label)}</div>
                                <div class="card-value">${info.value}</div>
                                ${info.icon ? `<div class="card-icon">${info.icon}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Statistics Section -->
                ${additionalStats && additionalStats.length > 0 ? additionalStats.map(stat => `
                <div class="stats-section avoid-break">
                    <h3 class="stats-title">${normalizeArabicText(stat.label)}</h3>
                    <div class="stats-grid">
                        ${stat.items.map(item => `
                            <div class="stat-item">
                                <span class="stat-key">${normalizeArabicText(item.key)}</span>
                                <div>
                                    <span class="stat-value">${item.value}</span>
                                    ${item.percentage ? `<span class="stat-percentage">(${item.percentage}%)</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                `).join('') : ''}

                <!-- Table Section -->
                <div class="table-section">
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    ${headers.map(header => `
                                        <th>${normalizeArabicText(header)}</th>
                                    `).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map((row, rowIndex) => `
                                    <tr>
                                        ${row.map((cell, cellIndex) => {
            const cellValue = normalizeArabicText(String(cell || ''));
            let cellClass = '';

            // Determine cell type for styling
            if (cellValue.includes('ر.ع') || cellValue.includes('OMR')) {
                cellClass = 'currency-cell';
            } else if (!isNaN(Number(cellValue)) && cellValue !== '' && cellValue !== '0') {
                cellClass = 'number-cell';
            } else if (['نشط', 'مكتمل', 'مدفوعة', 'متاحة'].includes(cellValue)) {
                cellClass = 'status-cell status-active';
            } else if (['قيد الانتظار', 'قيد التنفيذ'].includes(cellValue)) {
                cellClass = 'status-cell status-pending';
            } else if (['ملغي', 'مرفوض', 'منتهي'].includes(cellValue)) {
                cellClass = 'status-cell status-cancelled';
            }

            return `<td class="${cellClass}">${cellValue}</td>`;
        }).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Footer Section -->
                <div class="report-footer">
                    <div class="footer-content">
                        <div class="footer-item">
                            <h4>${TranslationService.translateCommon('reportDate')}</h4>
                            <p>${currentDate}</p>
                        </div>
                        <div class="footer-item">
                            <h4>إجمالي السجلات</h4>
                            <p>${rows.length.toLocaleString('ar-SA')} سجل</p>
                        </div>
                        <div class="footer-item">
                            <h4>حالة التقرير</h4>
                            <p>مُوثق ومعتمد</p>
                        </div>
                    </div>
                    <div class="footer-note">
                        ${TranslationService.translateCommon('generatedOn')}: ${currentDate} | ${TranslationService.translateCommon('systemTitle')}
                        <br>
                        هذا التقرير مُنشأ آلياً ومُوثق من النظام | جميع الحقوق محفوظة
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

// ===================================
// PUPPETEER PDF SERVICE
// ===================================

// class PuppeteerPDFService {
//     private static browser: Browser | null = null;

//     /**
//      * Initialize browser instance
//      */
//     private static async initBrowser(): Promise<Browser> {
//         if (!this.browser || !this.browser.isConnected()) {
//             this.browser = await puppeteer.launch({
//                 headless: true,
//                 args: [
//                     '--no-sandbox',
//                     '--disable-setuid-sandbox',
//                     '--disable-dev-shm-usage',
//                     '--disable-accelerated-2d-canvas',
//                     '--no-first-run',
//                     '--no-zygote',
//                     '--single-process',
//                     '--disable-gpu'
//                 ]
//             });
//         }
//         return this.browser;
//     }

//     /**
//      * Generate PDF from HTML content
//      */
//     // public static async generatePDF(options: PDFGenerationOptions): Promise<Buffer> {
//     //     const browser = await this.initBrowser();
//     //     let page: Page | null = null;

//     //     try {
//     //         page = await browser.newPage();

//     //         // Set viewport and user agent
//     //         await page.setViewport({ width: 1200, height: 800 });
//     //         await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

//     //         // Set content and wait for fonts
//     //         await page.setContent(options.html, {
//     //             waitUntil: ['networkidle0', 'domcontentloaded'],
//     //             timeout: 30000
//     //         });

//     //         // Wait for fonts to load
//     //         await page.evaluateHandle('document.fonts.ready');

//     //         // Small delay to ensure rendering
//     //         await new Promise(resolve => setTimeout(resolve, 2000));

//     //         const pdfConfig = {
//     //             format: options.config.pageFormat || 'A4' as const,
//     //             landscape: options.config.landscape || false,
//     //             printBackground: true,
//     //             preferCSSPageSize: false,
//     //             margin: {
//     //                 top: options.config.margin?.top || '20mm',
//     //                 right: options.config.margin?.right || '15mm',
//     //                 bottom: options.config.margin?.bottom || '20mm',
//     //                 left: options.config.margin?.left || '15mm'
//     //             },
//     //             displayHeaderFooter: true,
//     //             headerTemplate: `
//     //                 <div style="width: 100%; font-size: 10px; text-align: center; color: #666; font-family: 'Cairo', sans-serif;">
//     //                     <span style="margin-right: 20px;">${normalizeArabicText(options.config.title || 'تقرير')}</span>
//     //                 </div>
//     //             `,
//     //             footerTemplate: `
//     //                 <div style="width: 100%; font-size: 10px; text-align: center; color: #666; font-family: 'Cairo', sans-serif; direction: rtl;">
//     //                     <span class="pageNumber"></span> ${TranslationService.translateCommon('page')} ${TranslationService.translateCommon('of')} <span class="totalPages"></span>
//     //                 </div>
//     //             `
//     //         };

//     //         const pdfBuffer = await page.pdf(pdfConfig);
//     //         return Buffer.from(pdfBuffer);

//     //     } catch (error: any) {
//     //         console.error('PDF generation failed:', error);
//     //         throw new Error(`PDF generation failed: ${error.message}`);
//     //     } finally {
//     //         if (page) {
//     //             await page.close();
//     //         }
//     //     }
//     // }

//     /**
//      * Save PDF buffer to file or return for download
//      */
//     private static async savePDF(pdfBuffer: Buffer, filename: string): Promise<void> {
//         if (typeof window !== 'undefined') {
//             // Browser environment - trigger download
//             const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
//             const url = URL.createObjectURL(blob);
//             const link = document.createElement('a');
//             link.href = url;
//             link.download = filename;
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);
//             URL.revokeObjectURL(url);
//         } else {
//             // Node.js environment - save to file
//             const fs = await import('fs');
//             fs.writeFileSync(filename, pdfBuffer);
//         }
//     }

//     /**
//      * Close browser instance
//      */
//     static async closeBrowser(): Promise<void> {
//         if (this.browser) {
//             await this.browser.close();
//             this.browser = null;
//         }
//     }

//     /**
//      * Main export method
//      */
//     // static async exportToPDF(
//     //     title: string,
//     //     headers: string[],
//     //     rows: (string | number)[][],
//     //     summaryInfo?: SummaryInfo[],
//     //     additionalStats?: StatGroup[],
//     //     config: ExportConfig = {}
//     // ): Promise<void> {
//     //     try {
//     //         const html = HTMLTemplateGenerator.generateCompleteHTML(
//     //             title,
//     //             headers,
//     //             rows,
//     //             summaryInfo,
//     //             additionalStats,
//     //             config
//     //         );

//     //         const filename = config.filename || generateFilename(title.toLowerCase().replace(/\s+/g, '_'), 'pdf');

//     //         const pdfBuffer = await this.generatePDF({
//     //             html,
//     //             filename,
//     //             config: { ...config, title }
//     //         });

//     //         await this.savePDF(pdfBuffer, filename);

//     //     } catch (error) {
//     //         console.error('Export to PDF failed:', error);
//     //         throw error;
//     //     }
//     // }
// }

// ===================================
// EXCEL EXPORT SERVICE (UNCHANGED)
// ===================================

class ExcelExportService {
    private static createWorksheet(data: any[], sheetName: string): XLSX.WorkBook {
        try {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();

            // Set column widths
            const maxCols = Math.max(...data.map(row => Object.keys(row).length));
            worksheet['!cols'] = Array(maxCols).fill({ wch: 20 });

            XLSX.utils.book_append_sheet(workbook, worksheet, normalizeArabicText(sheetName));
            return workbook;
        } catch (error) {
            console.error('Failed to create Excel worksheet:', error);
            throw new Error('Excel export failed');
        }
    }

    private static saveWorkbook(workbook: XLSX.WorkBook, filename: string): void {
        try {
            XLSX.writeFile(workbook, filename);
        } catch (error) {
            console.error('Failed to save Excel file:', error);
            throw new Error('Failed to save Excel file');
        }
    }

    static exportUsers(users: User[], config: ExportConfig = {}): void {
        const data = users.map(user => ({
            'رقم المستخدم': user.id,
            'اسم المستخدم': normalizeArabicText(user.username),
            'الاسم الكامل': normalizeArabicText(user.fullName),
            'البريد الإلكتروني': user.email || '',
            'رقم الهاتف': user.phone || '',
            'رقم الواتساب': user.whatsappNumber || '',
            'رقم الهوية': user.idNumber || '',
            'الدور': TranslationService.translateRole(user.role),
            'شركة المستخدم': user.companyId || '',
            'نوع المستأجر': user.tenantInfo?.tenantType ?
                TranslationService.translateTenantType(user.tenantInfo.tenantType) : '',
            'الأنشطة التجارية': normalizeArabicText(user.tenantInfo?.businessActivities),
            'شخص الاتصال': normalizeArabicText(user.tenantInfo?.contactPerson),
            'منصب شخص الاتصال': normalizeArabicText(user.tenantInfo?.contactPosition),
            'ملاحظات المستأجر': normalizeArabicText(user.tenantInfo?.notes),
            'تاريخ الإنشاء': formatArabicDate(user.createdAt),
            'تاريخ التحديث': formatArabicDate(user.updatedAt),
            'صورة الهوية متوفرة': user.identityImageFrontUrl ?
                TranslationService.translateCommon('yes') : TranslationService.translateCommon('no'),
            'صورة السجل التجاري متوفرة': user.commercialRegisterImageUrl ?
                TranslationService.translateCommon('yes') : TranslationService.translateCommon('no')
        }));

        const workbook = this.createWorksheet(data, 'المستخدمين');
        const filename = config.filename || generateFilename('users', 'xlsx');
        this.saveWorkbook(workbook, filename);
    }

    static exportBuildings(buildings: Building[], config: ExportConfig = {}): void {
        const data = buildings.map(building => ({
            'رقم المبنى': building.id,
            'رقم المبنى التسلسلي': building.buildingNumber,
            'اسم المبنى': normalizeArabicText(building.name),
            'العنوان': normalizeArabicText(building.address),
            'نوع المبنى': TranslationService.translateBuildingType(building.buildingType),
            'إجمالي الوحدات': building.totalUnits,
            'إجمالي الطوابق': building.totalFloors,
            'مواقف الانتظار الداخلية': building.internalParkingSpaces,
            'الوصف': normalizeArabicText(building.description),
            'رقم الشركة': building.companyId,
            'اسم الشركة': normalizeArabicText(building.company?.name),
            'نوع الشركة': building.company ?
                TranslationService.translateCompanyType(building.company.companyType) : '',
            'بريد الشركة': building.company?.email || '',
            'هاتف الشركة': building.company?.phone || '',
            'عدد الوحدات المتوفرة': building.units?.filter(u => u.status === 'available').length || 0,
            'عدد الوحدات المؤجرة': building.units?.filter(u => u.status === 'rented').length || 0,
            'عدد الوحدات في الصيانة': building.units?.filter(u => u.status === 'maintenance').length || 0,
            'تاريخ الإنشاء': formatArabicDate(building.createdAt),
            'تاريخ التحديث': formatArabicDate(building.updatedAt)
        }));

        const workbook = this.createWorksheet(data, 'المباني');
        const filename = config.filename || generateFilename('buildings', 'xlsx');
        this.saveWorkbook(workbook, filename);
    }

    static exportUnits(units: RealEstateUnit[], config: ExportConfig = {}): void {
        const data = units.map(unit => ({
            'رقم الوحدة الداخلي': unit.id,
            'رقم الوحدة': normalizeArabicText(unit.unitNumber),
            'نوع الوحدة': TranslationService.translateUnitType(unit.unitType),
            'تخطيط الوحدة': unit.unitLayout ?
                TranslationService.translateUnitLayout(unit.unitLayout) : '',
            'الطابق': unit.floor,
            'المساحة': unit.area,
            'عدد الحمامات': unit.bathrooms,
            'رقم الموقف': unit.parkingNumber || '',
            'السعر': unit.price,
            'السعر (منسق)': formatArabicCurrency(unit.price),
            'الحالة': TranslationService.translateUnitStatus(unit.status),
            'الوصف': normalizeArabicText(unit.description),
            'اسم المالك': normalizeArabicText(unit.ownerName),
            'رقم المبنى': unit.buildingId,
            'اسم المبنى': normalizeArabicText(unit.building?.name),
            'عنوان المبنى': normalizeArabicText(unit.building?.address),
            'نوع المبنى': unit.building ?
                TranslationService.translateBuildingType(unit.building.buildingType) : '',
            'اسم الشركة': normalizeArabicText(unit.building?.company?.name),
            'عدد الحجوزات النشطة': unit.reservations?.filter(r => r.status === 'active').length || 0,
            'عدد الحجوزات المنتهية': unit.reservations?.filter(r => r.status === 'expired').length || 0,
            'عدد الحجوزات الملغية': unit.reservations?.filter(r => r.status === 'cancelled').length || 0,
            'تاريخ الإنشاء': formatArabicDate(unit.createdAt),
            'تاريخ التحديث': formatArabicDate(unit.updatedAt)
        }));

        const workbook = this.createWorksheet(data, 'الوحدات');
        const filename = config.filename || generateFilename('units', 'xlsx');
        this.saveWorkbook(workbook, filename);
    }

    static exportCompanies(companies: Company[], config: ExportConfig = {}): void {
        const data = companies.map(company => ({
            'رقم الشركة': company.id,
            'اسم الشركة': normalizeArabicText(company.name),
            'نوع الشركة': TranslationService.translateCompanyType(company.companyType),
            'البريد الإلكتروني': company.email || '',
            'رقم الهاتف': company.phone || '',
            'رقم الواتساب': company.whatsappNumber || '',
            'الهاتف الثانوي': company.secondaryPhone || '',
            'رقم السجل التجاري': company.registrationNumber || '',
            'اسم المفوض': normalizeArabicText(company.delegateName),
            'العنوان': normalizeArabicText(company.address),
            'اسم المدير': normalizeArabicText(company.manager?.fullName),
            'بريد المدير': company.manager?.email || '',
            'هاتف المدير': company.manager?.phone || '',
            'عدد المباني': company.buildings?.length || 0,
            'إجمالي الوحدات': company.buildings?.reduce((sum, b) => sum + b.totalUnits, 0) || 0,
            'تاريخ الإنشاء': formatArabicDate(company.createdAt),
            'تاريخ التحديث': formatArabicDate(company.updatedAt),
            'شعار الشركة متوفر': company.logoImageUrl ?
                TranslationService.translateCommon('yes') : TranslationService.translateCommon('no'),
            'صورة الهوية متوفرة': company.identityImageFrontUrl ?
                TranslationService.translateCommon('yes') : TranslationService.translateCommon('no')
        }));

        const workbook = this.createWorksheet(data, 'الشركات');
        const filename = config.filename || generateFilename('companies', 'xlsx');
        this.saveWorkbook(workbook, filename);
    }

    static exportReservations(reservations: Reservation[], config: ExportConfig = {}): void {
        const data = reservations.map(reservation => ({
            'رقم الحجز': reservation.id,
            'رقم المستخدم': reservation.userId,
            'اسم المستأجر': normalizeArabicText(reservation.user?.fullName),
            'بريد المستأجر': reservation.user?.email || '',
            'هاتف المستأجر': reservation.user?.phone || '',
            'رقم الوحدة الداخلي': reservation.unitId,
            'رقم الوحدة': normalizeArabicText(reservation.unit?.unitNumber),
            'اسم المبنى': normalizeArabicText(reservation.unit?.building?.name),
            'نوع العقد': TranslationService.translateContractType(reservation.contractType),
            'تاريخ البداية': formatArabicDate(reservation.startDate),
            'تاريخ النهاية': formatArabicDate(reservation.endDate),
            'مدة العقد': normalizeArabicText(reservation.contractDuration),
            'طريقة الدفع': TranslationService.translatePaymentMethod(reservation.paymentMethod),
            'جدولة الدفع': TranslationService.translatePaymentSchedule(reservation.paymentSchedule),
            'يشمل تأمين': reservation.includesDeposit ?
                TranslationService.translateCommon('yes') : TranslationService.translateCommon('no'),
            'مبلغ التأمين': reservation.depositAmount || 0,
            'مبلغ التأمين (منسق)': reservation.depositAmount ?
                formatArabicCurrency(reservation.depositAmount) : '',
            'طريقة دفع التأمين': reservation.depositPaymentMethod ?
                TranslationService.translateDepositPaymentMethod(reservation.depositPaymentMethod) : '',
            'حالة التأمين': reservation.depositStatus ?
                TranslationService.translateDepositStatus(reservation.depositStatus) : '',
            'تاريخ دفع التأمين': reservation.depositPaidDate ?
                formatArabicDate(reservation.depositPaidDate) : '',
            'تاريخ استرداد التأمين': reservation.depositReturnedDate ?
                formatArabicDate(reservation.depositReturnedDate) : '',
            'ملاحظات التأمين': normalizeArabicText(reservation.depositNotes),
            'حالة الحجز': TranslationService.translateReservationStatus(reservation.status),
            'ملاحظات الحجز': normalizeArabicText(reservation.notes),
            'عدد المدفوعات': reservation.payments?.length || 0,
            'عدد طلبات الخدمة': reservation.serviceOrders?.length || 0,
            'تاريخ الإنشاء': formatArabicDate(reservation.createdAt),
            'تاريخ التحديث': formatArabicDate(reservation.updatedAt),
            'صورة العقد متوفرة': reservation.contractImageUrl ?
                TranslationService.translateCommon('yes') : TranslationService.translateCommon('no'),
            'ملف العقد متوفر': reservation.contractPdfUrl ?
                TranslationService.translateCommon('yes') : TranslationService.translateCommon('no')
        }));

        const workbook = this.createWorksheet(data, 'الحجوزات');
        const filename = config.filename || generateFilename('reservations', 'xlsx');
        this.saveWorkbook(workbook, filename);
    }

    static exportServiceOrders(serviceOrders: ServiceOrder[], config: ExportConfig = {}): void {
        const data = serviceOrders.map(order => ({
            'رقم طلب الخدمة': order.id,
            'رقم المستخدم': order.userId,
            'اسم مقدم الطلب': normalizeArabicText(order.user?.fullName),
            'رقم الحجز': order.reservationId,
            'رقم الوحدة': normalizeArabicText(order.reservation?.unit?.unitNumber),
            'اسم المبنى': normalizeArabicText(order.reservation?.unit?.building?.name),
            'نوع الخدمة': TranslationService.translateServiceType(order.serviceType),
            'نوع الخدمة الفرعي': normalizeArabicText(order.serviceSubtype),
            'الوصف': normalizeArabicText(order.description),
            'حالة الطلب': TranslationService.translateServiceStatus(order.status),
            'سعر الخدمة': order.servicePrice || 0,
            'سعر الخدمة (منسق)': order.servicePrice ?
                formatArabicCurrency(order.servicePrice) : '',
            'وصف الإنجاز': normalizeArabicText(order.completionDescription),
            'تاريخ الإنشاء': formatArabicDate(order.createdAt),
            'تاريخ التحديث': formatArabicDate(order.updatedAt),
            'مرفق الطلب متوفر': order.attachmentFileUrl ?
                TranslationService.translateCommon('yes') : TranslationService.translateCommon('no'),
            'مرفق الإنجاز متوفر': order.completionAttachmentUrl ?
                TranslationService.translateCommon('yes') : TranslationService.translateCommon('no'),
            'عدد تحديثات الحالة': order.serviceHistory?.length || 0
        }));

        const workbook = this.createWorksheet(data, 'طلبات الخدمة');
        const filename = config.filename || generateFilename('service_orders', 'xlsx');
        this.saveWorkbook(workbook, filename);
    }

    static exportPayments(payments: Payment[], config: ExportConfig = {}): void {
        const data = payments.map(payment => ({
            'رقم المدفوعة': payment.id,
            'رقم الحجز': payment.reservationId,
            'المبلغ': payment.amount,
            'المبلغ (منسق)': formatArabicCurrency(payment.amount),
            'تاريخ الاستحقاق': formatArabicDate(payment.paymentDate),
            'طريقة الدفع': normalizeArabicText(payment.paymentMethod),
            'حالة الدفع': TranslationService.translatePaymentStatus(payment.status),
            'ملاحظات الدفعة': normalizeArabicText(payment.notes),
            'اسم المستأجر': normalizeArabicText(payment.reservation?.user?.fullName),
            'رقم الوحدة': normalizeArabicText(payment.reservation?.unit?.unitNumber),
            'اسم المبنى': normalizeArabicText(payment.reservation?.unit?.building?.name),
            'نوع العقد': payment.reservation ?
                TranslationService.translateContractType(payment.reservation.contractType) : '',
            'جدولة الدفع': payment.reservation ?
                TranslationService.translatePaymentSchedule(payment.reservation.paymentSchedule) : '',
            'تاريخ بداية العقد': payment.reservation ?
                formatArabicDate(payment.reservation.startDate) : '',
            'تاريخ نهاية العقد': payment.reservation ?
                formatArabicDate(payment.reservation.endDate) : '',
            'تاريخ الإنشاء': formatArabicDate(payment.createdAt),
            'تاريخ التحديث': formatArabicDate(payment.updatedAt),
            'صورة الشيك متوفرة': payment.checkImageUrl ?
                TranslationService.translateCommon('yes') : TranslationService.translateCommon('no')
        }));

        const workbook = this.createWorksheet(data, 'المدفوعات');
        const filename = config.filename || generateFilename('payments', 'xlsx');
        this.saveWorkbook(workbook, filename);
    }

    static exportExpenses(expenses: Expense[], config: ExportConfig = {}): void {
        const data = expenses.map(expense => ({
            'رقم المصروف': expense.id,
            'رقم المبنى': expense.buildingId,
            'اسم المبنى': normalizeArabicText(expense.building?.name),
            'رقم الوحدة': expense.unitId || '',
            'رقم الوحدة النصي': normalizeArabicText(expense.unit?.unitNumber),
            'الطرف المسؤول': TranslationService.translateResponsibleParty(expense.responsibleParty),
            'نوع المصروف': TranslationService.translateExpenseType(expense.expenseType),
            'المبلغ': expense.amount,
            'المبلغ (منسق)': formatArabicCurrency(expense.amount),
            'تاريخ المصروف': formatArabicDate(expense.expenseDate),
            'الملاحظات': normalizeArabicText(expense.notes),
            'وصف المرفق': normalizeArabicText(expense.attachmentDescription),
            'تاريخ الإنشاء': formatArabicDate(expense.createdAt),
            'تاريخ التحديث': formatArabicDate(expense.updatedAt),
            'مرفق متوفر': expense.attachmentFileUrl ?
                TranslationService.translateCommon('yes') : TranslationService.translateCommon('no')
        }));

        const workbook = this.createWorksheet(data, 'المصاريف');
        const filename = config.filename || generateFilename('expenses', 'xlsx');
        this.saveWorkbook(workbook, filename);
    }
}

// ===================================
// ENHANCED PDF EXPORT SERVICE
// ===================================

class EnhancedPDFExportService {
    static async exportUsers(users: User[], config: ExportConfig = {}): Promise<void> {
        const totalUsers = users.length;
        const roleStats = users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const summaryInfo: SummaryInfo[] = [
            {
                label: 'إجمالي المستخدمين',
                value: totalUsers.toLocaleString('ar-SA'),
                icon: '👥',
                color: 'success'
            },
            {
                label: 'المدراء',
                value: (roleStats.admin || 0).toLocaleString('ar-SA'),
                icon: '👔',
                color: 'warning'
            },
            {
                label: 'المستأجرين',
                value: (roleStats.tenant || 0).toLocaleString('ar-SA'),
                icon: '🏠',
                color: 'primary'
            }
        ];

        const additionalStats: StatGroup[] = [
            {
                label: 'توزيع الأدوار',
                items: Object.entries(roleStats).map(([role, count]) => ({
                    key: TranslationService.translateRole(role as Role),
                    value: count.toLocaleString('ar-SA'),
                    percentage: calculatePercentage(count, totalUsers)
                })),
                type: 'grid'
            }
        ];

        const headers = ['الاسم الكامل', 'اسم المستخدم', 'البريد الإلكتروني', 'الهاتف', 'الدور', 'تاريخ التسجيل'];
        const rows = users.map(user => [
            user.fullName,
            user.username,
            user.email,
            user.phone || TranslationService.translateCommon('notSpecified'),
            TranslationService.translateRole(user.role),
            formatArabicDate(user.createdAt)
        ]);

        // await PuppeteerPDFService.exportToPDF(
        //     config.title || 'تقرير المستخدمين',
        //     headers,
        //     rows,
        //     summaryInfo,
        //     additionalStats,
        //     { ...config, headerColor: '#3498db' }
        // );
    }

    static async exportBuildings(buildings: Building[], config: ExportConfig = {}): Promise<void> {
        const totalBuildings = buildings.length;
        const totalUnits = buildings.reduce((sum, b) => sum + b.totalUnits, 0);
        const totalFloors = buildings.reduce((sum, b) => sum + b.totalFloors, 0);

        const typeStats = buildings.reduce((acc, building) => {
            acc[building.buildingType] = (acc[building.buildingType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const summaryInfo: SummaryInfo[] = [
            {
                label: 'إجمالي المباني',
                value: totalBuildings.toLocaleString('ar-SA'),
                icon: '🏢',
                color: 'success'
            },
            {
                label: 'إجمالي الوحدات',
                value: totalUnits.toLocaleString('ar-SA'),
                icon: '🏠',
                color: 'primary'
            },
            {
                label: 'إجمالي الطوابق',
                value: totalFloors.toLocaleString('ar-SA'),
                icon: '📊',
                color: 'warning'
            }
        ];

        const additionalStats: StatGroup[] = [
            {
                label: 'توزيع أنواع المباني',
                items: Object.entries(typeStats).map(([type, count]) => ({
                    key: TranslationService.translateBuildingType(type as BuildingType),
                    value: count.toLocaleString('ar-SA'),
                    percentage: calculatePercentage(count, totalBuildings)
                })),
                type: 'grid'
            }
        ];

        const headers = ['اسم المبنى', 'النوع', 'العنوان', 'الوحدات', 'الطوابق', 'الشركة'];
        const rows = buildings.map(building => [
            building.name,
            TranslationService.translateBuildingType(building.buildingType),
            building.address,
            building.totalUnits.toString(),
            building.totalFloors.toString(),
            building.company?.name || TranslationService.translateCommon('notSpecified')
        ]);

        // await PuppeteerPDFService.exportToPDF(
        //     config.title || 'تقرير المباني',
        //     headers,
        //     rows,
        //     summaryInfo,
        //     additionalStats,
        //     { ...config, headerColor: '#2ecc71' }
        // );
    }

    static async exportUnits(units: RealEstateUnit[], config: ExportConfig = {}): Promise<void> {
        const totalUnits = units.length;
        const statusStats = units.reduce((acc, unit) => {
            acc[unit.status] = (acc[unit.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const totalValue = units.reduce((sum, unit) => sum + unit.price, 0);
        const averagePrice = totalUnits > 0 ? totalValue / totalUnits : 0;

        const summaryInfo: SummaryInfo[] = [
            {
                label: 'إجمالي الوحدات',
                value: totalUnits.toLocaleString('ar-SA'),
                icon: '🏠',
                color: 'success'
            },
            {
                label: 'متوسط السعر',
                value: formatArabicCurrency(averagePrice),
                icon: '💰',
                color: 'warning'
            },
            {
                label: 'إجمالي القيمة',
                value: formatArabicCurrency(totalValue),
                icon: '📈',
                color: 'primary'
            }
        ];

        const additionalStats: StatGroup[] = [
            {
                label: 'توزيع حالات الوحدات',
                items: Object.entries(statusStats).map(([status, count]) => ({
                    key: TranslationService.translateUnitStatus(status as UnitStatus),
                    value: count.toLocaleString('ar-SA'),
                    percentage: calculatePercentage(count, totalUnits)
                })),
                type: 'grid'
            }
        ];

        const headers = ['رقم الوحدة', 'النوع', 'المبنى', 'الطابق', 'المساحة', 'السعر', 'الحالة'];
        const rows = units.map(unit => [
            unit.unitNumber,
            TranslationService.translateUnitType(unit.unitType),
            unit.building?.name || TranslationService.translateCommon('notSpecified'),
            unit.floor.toString(),
            `${unit.area} م²`,
            formatArabicCurrency(unit.price),
            TranslationService.translateUnitStatus(unit.status)
        ]);

        // await PuppeteerPDFService.exportToPDF(
        //     config.title || 'تقرير الوحدات',
        //     headers,
        //     rows,
        //     summaryInfo,
        //     additionalStats,
        //     { ...config, headerColor: '#9b59b6' }
        // );
    }

    static async exportCompanies(companies: Company[], config: ExportConfig = {}): Promise<void> {
        const totalCompanies = companies.length;
        const totalBuildings = companies.reduce((sum, c) => sum + (c.buildings?.length || 0), 0);
        const totalUnits = companies.reduce((sum, c) => sum + (c.buildings?.reduce((s, b) => s + b.totalUnits, 0) || 0), 0);

        const typeStats = companies.reduce((acc, company) => {
            acc[company.companyType] = (acc[company.companyType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const summaryInfo: SummaryInfo[] = [
            {
                label: 'إجمالي الشركات',
                value: totalCompanies.toLocaleString('ar-SA'),
                icon: '🏢',
                color: 'success'
            },
            {
                label: 'إجمالي المباني',
                value: totalBuildings.toLocaleString('ar-SA'),
                icon: '🏗️',
                color: 'primary'
            },
            {
                label: 'إجمالي الوحدات',
                value: totalUnits.toLocaleString('ar-SA'),
                icon: '🏠',
                color: 'warning'
            }
        ];

        const additionalStats: StatGroup[] = [
            {
                label: 'توزيع أنواع الشركات',
                items: Object.entries(typeStats).map(([type, count]) => ({
                    key: TranslationService.translateCompanyType(type as CompanyType),
                    value: count.toLocaleString('ar-SA'),
                    percentage: calculatePercentage(count, totalCompanies)
                })),
                type: 'grid'
            }
        ];

        const headers = ['اسم الشركة', 'النوع', 'البريد الإلكتروني', 'الهاتف', 'عدد المباني', 'إجمالي الوحدات'];
        const rows = companies.map(company => [
            company.name,
            TranslationService.translateCompanyType(company.companyType),
            company.email || TranslationService.translateCommon('notSpecified'),
            company.phone || TranslationService.translateCommon('notSpecified'),
            (company.buildings?.length || 0).toString(),
            (company.buildings?.reduce((sum, b) => sum + b.totalUnits, 0) || 0).toString()
        ]);

        // await PuppeteerPDFService.exportToPDF(
        //     config.title || 'تقرير الشركات',
        //     headers,
        //     rows,
        //     summaryInfo,
        //     additionalStats,
        //     { ...config, headerColor: '#e74c3c' }
        // );
    }

    static async exportReservations(reservations: Reservation[], config: ExportConfig = {}): Promise<void> {
        const totalReservations = reservations.length;
        const statusStats = reservations.reduce((acc, res) => {
            acc[res.status] = (acc[res.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const contractTypeStats = reservations.reduce((acc, res) => {
            acc[res.contractType] = (acc[res.contractType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const summaryInfo: SummaryInfo[] = [
            {
                label: 'إجمالي الحجوزات',
                value: totalReservations.toLocaleString('ar-SA'),
                icon: '📝',
                color: 'success'
            },
            {
                label: 'الحجوزات النشطة',
                value: (statusStats.active || 0).toLocaleString('ar-SA'),
                icon: '✅',
                color: 'primary'
            },
            {
                label: 'الحجوزات المنتهية',
                value: (statusStats.expired || 0).toLocaleString('ar-SA'),
                icon: '⏰',
                color: 'warning'
            }
        ];

        const additionalStats: StatGroup[] = [
            {
                label: 'توزيع حالات الحجوزات',
                items: Object.entries(statusStats).map(([status, count]) => ({
                    key: TranslationService.translateReservationStatus(status as ReservationStatus),
                    value: count.toLocaleString('ar-SA'),
                    percentage: calculatePercentage(count, totalReservations)
                })),
                type: 'grid'
            },
            {
                label: 'توزيع أنواع العقود',
                items: Object.entries(contractTypeStats).map(([type, count]) => ({
                    key: TranslationService.translateContractType(type as ContractType),
                    value: count.toLocaleString('ar-SA'),
                    percentage: calculatePercentage(count, totalReservations)
                })),
                type: 'grid'
            }
        ];

        const headers = ['رقم الحجز', 'المستأجر', 'الوحدة', 'نوع العقد', 'تاريخ البداية', 'تاريخ النهاية', 'الحالة'];
        const rows = reservations.map(reservation => [
            reservation.id.toString(),
            reservation.user?.fullName || TranslationService.translateCommon('notSpecified'),
            reservation.unit?.unitNumber || TranslationService.translateCommon('notSpecified'),
            TranslationService.translateContractType(reservation.contractType),
            formatArabicDate(reservation.startDate),
            formatArabicDate(reservation.endDate),
            TranslationService.translateReservationStatus(reservation.status)
        ]);

        // await PuppeteerPDFService.exportToPDF(
        //     config.title || 'تقرير الحجوزات',
        //     headers,
        //     rows,
        //     summaryInfo,
        //     additionalStats,
        //     { ...config, headerColor: '#f39c12' }
        // );
    }

    static async exportServiceOrders(serviceOrders: ServiceOrder[], config: ExportConfig = {}): Promise<void> {
        const totalOrders = serviceOrders.length;
        const statusStats = serviceOrders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const typeStats = serviceOrders.reduce((acc, order) => {
            acc[order.serviceType] = (acc[order.serviceType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const totalValue = serviceOrders.reduce((sum, order) => sum + (order.servicePrice || 0), 0);

        const summaryInfo: SummaryInfo[] = [
            {
                label: 'إجمالي الطلبات',
                value: totalOrders.toLocaleString('ar-SA'),
                icon: '🛠️',
                color: 'success'
            },
            {
                label: 'المكتملة',
                value: (statusStats.completed || 0).toLocaleString('ar-SA'),
                icon: '✅',
                color: 'primary'
            },
            {
                label: 'إجمالي القيمة',
                value: formatArabicCurrency(totalValue),
                icon: '💰',
                color: 'warning'
            }
        ];

        const additionalStats: StatGroup[] = [
            {
                label: 'توزيع حالات الطلبات',
                items: Object.entries(statusStats).map(([status, count]) => ({
                    key: TranslationService.translateServiceStatus(status as ServiceStatus),
                    value: count.toLocaleString('ar-SA'),
                    percentage: calculatePercentage(count, totalOrders)
                })),
                type: 'grid'
            },
            {
                label: 'توزيع أنواع الخدمات',
                items: Object.entries(typeStats).map(([type, count]) => ({
                    key: TranslationService.translateServiceType(type as ServiceType),
                    value: count.toLocaleString('ar-SA'),
                    percentage: calculatePercentage(count, totalOrders)
                })),
                type: 'grid'
            }
        ];

        const headers = ['رقم الطلب', 'نوع الخدمة', 'المستخدم', 'الوحدة', 'الحالة', 'السعر', 'التاريخ'];
        const rows = serviceOrders.map(order => [
            order.id.toString(),
            TranslationService.translateServiceType(order.serviceType),
            order.user?.fullName || TranslationService.translateCommon('notSpecified'),
            order.reservation?.unit?.unitNumber || TranslationService.translateCommon('notSpecified'),
            TranslationService.translateServiceStatus(order.status),
            order.servicePrice ? formatArabicCurrency(order.servicePrice) : TranslationService.translateCommon('notSpecified'),
            formatArabicDate(order.createdAt)
        ]);

        // await PuppeteerPDFService.exportToPDF(
        //     config.title || 'تقرير طلبات الخدمة',
        //     headers,
        //     rows,
        //     summaryInfo,
        //     additionalStats,
        //     { ...config, headerColor: '#1abc9c' }
        // );
    }

    static async exportPayments(payments: Payment[], config: ExportConfig = {}): Promise<void> {
        const totalPayments = payments.length;
        const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const averagePayment = totalPayments > 0 ? totalAmount / totalPayments : 0;

        const statusStats = payments.reduce((acc, payment) => {
            acc[payment.status] = (acc[payment.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const paidAmount = payments
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + p.amount, 0);

        const summaryInfo: SummaryInfo[] = [
            {
                label: 'إجمالي المدفوعات',
                value: totalPayments.toLocaleString('ar-SA'),
                icon: '💳',
                color: 'success'
            },
            {
                label: 'إجمالي المبلغ',
                value: formatArabicCurrency(totalAmount),
                icon: '💰',
                color: 'primary'
            },
            {
                label: 'المبلغ المدفوع',
                value: formatArabicCurrency(paidAmount),
                icon: '✅',
                color: 'warning'
            }
        ];

        const additionalStats: StatGroup[] = [
            {
                label: 'توزيع حالات المدفوعات',
                items: Object.entries(statusStats).map(([status, count]) => ({
                    key: TranslationService.translatePaymentStatus(status as PaymentStatus),
                    value: count.toLocaleString('ar-SA'),
                    percentage: calculatePercentage(count, totalPayments)
                })),
                type: 'grid'
            }
        ];

        const headers = ['رقم المدفوعة', 'المبلغ', 'التاريخ', 'الحالة', 'المستأجر', 'الوحدة', 'طريقة الدفع'];
        const rows = payments.map(payment => [
            payment.id.toString(),
            formatArabicCurrency(payment.amount),
            formatArabicDate(payment.paymentDate),
            TranslationService.translatePaymentStatus(payment.status),
            payment.reservation?.user?.fullName || TranslationService.translateCommon('notSpecified'),
            payment.reservation?.unit?.unitNumber || TranslationService.translateCommon('notSpecified'),
            payment.paymentMethod || TranslationService.translateCommon('notSpecified')
        ]);

        // await PuppeteerPDFService.exportToPDF(
        //     config.title || 'تقرير المدفوعات',
        //     headers,
        //     rows,
        //     summaryInfo,
        //     additionalStats,
        //     { ...config, headerColor: '#27ae60' }
        // );
    }

    static async exportExpenses(expenses: Expense[], config: ExportConfig = {}): Promise<void> {
        const totalExpenses = expenses.length;
        const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const averageExpense = totalExpenses > 0 ? totalAmount / totalExpenses : 0;

        const typeStats = expenses.reduce((acc, expense) => {
            acc[expense.expenseType] = (acc[expense.expenseType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const responsiblePartyStats = expenses.reduce((acc, expense) => {
            acc[expense.responsibleParty] = (acc[expense.responsibleParty] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const summaryInfo: SummaryInfo[] = [
            {
                label: 'إجمالي المصاريف',
                value: totalExpenses.toLocaleString('ar-SA'),
                icon: '📊',
                color: 'success'
            },
            {
                label: 'إجمالي المبلغ',
                value: formatArabicCurrency(totalAmount),
                icon: '💰',
                color: 'danger'
            },
            {
                label: 'متوسط المصروف',
                value: formatArabicCurrency(averageExpense),
                icon: '📈',
                color: 'warning'
            }
        ];

        const additionalStats: StatGroup[] = [
            {
                label: 'توزيع أنواع المصاريف',
                items: Object.entries(typeStats).map(([type, count]) => ({
                    key: TranslationService.translateExpenseType(type as ExpenseType),
                    value: count.toLocaleString('ar-SA'),
                    percentage: calculatePercentage(count, totalExpenses)
                })),
                type: 'grid'
            },
            {
                label: 'توزيع المسؤوليات',
                items: Object.entries(responsiblePartyStats).map(([party, count]) => ({
                    key: TranslationService.translateResponsibleParty(party as 'owner' | 'tenant'),
                    value: count.toLocaleString('ar-SA'),
                    percentage: calculatePercentage(count, totalExpenses)
                })),
                type: 'grid'
            }
        ];

        const headers = ['رقم المصروف', 'النوع', 'المبلغ', 'التاريخ', 'المسؤول', 'المبنى', 'الوحدة'];
        const rows = expenses.map(expense => [
            expense.id.toString(),
            TranslationService.translateExpenseType(expense.expenseType),
            formatArabicCurrency(expense.amount),
            formatArabicDate(expense.expenseDate),
            TranslationService.translateResponsibleParty(expense.responsibleParty),
            expense.building?.name || TranslationService.translateCommon('notSpecified'),
            expense.unit?.unitNumber || TranslationService.translateCommon('notSpecified')
        ]);

        // await PuppeteerPDFService.exportToPDF(
        //     config.title || 'تقرير المصاريف',
        //     headers,
        //     rows,
        //     summaryInfo,
        //     additionalStats,
        //     { ...config, headerColor: '#e67e22' }
        // );
    }
}

// ===================================
// MAIN EXPORT API
// ===================================

export class ExportManager {
    /**
     * Export data to Excel format
     */
    static exportToExcel<T>(
        data: T[],
        type: ExportableDataType,
        config: ExportConfig = {}
    ): void {
        try {
            switch (type) {
                case 'users':
                    ExcelExportService.exportUsers(data as User[], config);
                    break;
                case 'buildings':
                    ExcelExportService.exportBuildings(data as Building[], config);
                    break;
                case 'units':
                    ExcelExportService.exportUnits(data as RealEstateUnit[], config);
                    break;
                case 'companies':
                    ExcelExportService.exportCompanies(data as Company[], config);
                    break;
                case 'reservations':
                    ExcelExportService.exportReservations(data as Reservation[], config);
                    break;
                case 'serviceOrders':
                    ExcelExportService.exportServiceOrders(data as ServiceOrder[], config);
                    break;
                case 'payments':
                    ExcelExportService.exportPayments(data as Payment[], config);
                    break;
                case 'expenses':
                    ExcelExportService.exportExpenses(data as Expense[], config);
                    break;
                default:
                    throw new Error(`Unsupported export type: ${type}`);
            }
        } catch (error) {
            console.error(`Excel export failed for type ${type}:`, error);
            throw error;
        }
    }

    /**
     * Export data to PDF format using Puppeteer
     */
    static async exportToPDF<T>(
        data: T[],
        type: ExportableDataType,
        config: ExportConfig = {}
    ): Promise<void> {
        try {
            switch (type) {
                case 'users':
                    await EnhancedPDFExportService.exportUsers(data as User[], config);
                    break;
                case 'buildings':
                    await EnhancedPDFExportService.exportBuildings(data as Building[], config);
                    break;
                case 'units':
                    await EnhancedPDFExportService.exportUnits(data as RealEstateUnit[], config);
                    break;
                case 'companies':
                    await EnhancedPDFExportService.exportCompanies(data as Company[], config);
                    break;
                case 'reservations':
                    await EnhancedPDFExportService.exportReservations(data as Reservation[], config);
                    break;
                case 'serviceOrders':
                    await EnhancedPDFExportService.exportServiceOrders(data as ServiceOrder[], config);
                    break;
                case 'payments':
                    await EnhancedPDFExportService.exportPayments(data as Payment[], config);
                    break;
                case 'expenses':
                    await EnhancedPDFExportService.exportExpenses(data as Expense[], config);
                    break;
                default:
                    throw new Error(`Unsupported export type: ${type}`);
            }
        } catch (error) {
            console.error(`PDF export failed for type ${type}:`, error);
            throw error;
        }
    }

    /**
     * Cleanup resources
     */
    static async cleanup(): Promise<void> {
        //await PuppeteerPDFService.closeBrowser();
    }
}

// ===================================
// LEGACY COMPATIBILITY EXPORTS
// ===================================

// Export individual functions for backward compatibility
export const exportUsersToExcel = (users: User[], filename?: string) =>
    ExcelExportService.exportUsers(users, { filename });

export const exportBuildingsToExcel = (buildings: Building[], filename?: string) =>
    ExcelExportService.exportBuildings(buildings, { filename });

export const exportUnitsToExcel = (units: RealEstateUnit[], filename?: string) =>
    ExcelExportService.exportUnits(units, { filename });

export const exportCompaniesToExcel = (companies: Company[], filename?: string) =>
    ExcelExportService.exportCompanies(companies, { filename });

export const exportReservationsToExcel = (reservations: Reservation[], filename?: string) =>
    ExcelExportService.exportReservations(reservations, { filename });

export const exportServiceOrdersToExcel = (serviceOrders: ServiceOrder[], filename?: string) =>
    ExcelExportService.exportServiceOrders(serviceOrders, { filename });

export const exportPaymentsToExcel = (payments: Payment[], filename?: string) =>
    ExcelExportService.exportPayments(payments, { filename });

export const exportExpensesToExcel = (expenses: Expense[], filename?: string) =>
    ExcelExportService.exportExpenses(expenses, { filename });

export const exportUsersToPDF = (users: User[], filename?: string) =>
    EnhancedPDFExportService.exportUsers(users, { filename });

export const exportBuildingsToPDF = (buildings: Building[], filename?: string) =>
    EnhancedPDFExportService.exportBuildings(buildings, { filename });

export const exportUnitsToPDF = (units: RealEstateUnit[], filename?: string) =>
    EnhancedPDFExportService.exportUnits(units, { filename });

export const exportCompaniesToPDF = (companies: Company[], filename?: string) =>
    EnhancedPDFExportService.exportCompanies(companies, { filename });

export const exportReservationsToPDF = (reservations: Reservation[], filename?: string) =>
    EnhancedPDFExportService.exportReservations(reservations, { filename });

export const exportServiceOrdersToPDF = (serviceOrders: ServiceOrder[], filename?: string) =>
    EnhancedPDFExportService.exportServiceOrders(serviceOrders, { filename });

export const exportPaymentsToPDF = (payments: Payment[], filename?: string) =>
    EnhancedPDFExportService.exportPayments(payments, { filename });

export const exportExpensesToPDF = (expenses: Expense[], filename?: string) =>
    EnhancedPDFExportService.exportExpenses(expenses, { filename });

// Generic export functions
export const exportToExcel = <T>(
    data: T[],
    type: ExportableDataType,
    filename?: string
): void => ExportManager.exportToExcel(data, type, { filename });

export const exportToPDF = <T>(
    data: T[],
    type: ExportableDataType,
    filename?: string
): Promise<void> => ExportManager.exportToPDF(data, type, { filename });

// Re-export utility functions
export {
    formatArabicDate as formatDate,
    formatArabicCurrency as formatCurrency,
    TranslationService,
    // PuppeteerPDFService,
    HTMLTemplateGenerator
};