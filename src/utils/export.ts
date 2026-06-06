import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { WorkSession, AppSettings } from '../types';
import { formatDateFull, formatTime, formatShortDuration, getSessionDuration } from './formatters';

const buildHtml = (sessions: WorkSession[], rangeLabel: string, settings: AppSettings): string => {
  const byDay: Record<string, WorkSession[]> = {};
  sessions.forEach(s => {
    const key = new Date(s.startTime).toLocaleDateString('pl-PL');
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(s);
  });

  const totalMs = sessions.reduce((sum, s) => sum + getSessionDuration(s.startTime, s.endTime), 0);
  const workSessions = sessions.filter(s => !s.delegation?.isTrip);
  const delegationTrips = sessions.filter(s => s.delegation?.isTrip);

  let rows = '';
  Object.entries(byDay)
    .sort(([a], [b]) => new Date(b.split('.').reverse().join('-')).getTime() - new Date(a.split('.').reverse().join('-')).getTime())
    .forEach(([, daySessions]) => {
      const dayDate = formatDateFull(daySessions[0].startTime);
      const dayTotal = daySessions.reduce((sum, s) => sum + getSessionDuration(s.startTime, s.endTime), 0);
      rows += `
        <tr class="day-row">
          <td colspan="3" class="day-header">${dayDate}</td>
          <td class="day-total">${formatShortDuration(dayTotal)}</td>
        </tr>`;

      const trips = daySessions.filter(s => s.delegation?.isTrip);
      const linkedWork = daySessions.filter(s => s.delegationId);
      const regularWork = daySessions.filter(s => !s.delegationId && !s.delegation?.isTrip);

      trips.forEach(trip => {
        rows += `
          <tr class="delegation-trip-row">
            <td class="session-type">&#9992; DELEGACJA</td>
            <td>${formatTime(trip.startTime)} &ndash; ${trip.endTime ? formatTime(trip.endTime) : 'trwa'}</td>
            <td></td>
            <td>${formatShortDuration(getSessionDuration(trip.startTime, trip.endTime))}</td>
          </tr>`;
        linkedWork.filter(w => w.delegationId === trip.id).forEach(w => {
          rows += `
            <tr class="delegation-work-row">
              <td class="session-type indent">&#8627; Praca</td>
              <td>${formatTime(w.startTime)} &ndash; ${w.endTime ? formatTime(w.endTime) : 'trwa'}</td>
              <td>${w.commuteStartTime ? '&#128663; Dojazd' : ''}</td>
              <td>${formatShortDuration(getSessionDuration(w.startTime, w.endTime))}</td>
            </tr>`;
        });
      });

      regularWork.forEach(s => {
        rows += `
          <tr class="work-row">
            <td class="session-type">Praca</td>
            <td>${formatTime(s.startTime)} &ndash; ${s.endTime ? formatTime(s.endTime) : 'trwa'}</td>
            <td>${s.commuteStartTime ? '&#128663; Dojazd' : ''}</td>
            <td>${formatShortDuration(getSessionDuration(s.startTime, s.endTime))}</td>
          </tr>`;
      });
    });

  const userName = settings.userFullName || 'Pracownik';
  const company = settings.companyName || '';
  const generatedDate = new Date().toLocaleDateString('pl-PL');
  const generatedFull = new Date().toLocaleString('pl-PL');

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1E293B; font-size: 12px; }
    .header { background: #2563EB; color: white; padding: 24px 32px; margin-bottom: 24px; }
    .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .header .subtitle { font-size: 14px; opacity: 0.85; }
    .section { padding: 0 32px; margin-bottom: 20px; }
    .section-title { font-size: 10px; font-weight: 700; color: #64748B; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px; border-bottom: 2px solid #E2E8F0; padding-bottom: 4px; }
    .info-grid { display: flex; gap: 24px; flex-wrap: wrap; }
    .info-label { font-size: 10px; color: #64748B; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 14px; font-weight: 600; }
    .summary-grid { display: flex; gap: 12px; }
    .summary-box { flex: 1; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; text-align: center; }
    .summary-box .val { font-size: 22px; font-weight: 700; color: #2563EB; }
    .summary-box .lbl { font-size: 10px; color: #64748B; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #F1F5F9; font-size: 10px; font-weight: 700; color: #64748B; letter-spacing: 0.5px; text-transform: uppercase; padding: 8px 10px; text-align: left; border-bottom: 2px solid #CBD5E1; }
    td { padding: 7px 10px; border-bottom: 1px solid #F1F5F9; vertical-align: middle; }
    .day-row td { background: #EFF6FF; border-bottom: 1px solid #BFDBFE; border-top: 1px solid #BFDBFE; }
    .day-header { font-size: 12px; color: #1E40AF; font-weight: 700; text-transform: capitalize; }
    .day-total { color: #1E40AF; font-size: 12px; font-weight: 700; text-align: right; }
    .delegation-trip-row td { background: #FAF5FF; color: #7C3AED; }
    .delegation-work-row td { background: #FEFBFF; color: #4C1D95; }
    .indent { padding-left: 24px !important; }
    .session-type { font-weight: 600; width: 120px; }
    td:last-child { text-align: right; font-weight: 600; }
    .footer { padding: 16px 32px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 10px; color: #94A3B8; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Raport czasu pracy</h1>
    <div class="subtitle">${userName}${company ? ' &middot; ' + company : ''}</div>
  </div>

  <div class="section">
    <div class="info-grid">
      <div>
        <div class="info-label">Pracownik</div>
        <div class="info-value">${userName}</div>
      </div>
      ${company ? `<div><div class="info-label">Firma</div><div class="info-value">${company}</div></div>` : ''}
      <div>
        <div class="info-label">Okres</div>
        <div class="info-value">${rangeLabel}</div>
      </div>
      <div>
        <div class="info-label">Wygenerowano</div>
        <div class="info-value">${generatedDate}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Podsumowanie</div>
    <div class="summary-grid">
      <div class="summary-box">
        <div class="val">${formatShortDuration(totalMs)}</div>
        <div class="lbl">Łącznie</div>
      </div>
      <div class="summary-box">
        <div class="val">${workSessions.length}</div>
        <div class="lbl">Sesje pracy</div>
      </div>
      <div class="summary-box">
        <div class="val">${delegationTrips.length}</div>
        <div class="lbl">Delegacje</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Szczegółowe wpisy</div>
    <table>
      <thead>
        <tr>
          <th>Typ</th>
          <th>Godziny</th>
          <th>Info</th>
          <th style="text-align:right">Czas</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div class="footer">Raport wygenerowany przez WorkTime Tracker &middot; ${generatedFull}</div>
</body>
</html>`;
};

export const exportToPDF = async (sessions: WorkSession[], rangeLabel: string, settings: AppSettings): Promise<void> => {
  const html = buildHtml(sessions, rangeLabel, settings);
  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Eksportuj raport PDF',
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ html });
  }
};
