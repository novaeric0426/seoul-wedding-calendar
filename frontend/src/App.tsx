import { useState, useEffect, useCallback } from 'react';
import { addMonths, subMonths, format } from 'date-fns';
import Calendar from './components/Calendar';
import HallFilter from './components/HallFilter';
import DateFilter from './components/DateFilter';
import ReservationModal from './components/ReservationModal';
import { fetchData } from './api';
import type { Facility, Reservation } from './types';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [lastCrawledAt, setLastCrawledAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  // 날짜 범위 필터 상태
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDateReservations, setSelectedDateReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchData();

      setFacilities(data.facilities);
      setReservations(data.reservations);
      setLastCrawledAt(data.lastCrawledAt);

      // 기본적으로 모든 예식장 선택
      setSelectedFacilities(data.facilities.map(f => f.facility_number));
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = useCallback(() => {
    setCurrentDate(prev => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(prev => addMonths(prev, 1));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleDateClick = useCallback((date: Date, dayReservations: Reservation[]) => {
    setSelectedDate(date);
    setSelectedDateReservations(dayReservations);
    setModalOpen(true);
  }, []);

  const handleDateRangeChange = useCallback((start: Date | null, end: Date | null) => {
    setDateRange({ start, end });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                서울시 공공예식장 예약 캘린더
              </h1>
              {lastCrawledAt && (
                <p className="text-sm text-gray-600 mt-1">
                  마지막 업데이트: {format(new Date(lastCrawledAt), 'yyyy년 MM월 dd일 HH:mm')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                disabled={loading}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="데이터 새로고침"
              >
                <svg
                  className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="lg:hidden px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                필터 {showFilter ? '닫기' : '열기'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 사이드바 - 필터 */}
          <aside className={`lg:col-span-1 space-y-4 ${showFilter ? 'block' : 'hidden lg:block'}`}>
            {/* 날짜 필터 */}
            <DateFilter
              startDate={dateRange.start}
              endDate={dateRange.end}
              onDateChange={handleDateRangeChange}
            />

            {/* 예식장 필터 */}
            <HallFilter
              facilities={facilities}
              selectedFacilities={selectedFacilities}
              onSelectFacilities={setSelectedFacilities}
            />

            {/* 통계 정보 */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">통계</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">전체 예식장</span>
                  <span className="font-semibold">{facilities.length}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">전체 예약</span>
                  <span className="font-semibold">{reservations.length}건</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">선택된 예식장</span>
                  <span className="font-semibold">{selectedFacilities.length}개</span>
                </div>
              </div>
            </div>
          </aside>

          {/* 캘린더 영역 */}
          <div className="lg:col-span-3">
            {/* 캘린더 헤더 */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePreviousMonth}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ← 이전 달
                </button>

                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {format(currentDate, 'yyyy년 M월')}
                  </h2>
                  <button
                    onClick={handleToday}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    오늘
                  </button>
                </div>

                <button
                  onClick={handleNextMonth}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  다음 달 →
                </button>
              </div>
            </div>

            {/* 캘린더 */}
            <div className="bg-white rounded-lg shadow p-4">
              <Calendar
                currentDate={currentDate}
                reservations={reservations}
                facilities={facilities}
                selectedFacilities={selectedFacilities}
                dateRange={dateRange}
                onDateClick={handleDateClick}
              />
            </div>

            {/* 범례 */}
            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">범례</h3>
              <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">N</span>
                  <span>예약 완료 건수</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">N</span>
                  <span>예약 가능 건수</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1.5 bg-red-400 rounded"></div>
                  <span>예약완료 예식장</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1.5 bg-green-400 rounded"></div>
                  <span>예약가능 예식장</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 ring-2 ring-blue-500 rounded"></div>
                  <span>오늘</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                날짜를 클릭하면 상세 예약 정보를 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="mt-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-600">
            서울시 공공예식장 예약 정보는 서울시 공공서비스 예약 시스템에서 제공됩니다.
          </p>
        </div>
      </footer>

      {/* 예약 상세 모달 */}
      <ReservationModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        date={selectedDate}
        reservations={selectedDateReservations}
        facilities={facilities}
      />
    </div>
  );
}

export default App;
