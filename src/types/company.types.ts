import { Company } from '@/lib/types';

export interface CreateCompanyFormData {
  name: string;
  companyType: 'owner' | 'agency';
  email: string;
  phone: string;
  whatsappNumber?: string;
  secondaryPhone?: string;
  identityImageFront?: File;
  registrationNumber?: string;
  delegateName?: string;
  address: string;
  logoImage?: File;
  managerFullName?: string;
  managerEmail?: string;
  managerPhone?: string;
}

export interface UpdateCompanyFormData {
  name?: string;
  companyType?: 'owner' | 'agency';
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  secondaryPhone?: string;
  identityImageFront?: File;
  registrationNumber?: string;
  delegateName?: string;
  address?: string;
  logoImage?: File;
}

export interface CompanyDetailsProps {
  company: Company;
  onUpdate?: (id: number, data: UpdateCompanyFormData) => Promise<void>;
}

export interface CompanyFormProps {
  initialData?: Partial<CreateCompanyFormData>;
  onSubmit: (data: CreateCompanyFormData) => Promise<void>;
  isUpdate?: boolean;
}

export interface CompanyListItemProps {
  company: Company;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export interface CompanyListProps {
  companies: Company[];
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}