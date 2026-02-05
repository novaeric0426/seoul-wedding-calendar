import { memo, useCallback, useMemo } from 'react';
import { addMonths, startOfMonth, endOfMonth, format } from 'date-fns';

interface DateFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (start: Date | null, end: Date | null) => void;
}

export default memo(function DateFilter({
  startDate,
  endDate,
  onDateChange
}: DateFilterProps) {
  const quickSelections = useMemo(() => {
    const today = new Date();
    return [
      {
        label: '전체',
        getRange: () => ({ start: null, end: null })
      },
      {
        label: '이번 달',
        getRange: () => ({
          start: startOfMonth(today),
          end: endOfMonth(today)
        })
      },
      {
        label: '다음 달',
        getRange: () => ({
          start: startOfMonth(addMonths(today, 1)),
          end: endOfMonth(addMonths(today, 1))
        })
      },
      {
        label: '3개월',
        getRange: () => ({
          start: startOfMonth(today),
          end: endOfMonth(addMonths(today, 2))
        })
      },
      {
        label: '6개월',
        getRange: () => ({
          start: startOfMonth(today),
          end: endOfMonth(addMonths(today, 5))
        })
      }
    ];
  }, []);

  const handleQuickSelect = useCallback((getRange: () => { start: Date | null; end: Date | null }) => {
    const { start, end } = getRange();
    onDateChange(start, end);
  }, [onDateChange]);

  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      onDateChange(new Date(value), endDate);
    } else {
      onDateChange(null, endDate);
    }
  }, [onDateChange, endDate]);

  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      onDateChange(startDate, new Date(value));
    } else {
      onDateChange(startDate, null);
    }
  }, [onDateChange, startDate]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">날짜 필터</h3>

      {/* 빠른 선택 버튼 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickSelections.map((selection) => {
          const { start, end } = selection.getRange();
          const isActive =
            (start === null && startDate === null && end === null && endDate === null) ||
            (start?.getTime() === startDate?.getTime() && end?.getTime() === endDate?.getTime());

          return (
            <button
              key={selection.label}
              onClick={() => handleQuickSelect(selection.getRange)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {selection.label}
            </button>
          );
        })}
      </div>

      {/* 직접 날짜 선택 */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">시작일</label>
          <input
            type="date"
            value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
            onChange={handleStartDateChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">종료일</label>
          <input
            type="date"
            value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
            onChange={handleEndDateChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* 선택된 기간 표시 */}
      {(startDate || endDate) && (
        <div className="mt-4 p-2 bg-blue-50 rounded text-sm text-blue-800">
          {startDate && endDate
            ? `${format(startDate, 'yyyy.MM.dd')} ~ ${format(endDate, 'yyyy.MM.dd')}`
            : startDate
            ? `${format(startDate, 'yyyy.MM.dd')} ~`
            : `~ ${format(endDate!, 'yyyy.MM.dd')}`}
        </div>
      )}
    </div>
  );
});
