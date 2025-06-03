#!/usr/bin/env node
/**
 * Migration Script for Enhanced Validation System
 * This script helps migrate from the old validation system to the new Yup-based system
 */

const fs = require('fs');
const path = require('path');

class ValidationMigrator {
  constructor() {
    this.migratedFiles = [];
    this.errors = [];
  }

  /**
   * Main migration function
   */
  migrate() {
    console.log('🚀 Starting validation system migration...\n');

    try {
      // 1. Install required packages
      this.installPackages();

      // 2. Update existing form pages
      this.updateFormPages();

      // 3. Generate summary report
      this.generateReport();

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Install required npm packages
   */
  installPackages() {
    console.log('📦 Installing required packages...');
    
    const { execSync } = require('child_process');
    
    try {
      execSync('npm install react-hook-form @hookform/resolvers yup', { stdio: 'inherit' });
      execSync('npm install -D @types/yup', { stdio: 'inherit' });
      console.log('✅ Packages installed successfully\n');
    } catch (error) {
      console.error('❌ Failed to install packages:', error.message);
      throw error;
    }
  }

  /**
   * Update existing form pages to use new validation
   */
  updateFormPages() {
    console.log('📝 Updating form pages...\n');

    const updates = [
      {
        description: 'Company create page',
        path: 'src/app/dashboard/companies/create/page.tsx',
        content: this.getCompanyCreatePageContent()
      },
      {
        description: 'Building create page', 
        path: 'src/app/dashboard/buildings/create/page.tsx',
        content: this.getBuildingCreatePageContent()
      },
      {
        description: 'Unit create page',
        path: 'src/app/dashboard/units/create/page.tsx', 
        content: this.getUnitCreatePageContent()
      },
      {
        description: 'Payment create page',
        path: 'src/app/dashboard/payments/create/page.tsx',
        content: this.getPaymentCreatePageContent()
      }
    ];

    updates.forEach(update => {
      try {
        this.updateFile(update.path, update.content);
        console.log(`✅ Updated: ${update.description}`);
        this.migratedFiles.push(update.path);
      } catch (error) {
        console.error(`❌ Failed to update ${update.description}:`, error.message);
        this.errors.push({ file: update.path, error: error.message });
      }
    });

    console.log('');
  }

  /**
   * Update a single file with new content
   */
  updateFile(filePath, content) {
    const fullPath = path.resolve(process.cwd(), filePath);
    const dir = path.dirname(fullPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(fullPath, content, 'utf8');
  }

  /**
   * Generate migration report
   */
  generateReport() {
    console.log('📊 Migration Report');
    console.log('==================\n');

    console.log(`✅ Successfully migrated files: ${this.migratedFiles.length}`);
    this.migratedFiles.forEach(file => {
      console.log(`   - ${file}`);
    });

    if (this.errors.length > 0) {
      console.log(`\n❌ Failed migrations: ${this.errors.length}`);
      this.errors.forEach(error => {
        console.log(`   - ${error.file}: ${error.error}`);
      });
    }

    console.log('\n🎉 Migration completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Review the migrated files');
    console.log('2. Test the new forms'); 
    console.log('3. Update any custom validation logic');
    console.log('4. Consider removing old validation files');
  }

  // Content generators for each page type
  getCompanyCreatePageContent() {
    return `'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import CompanyFormYup from '@/components/companies/CompanyFormYup';
import { Company } from '@/lib/types';

export default function CreateCompanyPage() {
  const router = useRouter();

  const handleSuccess = (company: Company) => {
    router.push(\`/dashboard/companies/\${company.id}\`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">إضافة شركة جديدة</h1>
        <p className="mt-2 text-sm text-gray-600">
          قم بملء النموذج أدناه لإضافة شركة جديدة إلى النظام
        </p>
      </div>

      <Suspense fallback={<div>جاري التحميل...</div>}>
        <CompanyFormYup onSuccess={handleSuccess} />
      </Suspense>
    </div>
  );
}`;
  }

  getBuildingCreatePageContent() {
    return `'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import BuildingFormYup from '@/components/buildings/BuildingFormYup';
import { Building } from '@/lib/types';

export default function CreateBuildingPage() {
  const router = useRouter();

  const handleSuccess = (building: Building) => {
    router.push(\`/dashboard/buildings/\${building.id}\`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">إضافة مبنى جديد</h1>
        <p className="mt-2 text-sm text-gray-600">
          قم بملء النموذج أدناه لإضافة مبنى جديد إلى النظام
        </p>
      </div>

      <Suspense fallback={<div>جاري التحميل...</div>}>
        <BuildingFormYup onSuccess={handleSuccess} />
      </Suspense>
    </div>
  );
}`;
  }

  getUnitCreatePageContent() {
    return `'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import UnitFormYup from '@/components/units/UnitFormYup';
import { RealEstateUnit } from '@/lib/types';

export default function CreateUnitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buildingId = searchParams.get('buildingId');

  const handleSuccess = (unit: RealEstateUnit) => {
    router.push(\`/dashboard/units/\${unit.id}\`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">إضافة وحدة جديدة</h1>
        <p className="mt-2 text-sm text-gray-600">
          قم بملء النموذج أدناه لإضافة وحدة جديدة إلى النظام
        </p>
      </div>

      <Suspense fallback={<div>جاري التحميل...</div>}>
        <UnitFormYup 
          preSelectedBuildingId={buildingId ? Number(buildingId) : undefined}
          onSuccess={handleSuccess} 
        />
      </Suspense>
    </div>
  );
}`;
  getPaymentCreatePageContent() {
    return `'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PaymentFormYup from '@/components/payments/PaymentFormYup';
import { Payment } from '@/lib/types';

export default function CreatePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('reservationId');

  const handleSuccess = (payment: Payment) => {
    router.push(\`/dashboard/payments/\${payment.id}\`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">إضافة دفعة جديدة</h1>
        <p className="mt-2 text-sm text-gray-600">
          قم بملء النموذج أدناه لتسجيل دفعة جديدة
        </p>
      </div>

      <Suspense fallback={<div>جاري التحميل...</div>}>
        <PaymentFormYup 
          preSelectedReservationId={reservationId ? Number(reservationId) : undefined}
          onSuccess={handleSuccess} 
        />
      </Suspense>
    </div>
  );
}\`;
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  const migrator = new ValidationMigrator();
  migrator.migrate();
}

module.exports = ValidationMigrator;
