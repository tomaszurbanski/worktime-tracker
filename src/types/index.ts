export type TrackingMode = 'manual' | 'auto';
export type SessionType = 'work' | 'delegation';

export interface DelegationInfo {
  destination: string;
  purpose: string;
  location?: string;
  distance?: number;
}

export interface WorkSession {
  id: string;
  startTime: number;
  endTime?: number;
  mode: TrackingMode;
  type: SessionType;
  commuteStartTime?: number;
  commuteEndTime?: number;
  delegation?: DelegationInfo;
  note?: string;
}

export interface WorkLocation {
  latitude: number;
  longitude: number;
  radius: number;
  name: string;
}

export interface AppSettings {
  mode: TrackingMode;
  workLocation?: WorkLocation;
  commuteTracking: boolean;
  showAds: boolean;
  userFullName?: string;
  companyName?: string;
}

export interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  elapsed: number;
  isCommuting: boolean;
  commuteStartTime: number | null;
}

export interface MonthStats {
  year: number;
  month: number;
  totalMs: number;
  workDays: number;
  delegationCount: number;
  sessions: WorkSession[];
}

export interface WeekStats {
  weekStart: number;
  totalMs: number;
  days: Record<string, number>;
}
