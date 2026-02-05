import { memo, useMemo, useCallback } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  parseISO,
  isWithinInterval,
  isBefore,
  isAfter
} from 'date-fns';
import type { Reservation, Facility } from '../types';

interface CalendarProps {
  currentDate: Date;
  reservations: Reservation[];
  facilities: Facility[];
  selectedFacilities: string[];
  dateRange: { start: Date | null; end: Date | null };
  onDateClick: (date: Date, reservations: Reservation[]) => void;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-red-400',
  available: 'bg-green-400',
  pending: 'bg-yellow-400',
};

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export default memo(function Calendar({
  currentDate,
  reservations,
  facilities,
  selectedFacilities,
  dateRange,
  onDateClick
}: CalendarProps) {
  // 캘린더에 표시할 날짜들 계산
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // 선택된 예식장 Set (빠른 조회용)
  const selectedFacilitiesSet = useMemo(
    () => new Set(selectedFacilities),
    [selectedFacilities]
  );

  // 날짜별 예약 데이터 인덱싱 (핵심 최적화)
  // 기존: 42개 셀마다 전체 reservations 필터링 → O(42 * N)
  // 개선: 한 번만 순회하여 Map 생성 → O(N) + O(1) 조회
  const reservationsByDate = useMemo(() => {
    const map = new Map<string, Reservation[]>();

    reservations.forEach((reservation) => {
      // 선택된 예식장 필터링
      if (selectedFacilitiesSet.size > 0 && !selectedFacilitiesSet.has(reservation.facility_number)) {
        return;
      }

      const dateKey = format(parseISO(reservation.reservation_date), 'yyyy-MM-dd');
      const existing = map.get(dateKey);
      if (existing) {
        existing.push(reservation);
      } else {
        map.set(dateKey, [reservation]);
      }
    });

    return map;
  }, [reservations, selectedFacilitiesSet]);

  // 날짜가 필터 범위 내에 있는지 확인
  const isDateInRange = useCallback((date: Date) => {
    if (!dateRange.start && !dateRange.end) return true;
    if (dateRange.start && dateRange.end) {
      return isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
    }
    if (dateRange.start) return !isBefore(date, dateRange.start);
    if (dateRange.end) return !isAfter(date, dateRange.end);
    return true;
  }, [dateRange.start, dateRange.end]);

  // 특정 날짜의 예약 데이터 가져오기 (O(1) 조회)
  const getReservationsForDay = useCallback((date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return reservationsByDate.get(dateString) || [];
  }, [reservationsByDate]);

  // 예식장별로 예약 그룹화
  const groupReservationsByFacility = useCallback((dayReservations: Reservation[]) => {
    const grouped = new Map<string, Reservation[]>();

    dayReservations.forEach((reservation) => {
      const existing = grouped.get(reservation.facility_number);
      if (existing) {
        existing.push(reservation);
      } else {
        grouped.set(reservation.facility_number, [reservation]);
      }
    });

    return grouped;
  }, []);

  // 예식장 빠른 조회용 Map (O(1) 조회)
  const facilityMap = useMemo(() => {
    const map = new Map<string, Facility>();
    facilities.forEach(f => map.set(f.facility_number, f));
    return map;
  }, [facilities]);

  return (
    <div className="w-full">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEK_DAYS.map((day, index) => (
          <div
            key={day}
            className={`text-center font-semibold py-2 text-sm ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const dayReservations = getReservationsForDay(day);
          const isCurrentMonthDay = isSameMonth(day, currentDate);
          const isTodayDay = isToday(day);
          const groupedReservations = groupReservationsByFacility(dayReservations);
          const inRange = isDateInRange(day);
          const hasReservations = dayReservations.length > 0;

          // 예약 상태별 카운트
          const confirmedCount = dayReservations.filter(r => r.status === 'confirmed').length;
          const availableCount = dayReservations.filter(r => r.status === 'available').length;

          return (
            <div
              key={day.toString()}
              onClick={() => onDateClick(day, dayReservations)}
              className={`
                min-h-[100px] border rounded-lg p-2 transition-all cursor-pointer
                ${isCurrentMonthDay ? 'bg-white' : 'bg-gray-50'}
                ${isTodayDay ? 'ring-2 ring-blue-500' : 'border-gray-200'}
                ${!inRange ? 'opacity-40' : 'hover:shadow-md hover:border-blue-300'}
                ${hasReservations && inRange ? 'hover:bg-blue-50' : ''}
              `}
            >
              {/* 날짜 */}
              <div className={`text-sm font-semibold mb-1 ${
                !isCurrentMonthDay ? 'text-gray-400' :
                isTodayDay ? 'text-blue-600' :
                'text-gray-900'
              }`}>
                {format(day, 'd')}
              </div>

              {/* 예약 상태 요약 (상태별 색상) */}
              {hasReservations && (
                <div className="flex gap-1 mb-1">
                  {confirmedCount > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      {confirmedCount}
                    </span>
                  )}
                  {availableCount > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      {availableCount}
                    </span>
                  )}
                </div>
              )}

              {/* 예약 상태 표시 */}
              <div className="space-y-1">
                {Array.from(groupedReservations.entries()).slice(0, 3).map(([facilityNumber, reservations]) => {
                  const facility = facilityMap.get(facilityNumber);
                  // 예약 상태에 따른 색상 (confirmed: 빨강, available: 초록)
                  const hasConfirmed = reservations.some(r => r.status === 'confirmed');
                  const statusColor = hasConfirmed ? STATUS_COLORS['confirmed'] : STATUS_COLORS['available'];

                  return (
                    <div
                      key={facilityNumber}
                      className="group relative"
                    >
                      <div className={`h-1.5 rounded ${statusColor}`} />

                      {/* 툴팁 */}
                      <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg pointer-events-none">
                        <div className="font-semibold">{facility?.facility_name}</div>
                        <div className="text-gray-300">
                          {reservations.map(r => r.time_slot).join(', ')} 시간대
                        </div>
                        <div className="text-gray-300">
                          {hasConfirmed ? '예약완료' : '예약가능'}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 더 많은 예약이 있을 경우 */}
                {groupedReservations.size > 3 && (
                  <div className="text-xs text-gray-500 mt-1">
                    +{groupedReservations.size - 3} 더보기
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
