import { Building, BuildingType } from '@/lib/types';

export interface CreateBuildingFormData {
  companyId: number;
  buildingNumber: string;
  name: string;
  address: string;
  buildingType: BuildingType;
  totalUnits: number;
  totalFloors: number;
  internalParkingSpaces: number;
  description: string;
}

export interface UpdateBuildingFormData {
  buildingNumber?: string;
  name?: string;
  address?: string;
  buildingType?: BuildingType;
  totalUnits?: number;
  totalFloors?: number;
  internalParkingSpaces?: number;
  description?: string;
}

export interface BuildingDetailsProps {
  building: Building;
  onUpdate?: (id: number, data: UpdateBuildingFormData) => Promise<void>;
}

export interface BuildingFormProps {
  initialData?: Partial<CreateBuildingFormData>;
  onSubmit: (data: CreateBuildingFormData) => Promise<void>;
  isUpdate?: boolean;
  companyOptions?: Array<{value: number, label: string}>;
}

export interface BuildingListItemProps {
  building: Building;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export interface BuildingListProps {
  buildings: Building[];
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export interface BuildingFilterProps {
  buildingType?: BuildingType;
  companyId?: number;
  onFilterChange: (filters: { 
    buildingType?: BuildingType,
    companyId?: number
  }) => void;
}