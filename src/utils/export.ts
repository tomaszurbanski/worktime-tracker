import { Share } from 'react-native';
import { WorkSession } from '../types';
import { formatDate, formatTime, formatShortDuration, getSessionDuration } from './formatters';

const escapeCSV = (val: string | number | undefined): string => {
  if (val === undefined || val === null) return '';
  const str = String(val);
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str;
};

export const exportToCSV = async (
  sessions: WorkSession[],
  rangeLabel: string
): Promise<void> => {
  const headers = ['Data', 'Typ', 'Start', 'Koniec', 'Czas', 'Cel delegacji', 'Lokalizacja', 'Notatka'];

  const rows = sessions.map(s => [
    formatDate(s.startTime),
    s.type === 'delegation' ? 'Delegacja' : 'Praca',
    formatTime(s.startTime),
    s.endTime ? formatTime(s.endTime) : '',
    formatShortDuration(getSessionDuration(s.startTime, s.endTime)),
    s.delegation?.destination ?? '',
    s.delegation?.location ?? '',
    s.note ?? '',
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(escapeCSV).join(','))
    .join('\n');

  const totalMs = sessions.reduce((sum, s) => sum + getSessionDuration(s.startTime, s.endTime), 0);
  const summary = `Raport: ${rangeLabel}\nŁączny czas: ${formatShortDuration(totalMs)}\nLiczba wpisów: ${sessions.length}\n\n${csv}`;

  await Share.share({
    message: summary,
    title: `Raport czasu pracy – ${rangeLabel}`,
  });
};
