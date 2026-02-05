import { memo, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import type { Reservation, Facility } from '../types';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  reservations: Reservation[];
  facilities: Facility[];
}

const TIME_SLOT_LABELS: Record<string, string> = {
  'L': '첫번째 타임',
  'D': '두번째 타임',
  'A': '첫번째 타임',
  'B': '두번째 타임',
};

const STATUS_LABELS: Record<string, { text: string; color: string; bg: string }> = {
  'confirmed': { text: '예약완료', color: 'text-red-700', bg: 'bg-red-100' },
  'available': { text: '예약가능', color: 'text-green-700', bg: 'bg-green-100' },
  'pending': { text: '대기중', color: 'text-yellow-700', bg: 'bg-yellow-100' },
};

export default memo(function ReservationModal({
  isOpen,
  onClose,
  date,
  reservations,
  facilities
}: ReservationModalProps) {
  // 예식장 빠른 조회용 Map
  const facilityMap = useMemo(() => {
    const map = new Map<string, Facility>();
    facilities.forEach(f => map.set(f.facility_number, f));
    return map;
  }, [facilities]);

  // 예식장별로 예약 그룹화
  const reservationsByFacility = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    reservations.forEach((reservation) => {
      const existing = map.get(reservation.facility_number);
      if (existing) {
        existing.push(reservation);
      } else {
        map.set(reservation.facility_number, [reservation]);
      }
    });
    return map;
  }, [reservations]);

  const getFacility = useCallback((facilityNumber: string) => {
    return facilityMap.get(facilityNumber);
  }, [facilityMap]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
          {/* 헤더 */}
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {format(date, 'yyyy년 M월 d일')} 예약 현황
              </h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-blue-100 text-sm mt-1">
              총 {reservationsByFacility.size}개 예식장, {reservations.length}건
            </p>
          </div>

          {/* 예약 목록 */}
          <div className="overflow-y-auto max-h-[60vh] p-4">
            {reservationsByFacility.size === 0 ? (
              <div className="text-center py-8 text-gray-500">
                이 날짜에 예약 정보가 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {Array.from(reservationsByFacility.entries()).map(([facilityNumber, facilityReservations]) => {
                  const facility = getFacility(facilityNumber);
                  if (!facility) return null;

                  return (
                    <div
                      key={facilityNumber}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* 예식장 정보 */}
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {facility.facility_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {facility.district} · {facility.location_type} · {facility.capacity}
                            </p>
                          </div>
                          {facility.price && (
                            <span className="text-sm font-medium text-blue-600">
                              {facility.price}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 시간대별 예약 상태 */}
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-2">
                          {[...facilityReservations]
                            .sort((a, b) => {
                              const order: Record<string, number> = { 'L': 0, 'A': 0, 'D': 1, 'B': 1 };
                              return (order[a.time_slot] ?? 2) - (order[b.time_slot] ?? 2);
                            })
                            .map((reservation) => {
                            const statusInfo = STATUS_LABELS[reservation.status] || STATUS_LABELS['pending'];
                            const timeLabel = TIME_SLOT_LABELS[reservation.time_slot] || reservation.time_slot;

                            return (
                              <div
                                key={`${reservation.facility_number}-${reservation.time_slot}`}
                                className={`px-3 py-2 rounded-lg ${statusInfo.bg}`}
                              >
                                <div className="text-sm font-medium text-gray-900">
                                  {timeLabel}
                                </div>
                                <div className={`text-xs font-semibold ${statusInfo.color}`}>
                                  {statusInfo.text}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* 예식장 링크 */}
                        <a
                          href={facility.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          예약 페이지 바로가기 →
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
