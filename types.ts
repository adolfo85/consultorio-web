
export enum ViewState {
  LANDING = 'LANDING',
  BOOKING = 'BOOKING',
  ADMIN = 'ADMIN'
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description: string;
  image?: string; 
  doctor?: string; 
}

export interface Appointment {
  id: string;
  serviceId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string; // ISO Date string YYYY-MM-DD
  time: string; // HH:mm
  endTime: string; // HH:mm
  status: 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

export interface DaySchedule {
  date: string;
  slots: string[];
}

export interface WorkDayConfig {
  enabled: boolean;
  start: string; // "09:00"
  end: string;   // "18:00"
}

export interface WorkSchedule {
  [key: number]: WorkDayConfig; // 0 (Sun) to 6 (Sat)
}

export interface DoctorConfig {
    schedule: WorkSchedule;
    blockedDates: string[];
}

export interface DoctorConfigMap {
    [doctorName: string]: DoctorConfig;
}

export interface FAQ {
    id: string;
    question: string;
    answer: string;
}