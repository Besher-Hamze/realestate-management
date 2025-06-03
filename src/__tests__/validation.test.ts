import { describe, it, expect } from '@jest/globals';
import * as yup from 'yup';
import { companySchema, buildingSchema, unitSchema, paymentSchema } from '@/lib/validations/schemas';

describe('Validation Schemas', () => {
  describe('Company Schema', () => {
    it('should validate a valid company', async () => {
      const validCompany = {
        name: 'شركة الأحلام العقارية',
        companyType: 'agency',
        email: 'info@dreams-realestate.com',
        phone: '+966501234567',
        address: 'الرياض، المملكة العربية السعودية',
        managerFullName: 'أحمد محمد',
        managerEmail: 'manager@dreams-realestate.com',
        managerPhone: '+966509876543',
      };

      const result = await companySchema.validate(validCompany, { context: { isCreating: true } });
      expect(result).toEqual(validCompany);
    });

  describe('Payment Schema', () => {
    it('should validate a valid cash payment', async () => {
      const validPayment = {
        reservationId: 1,
        amount: 2500.50,
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'cash',
        status: 'paid',
        notes: 'دفعة شهر يناير',
      };

      const result = await paymentSchema.validate(validPayment);
      expect(result).toEqual(validPayment);
    });

    it('should validate a valid check payment with all required fields', async () => {
      const validCheckPayment = {
        reservationId: 1,
        amount: 5000,
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'check',
        status: 'pending',
        checkNumber: 'CHK123456',
        bankName: 'Al Rajhi Bank',
        checkDate: new Date('2024-02-01'),
        dueDate: new Date('2024-02-01'),
        notes: 'شيك مؤجل الدفع',
      };

      const result = await paymentSchema.validate(validCheckPayment);
      expect(result).toEqual(validCheckPayment);
    });

    it('should validate a valid bank transfer', async () => {
      const validTransfer = {
        reservationId: 1,
        amount: 3000,
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'bank_transfer',
        status: 'paid',
        bankName: 'Riyad Bank',
        transferReference: 'TXN987654321',
        notes: 'تحويل من حساب العميل',
      };

      const result = await paymentSchema.validate(validTransfer);
      expect(result).toEqual(validTransfer);
    });

    it('should validate delayed payment with late fee', async () => {
      const delayedPayment = {
        reservationId: 1,
        amount: 2500,
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'cash',
        status: 'delayed',
        lateFee: 250,
        dueDate: new Date('2024-01-20'),
        notes: 'دفعة متأخرة مع رسوم',
      };

      const result = await paymentSchema.validate(delayedPayment);
      expect(result).toEqual(delayedPayment);
    });

    it('should reject payment with negative amount', async () => {
      const invalidPayment = {
        reservationId: 1,
        amount: -100, // Invalid negative amount
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'cash',
        status: 'paid',
      };

      await expect(paymentSchema.validate(invalidPayment))
        .rejects
        .toThrow('المبلغ يجب أن يكون أكبر من صفر');
    });

    it('should reject payment with future date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const invalidPayment = {
        reservationId: 1,
        amount: 1000,
        paymentDate: futureDate, // Future date
        paymentMethod: 'cash',
        status: 'paid',
      };

      await expect(paymentSchema.validate(invalidPayment))
        .rejects
        .toThrow('تاريخ الدفع لا يمكن أن يكون في المستقبل');
    });

    it('should require check number for check payments', async () => {
      const checkWithoutNumber = {
        reservationId: 1,
        amount: 1000,
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'check',
        status: 'pending',
        bankName: 'Al Rajhi Bank',
        checkDate: new Date('2024-02-01'),
        dueDate: new Date('2024-02-01'),
      };

      await expect(paymentSchema.validate(checkWithoutNumber))
        .rejects
        .toThrow('رقم الشيك مطلوب');
    });

    it('should require bank name for check and bank transfer', async () => {
      const transferWithoutBank = {
        reservationId: 1,
        amount: 1000,
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'bank_transfer',
        status: 'paid',
        transferReference: 'TXN123',
      };

      await expect(paymentSchema.validate(transferWithoutBank))
        .rejects
        .toThrow('اسم البنك مطلوب');
    });

    it('should require transfer reference for bank transfers', async () => {
      const transferWithoutReference = {
        reservationId: 1,
        amount: 1000,
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'bank_transfer',
        status: 'paid',
        bankName: 'Riyad Bank',
      };

      await expect(paymentSchema.validate(transferWithoutReference))
        .rejects
        .toThrow('رقم المرجع مطلوب');
    });

    it('should require due date for pending and delayed payments', async () => {
      const pendingWithoutDueDate = {
        reservationId: 1,
        amount: 1000,
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'cash',
        status: 'pending',
      };

      await expect(paymentSchema.validate(pendingWithoutDueDate))
        .rejects
        .toThrow('تاريخ الاستحقاق مطلوب');
    });

    it('should reject invalid payment status', async () => {
      const invalidStatus = {
        reservationId: 1,
        amount: 1000,
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'cash',
        status: 'invalid_status', // Invalid status
      };

      await expect(paymentSchema.validate(invalidStatus))
        .rejects
        .toThrow('حالة الدفع غير صالحة');
    });

    it('should reject invalid payment method', async () => {
      const invalidMethod = {
        reservationId: 1,
        amount: 1000,
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'invalid_method', // Invalid method
        status: 'paid',
      };

      await expect(paymentSchema.validate(invalidMethod))
        .rejects
        .toThrow('طريقة الدفع غير صالحة');
    });

    it('should allow null values for conditional fields when not required', async () => {
      const cashPayment = {
        reservationId: 1,
        amount: 1000,
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'cash',
        status: 'paid',
        checkNumber: null,
        bankName: null,
        transferReference: null,
        lateFee: null,
        dueDate: null,
      };

      const result = await paymentSchema.validate(cashPayment);
      expect(result.checkNumber).toBeNull();
      expect(result.bankName).toBeNull();
      expect(result.transferReference).toBeNull();
    });

    it('should validate excessive amount rejection', async () => {
      const excessiveAmount = {
        reservationId: 1,
        amount: 20000000, // Exceeds 10 million limit
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'cash',
        status: 'paid',
      };

      await expect(paymentSchema.validate(excessiveAmount))
        .rejects
        .toThrow('المبلغ كبير جداً');
    });

    it('should validate check date in future for check payments', async () => {
      const pastCheckDate = new Date();
      pastCheckDate.setDate(pastCheckDate.getDate() - 1);

      const invalidCheckDate = {
        reservationId: 1,
        amount: 1000,
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'check',
        status: 'pending',
        checkNumber: 'CHK123',
        bankName: 'Al Rajhi Bank',
        checkDate: pastCheckDate, // Past date
        dueDate: new Date('2024-02-01'),
      };

      await expect(paymentSchema.validate(invalidCheckDate))
        .rejects
        .toThrow('تاريخ الشيك يجب أن يكون في المستقبل أو اليوم');
    });
  });

    it('should reject invalid company name', async () => {
      const invalidCompany = {
        name: 'A', // Too short
        companyType: 'agency',
        email: 'invalid-email',
        phone: 'invalid-phone',
        address: 'Test Address',
      };

      await expect(companySchema.validate(invalidCompany))
        .rejects
        .toThrow('اسم الشركة يجب أن يكون حرفين على الأقل');
    });

    it('should reject invalid email', async () => {
      const invalidCompany = {
        name: 'Test Company',
        companyType: 'agency',
        email: 'invalid-email',
        phone: '+966501234567',
        address: 'Test Address',
      };

      await expect(companySchema.validate(invalidCompany))
        .rejects
        .toThrow('البريد الإلكتروني غير صالح');
    });

    it('should require manager fields when creating', async () => {
      const companyWithoutManager = {
        name: 'Test Company',
        companyType: 'agency',
        email: 'test@example.com',
        phone: '+966501234567',
        address: 'Test Address',
      };

      await expect(companySchema.validate(companyWithoutManager, { context: { isCreating: true } }))
        .rejects
        .toThrow('اسم المدير مطلوب');
    });
  });

  describe('Building Schema', () => {
    it('should validate a valid building', async () => {
      const validBuilding = {
        companyId: 1,
        buildingNumber: 'B001',
        name: 'برج الأحلام',
        address: 'شارع الملك فهد، الرياض',
        buildingType: 'residential',
        totalUnits: 50,
        totalFloors: 10,
        internalParkingSpaces: 25,
        description: 'مبنى سكني حديث مع جميع الخدمات',
      };

      const result = await buildingSchema.validate(validBuilding);
      expect(result).toEqual(validBuilding);
    });

    it('should reject invalid company ID', async () => {
      const invalidBuilding = {
        companyId: 0, // Invalid
        buildingNumber: 'B001',
        name: 'Test Building',
        address: 'Test Address',
        buildingType: 'residential',
        totalUnits: 10,
        totalFloors: 2,
      };

      await expect(buildingSchema.validate(invalidBuilding))
        .rejects
        .toThrow('يرجى اختيار شركة صالحة');
    });

    it('should reject excessive unit count', async () => {
      const invalidBuilding = {
        companyId: 1,
        buildingNumber: 'B001',
        name: 'Test Building',
        address: 'Test Address',
        buildingType: 'residential',
        totalUnits: 1001, // Exceeds maximum
        totalFloors: 2,
      };

      await expect(buildingSchema.validate(invalidBuilding))
        .rejects
        .toThrow('عدد الوحدات كبير جداً');
    });
  });

  describe('Unit Schema', () => {
    it('should validate a valid unit', async () => {
      const validUnit = {
        buildingId: 1,
        unitNumber: 'A101',
        unitType: 'apartment',
        unitLayout: '2bhk',
        floor: '1',
        area: 120.5,
        bathrooms: 2,
        price: 2500,
        status: 'available',
        description: 'شقة جميلة بإطلالة رائعة',
      };

      const result = await unitSchema.validate(validUnit);
      expect(result).toEqual(validUnit);
    });

    it('should allow null layout for non-apartment types', async () => {
      const validShop = {
        buildingId: 1,
        unitNumber: 'S001',
        unitType: 'shop',
        unitLayout: null,
        floor: 'G',
        area: 80,
        bathrooms: 1,
        price: 3000,
        status: 'available',
        description: 'محل تجاري في موقع ممتاز',
      };

      const result = await unitSchema.validate(validShop);
      expect(result).toEqual(validShop);
    });

    it('should reject invalid area', async () => {
      const invalidUnit = {
        buildingId: 1,
        unitNumber: 'A101',
        unitType: 'apartment',
        floor: '1',
        area: -10, // Invalid negative area
        bathrooms: 2,
        price: 2500,
        status: 'available',
      };

      await expect(unitSchema.validate(invalidUnit))
        .rejects
        .toThrow('المساحة يجب أن تكون أكبر من صفر');
    });

    it('should reject invalid status', async () => {
      const invalidUnit = {
        buildingId: 1,
        unitNumber: 'A101',
        unitType: 'apartment',
        floor: '1',
        area: 120,
        bathrooms: 2,
        price: 2500,
        status: 'invalid_status', // Invalid status
      };

      await expect(unitSchema.validate(invalidUnit))
        .rejects
        .toThrow('حالة الوحدة غير صالحة');
    });
  });
});
