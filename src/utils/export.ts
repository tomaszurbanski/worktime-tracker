import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { WorkSession } from '../types';
import { formatDate, formatTime, formatShortDuration, getSessionDuration } from './formatters';

const escapeCSV = (val: string | number | undefined): string => {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportToCSV = async (sessions: WorkSession[], filename: string): Promise<void> => {
  const headers = [
    'Data', 'Typ', 'Tryb', 'Start', 'Koniec', 'Czas pracy',
    'Dojazd start', 'Dojazd koniec', 'Cel delegacji', 'Lokalizacja', 'Notatka'
  ];

  const rows = sessions.map(s => [
    formatDate(s.startTime),
    s.type === 'delegation' ? 'Delegacja' : 'Praca',
    s.mode === 'auto' ? 'GPS auto' : 'Ręczny',
    formatTime(s.startTime),
    s.endTime ? formatTime(s.endTime) : '',
    formatShortDuration(getSessionDuration(s.startTime, s.endTime)),
    s.commuteStartTime ? formatTime(s.commuteStartTime) : '',
    s.commuteEndTime ? formatTime(s.commuteEndTime) : '',
    s.delegation?.destination ?? '',
    s.delegation?.location ?? '',
    s.note ?? '',
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(escapeCSV).join(','))
    .join('\n');

  const path = `${FileSystem.cacheDirectory}${filename}.csv`;
  await FileSystem.writeAsStringAsync(path, '﻿' + csv, { encoding: FileSystem.EncodingType.UTF8 });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(path, {
      mimeType: 'text/csv',
      dialogTitle: 'Eksportuj raport',
      UTI: 'public.comma-separated-values-text',
    });
  }
};

const buildHTMLReport = (sessions: WorkSession[], title: string, totalMs: number): string => {
  const totalHours = (totalMs / 3600000).toFixed(1);
  const workSessions = sessions.filter(s => s.type !== 'delegation');
  const delegations = sessions.filter(s => s.type === 'delegation');

  const rows = sessions.map(s => `
    <tr>
      <td>${formatDate(s.startTime)}</td>
      <td><span class="${s.type === 'delegation' ? 'badge-del' : 'badge-work'}">${s.type === 'delegation' ? 'Delegacja' : 'Praca'}</span></td>
      <td>${formatTime(s.startTime)}</td>
      <td>${s.endTime ? formatTime(s.endTime) : '—'}</td>
      <td><strong>${formatShortDuration(getSessionDuration(s.startTime, s.endTime))}</strong></td>
      <td>${s.delegation?.destination ?? s.delegation?.location ?? '—'}</td>
      <td>${s.note ?? '—'}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; padding: 24px; color: #1e293b; }
  h1 { color: #2563eb; margin-bottom: 4px; }
  .subtitle { color: #64748b; margin-bottom: 24px; }
  .summary { display: flex; gap: 24px; margin-bottom: 24px; }
  .card { background: #f1f5f9; border-radius: 8px; padding: 16px 24px; text-align: center; }
  .card-value { font-size: 28px; font-weight: 700; color: #2563eb; }
  .card-label { font-size: 12px; color: #64748b; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #2563eb; color: white; padding: 10px 12px; text-align: left; font-size: 12px; }
  td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
  tr:nth-child(even) { background: #f8fafc; }
  .badge-work { background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 10px; font-size: 11px; }
  .badge-del { background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 10px; font-size: 11px; }
  .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
  <h1>Raport czasu pracy</h1>
  <div class="subtitle">${title} • Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}</div>
  <div class="summary">
    <div class="card"><div class="card-value">${totalHours}h</div><div class="card-label">Łączny czas pracy</div></div>
    <div class="card"><div class="card-value">${workSessions.length}</div><div class="card-label">Dni pracy</div></div>
    <div class="card"><div class="card-value">${delegations.length}</div><div class="card-label">Delegacje</div></div>
  </div>
  <table>
    <thead><tr><th>Data</th><th>Typ</th><th>Start</th><th>Koniec</th><th>Czas</th><th>Cel / Lokalizacja</th><th>Notatka</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">WorkTime Tracker • raport automatyczny</div>
</body>
</html>`;
};

export const exportToPDF = async (sessions: WorkSession[], title: string, totalMs: number): Promise<void> => {
  const html = buildHTMLReport(sessions, title, totalMs);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const dest = `${FileSystem.cacheDirectory}raport_${Date.now()}.pdf`;
  await FileSystem.moveAsync({ from: uri, to: dest });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(dest, {
      mimeType: 'application/pdf',
      dialogTitle: 'Eksportuj raport PDF',
      UTI: 'com.adobe.pdf',
    });
  }
};
