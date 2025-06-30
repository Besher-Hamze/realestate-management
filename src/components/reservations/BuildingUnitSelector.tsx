import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Building, RealEstateUnit } from '@/lib/types';
import { buildingsApi, unitsApi } from '@/lib/api';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface BuildingUnitSelectorProps {
  onUnitSelected: (unitId: number) => void;
  preSelectedUnitId?: number;
}

export default function BuildingUnitSelector({
  onUnitSelected,
  preSelectedUnitId
}: BuildingUnitSelectorProps) {
  const router = useRouter();

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<RealEstateUnit[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(preSelectedUnitId || null);

  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  // Fetch buildings
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setIsLoadingBuildings(true);
        const response = await buildingsApi.getAll();

        if (response.success) {
          setBuildings(response.data);
        } else {
          toast.error(response.message || 'فشل في تحميل المباني');
        }
      } catch (error) {
        console.error('خطأ في جلب المباني:', error);
        toast.error('حدث خطأ أثناء تحميل المباني');
      } finally {
        setIsLoadingBuildings(false);
      }
    };

    fetchBuildings();
  }, []);

  // If preSelectedUnitId is provided, fetch its building info
  useEffect(() => {
    const getUnitBuildingInfo = async () => {
      if (preSelectedUnitId) {
        try {
          const unitResponse = await unitsApi.getById(preSelectedUnitId);
          if (unitResponse.success && unitResponse.data.buildingId) {
            setSelectedBuildingId(unitResponse.data.buildingId);
          }
        } catch (error) {
          console.error('خطأ في جلب معلومات الوحدة:', error);
        }
      }
    };

    getUnitBuildingInfo();
  }, [preSelectedUnitId]);

  // Fetch units for the selected building
  useEffect(() => {
    if (selectedBuildingId) {
      const fetchBuildingUnits = async () => {
        try {
          setIsLoadingUnits(true);
          // Use the available units endpoint with building filter
          const response = await unitsApi.getAvailable({ buildingId: selectedBuildingId });

          if (response.success) {
            setUnits(response.data);

            // If only one unit is available, auto-select it
            if (response.data.length === 1) {
              setSelectedUnitId(response.data[0].id);
            }
          } else {
            toast.error(response.message || 'فشل في تحميل الوحدات');
          }
        } catch (error) {
          console.error('خطأ في جلب الوحدات:', error);
          toast.error('حدث خطأ أثناء تحميل الوحدات');
        } finally {
          setIsLoadingUnits(false);
        }
      };

      fetchBuildingUnits();
    } else {
      // Reset units when no building is selected
      setUnits([]);
      setSelectedUnitId(null);
    }
  }, [selectedBuildingId]);

  // Handle building selection
  const handleBuildingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const buildingId = e.target.value ? parseInt(e.target.value, 10) : null;
    setSelectedBuildingId(buildingId);
    setSelectedUnitId(null); // Reset unit selection when building changes
  };

  // Handle unit selection
  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const unitId = e.target.value ? parseInt(e.target.value, 10) : null;
    setSelectedUnitId(unitId);
  };

  // Proceed with selected unit
  const handleProceed = () => {
    if (selectedUnitId) {
      onUnitSelected(selectedUnitId);
    } else {
      toast.error('يرجى اختيار وحدة للمتابعة');
    }
  };

  // Create building options for the dropdown
  const buildingOptions = buildings.map((building) => ({
    value: building.id,
    label: `${building.name} - ${building.buildingNumber} (${building.address})`,
  }));

  // Create unit options for the dropdown
  const unitOptions = units.map((unit) => ({
    value: unit.id,
    label: `${unit.unitNumber} - الطابق ${unit.floor} (${unit.area} م²)`,
  }));

  return (
    <Card>
      <div className="p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">اختيار الوحدة للحجز</h2>

        {/* Building Selection */}
        <div className="space-y-4">
          <Select
            label="المبنى"
            id="buildingId"
            name="buildingId"
            value={selectedBuildingId?.toString() || ''}
            onChange={handleBuildingChange}
            options={buildingOptions}
            disabled={isLoadingBuildings || !!preSelectedUnitId}
            required
            fullWidth
            helpText={isLoadingBuildings ? 'جاري تحميل المباني...' : 'اختر المبنى أولاً'}
            emptyOptionLabel="اختر المبنى"
          />

          {/* Unit Selection (only shown when building is selected) */}
          {selectedBuildingId && (
            <Select
              label="الوحدة"
              id="unitId"
              name="unitId"
              value={selectedUnitId?.toString() || ''}
              onChange={handleUnitChange}
              options={unitOptions}
              disabled={isLoadingUnits || !!preSelectedUnitId}
              required
              fullWidth
              helpText={
                isLoadingUnits
                  ? 'جاري تحميل الوحدات المتاحة...'
                  : units.length === 0
                    ? 'لا توجد وحدات متاحة في هذا المبنى'
                    : 'اختر الوحدة للحجز'
              }
              emptyOptionLabel="اختر الوحدة"
            />
          )}
        </div>

        {/* Unit details (when unit is selected) */}
        {selectedUnitId && units.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-md font-medium text-gray-900 mb-2">تفاصيل الوحدة المختارة</h3>
            {units.map(unit => {
              if (unit.id === selectedUnitId) {
                return (
                  <div key={unit.id} className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">رقم الوحدة</p>
                        <p className="text-gray-700">{unit.unitNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">الطابق</p>
                        <p className="text-gray-700">{unit.floor}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">رقم الموقف الداخلي</p>
                        <p className="text-gray-700">{unit.parkingNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">المساحة</p>
                        <p className="text-gray-700">{unit.area} م²</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">الحمامات</p>
                        <p className="text-gray-700">{unit.bathrooms}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">السعر</p>
                        <p className="text-gray-700">{unit.price} ريال</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">نوع الوحدة</p>
                        <p className="text-gray-700">{unit.unitType === 'apartment' ? 'شقة' :
                          unit.unitType === 'studio' ? 'ستوديو' :
                            unit.unitType === 'shop' ? 'محل تجاري' :
                              unit.unitType === 'office' ? 'مكتب' :
                                unit.unitType === 'villa' ? 'فيلا' : 'غرفة'
                        }</p>
                      </div>
                    </div>
                    {unit.description && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">الوصف</p>
                        <p className="text-gray-700">{unit.description}</p>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={handleProceed}
            disabled={!selectedUnitId || isLoadingUnits}
          >
            متابعة إلى تفاصيل الحجز
          </Button>
        </div>
      </div>
    </Card>
  );
}