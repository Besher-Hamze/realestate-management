import { 
  RealEstateUnit, 
  UnitType, 
  UnitLayout, 
  UnitStatus 
} from '@/lib/types';

export interface CreateUnitFormData {
  buildingId: number;
  unitNumber: string;
  unitType: UnitType;
  unitLayout?: UnitLayout;
  floor: string;
  area: number;
  bathrooms: number;
  price: number;
  status: UnitStatus;
  description: string;
}

export interface UpdateUnitFormData {
  unitNumber?: string;
  unitType?: UnitType;
  unitLayout?: UnitLayout;
  floor?: string;
  area?: number;
  bathrooms?: number;
  price?: number;
  status?: UnitStatus;
  description?: string;
}

export interface UnitFilterParams {
  minPrice?: number;
  maxPrice?: number;
  bathrooms?: number;
  buildingId?: number;
  companyId?: number;
  unitType?: UnitType;
  unitLayout?: UnitLayout;
  status?: UnitStatus;
}

export interface UnitDetailsProps {
  unit: RealEstateUnit;
  onUpdate?: (id: number, data: UpdateUnitFormData) => Promise<void>;
}

export interface UnitFormProps {
  initialData?: Partial<CreateUnitFormData>;
  onSubmit: (data: CreateUnitFormData) => Promise<void>;
  isUpdate?: boolean;
}

export interface UnitListItemProps {
  unit: RealEstateUnit;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export interface UnitListProps {
  units: RealEstateUnit[];
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export interface UnitFilterProps {
  initialFilters?: UnitFilterParams;
  onFilterChange: (filters: UnitFilterParams) => void;
}