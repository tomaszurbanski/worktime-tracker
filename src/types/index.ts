export type TrackingMode = 'manual' | 'auto';
export type SessionType = 'work' | 'delegation';

export interface DelegationInfo {
  destination: string;
  purpose?: string;
  location?: string;
  distance?: number;
  isTrip?: boolean;
}

export interface WorkSession {
  id: string;
  startTime: number;
  endTime?: number;
  mode: TrackingMode;
  type: SessionType;
  delegationId?: string;
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
  userFullName?: string;
  companyName?: string;
  notificationsEnabled: boolean;
  workReminderTime?: string;  // "HH:MM" — daily reminder time, undefined = disabled
}

export interface TimerState {
  isWorking: boolean;
  workStart: number | null;
  workElapsed: number;
  isDelegating: boolean;
  delegationStart: number | null;
  delegationElapsed: number;
  isCommuting: boolean;
  commuteStart: number | null;
}
