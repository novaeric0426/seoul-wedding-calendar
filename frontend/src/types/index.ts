export interface Facility {
  facility_number: string;
  district: string;
  facility_name: string;
  location_type: string;
  capacity: string;
  price: string;
  url: string;
}

export interface Reservation {
  facility_number: string;
  reservation_date: string;
  time_slot: string;
  status: string;
}

export interface DataResponse {
  lastCrawledAt: string;
  facilities: Facility[];
  reservations: Reservation[];
}

export interface CalendarDay {
  date: Date;
  reservations: Reservation[];
  isCurrentMonth: boolean;
  isToday: boolean;
}
