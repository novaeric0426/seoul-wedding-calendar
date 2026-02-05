import { memo, useMemo, useCallback } from 'react';
import type { Facility } from '../types';

interface HallFilterProps {
  facilities: Facility[];
  selectedFacilities: string[];
  onSelectFacilities: (facilityNumbers: string[]) => void;
}

export default memo(function HallFilter({
  facilities,
  selectedFacilities,
  onSelectFacilities
}: HallFilterProps) {
  // 구별로 예식장 그룹화
  const facilitiesByDistrict = useMemo(() => {
    const grouped = new Map<string, Facility[]>();

    facilities.forEach((facility) => {
      const existing = grouped.get(facility.district) || [];
      grouped.set(facility.district, [...existing, facility]);
    });

    return grouped;
  }, [facilities]);

  const handleToggleFacility = useCallback((facilityNumber: string) => {
    if (selectedFacilities.includes(facilityNumber)) {
      onSelectFacilities(selectedFacilities.filter(f => f !== facilityNumber));
    } else {
      onSelectFacilities([...selectedFacilities, facilityNumber]);
    }
  }, [selectedFacilities, onSelectFacilities]);

  const handleSelectAll = useCallback(() => {
    if (selectedFacilities.length === facilities.length) {
      onSelectFacilities([]);
    } else {
      onSelectFacilities(facilities.map(f => f.facility_number));
    }
  }, [selectedFacilities.length, facilities, onSelectFacilities]);

  const handleSelectDistrict = useCallback((district: string) => {
    const districtFacilities = facilitiesByDistrict.get(district) || [];
    const districtNumbers = districtFacilities.map(f => f.facility_number);

    const allSelected = districtNumbers.every(num => selectedFacilities.includes(num));

    if (allSelected) {
      // 해당 구의 예식장 모두 해제
      onSelectFacilities(selectedFacilities.filter(num => !districtNumbers.includes(num)));
    } else {
      // 해당 구의 예식장 모두 선택
      const newSelection = [...new Set([...selectedFacilities, ...districtNumbers])];
      onSelectFacilities(newSelection);
    }
  }, [facilitiesByDistrict, selectedFacilities, onSelectFacilities]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">예식장 필터</h3>
        <button
          onClick={handleSelectAll}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {selectedFacilities.length === facilities.length ? '전체 해제' : '전체 선택'}
        </button>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        선택됨: {selectedFacilities.length} / {facilities.length}
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Array.from(facilitiesByDistrict.entries()).map(([district, districtFacilities]) => (
            <div key={district} className="border-b border-gray-200 pb-3">
              <button
                onClick={() => handleSelectDistrict(district)}
                className="flex items-center justify-between w-full text-left mb-2"
              >
                <span className="font-semibold text-gray-800">{district}</span>
                <span className="text-xs text-gray-500">
                  {districtFacilities.length}개
                </span>
              </button>

              <div className="space-y-1 ml-4">
                {districtFacilities.map((facility) => (
                  <label
                    key={facility.facility_number}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFacilities.includes(facility.facility_number)}
                      onChange={() => handleToggleFacility(facility.facility_number)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{facility.facility_name}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

      </div>
    </div>
  );
});
