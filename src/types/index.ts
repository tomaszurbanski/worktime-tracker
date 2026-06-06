export type TrackingMode = 'manual' | 'auto';

export interface WorkSession {
  id: string;
  startTime: number;
  endTime?: number;
  mode: TrackingMode;
  commuteStartTime?: number;
  commuteEndTime?: number;
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
}

export interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  elapsed: number;
  isCommuting: boolean;
  commuteStartTime: number | null;
}
