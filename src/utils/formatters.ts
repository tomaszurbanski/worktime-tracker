export const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const formatDelegationDuration = (ms: number): { main: string; sub: string } => {
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayMs = Math.min(ms, Date.now() - todayStart);
  const todayMin = Math.floor(todayMs / 60000);
  const todayH = Math.floor(todayMin / 60);
  const todayM = todayMin % 60;

  const dayLabel = days === 1 ? '1 dzień' : days > 1 ? `${days} dni` : '';
  const main = days > 0
    ? `${dayLabel}  ${hours}h ${String(minutes).padStart(2, '0')}m`
    : `${hours}h ${String(minutes).padStart(2, '0')}m`;

  const sub = `Dziś: ${todayH}h ${String(todayM).padStart(2, '0')}m`;
  return { main, sub };
};

export const formatShortDuration = (ms: number): string => {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('pl-PL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getSessionDuration = (startTime: number, endTime?: number): number => {
  return (endTime ?? Date.now()) - startTime;
};

export const groupSessionsByDate = <T extends { startTime: number }>(
  sessions: T[]
): Record<string, T[]> => {
  return sessions.reduce((acc, session) => {
    const date = new Date(session.startTime).toLocaleDateString('pl-PL');
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {} as Record<string, T[]>);
};

export const getMonthName = (month: number): string => {
  const names = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
    'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
  return names[month] ?? '';
};

export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};
