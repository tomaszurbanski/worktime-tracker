import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { WorkSession, AppSettings } from '../types';
import { formatDateFull, formatTime, formatShortDuration, getSessionDuration } from './formatters';

const commuteDuration = (s: WorkSession): number => {
  if (!s.commuteStartTime) return 0;
  return getSessionDuration(s.commuteStartTime, s.commuteEndTime);
};

const sessionRow = (s: WorkSession, cls: string, label: string, indent = false): string => {
  const total = getSessionDuration(s.startTime, s.endTime);
  const commute = commuteDuration(s);
  const netWork = commute > 0 ? total - commute : 0;
  const timeRange = `${formatTime(s.startTime)} &ndash; ${s.endTime ? formatTime(s.endTime) : 'trwa'}`;
  const indentStyle = indent ? 'padding-left:24px' : '';

  let html = `
    <tr class="${cls}">
      <td class="session-type" style="${indentStyle}">${label}</td>
      <td>${timeRange}</td>
      <td>${commute > 0 ? formatShortDuration(commute) : ''}</td>
      <td style="text-align:right;font-weight:700">${formatShortDuration(total)}</td>
    </tr>`;

  if (commute > 0) {
    const commuteRange = s.commuteStartTime
      ? `${formatTime(s.commuteStartTime)} &ndash; ${s.commuteEndTime ? formatTime(s.commuteEndTime) : 'trwa'}`
      : '';
    html += `
    <tr class="commute-sub-row">
      <td style="padding-left:${indent ? 36 : 20}px;color:#0369A1">&#128663; Dojazd</td>
      <td style="color:#0369A1;font-size:10px">${commuteRange}</td>
      <td style="color:#0369A1;font-weight:600">${formatShortDuration(commute)}</td>
      <td style="text-align:right;color:#0369A1;font-weight:600">${formatShortDuration(commute)}</td>
    </tr>
    <tr class="commute-sub-row">
      <td style="padding-left:${indent ? 36 : 20}px;color:#16A34A">&#9679; Na miejscu</td>
      <td style="color:#16A34A;font-size:10px"></td>
      <td></td>
      <td style="text-align:right;color:#16A34A;font-weight:600">${formatShortDuration(netWork)}</td>
    </tr>`;
  }

  return html;
};

const buildHtml = (sessions: WorkSession[], rangeLabel: string, settings: AppSettings): string => {
  const byDay: Record<string, WorkSession[]> = {};
  sessions.forEach(s => {
    const key = new Date(s.startTime).toLocaleDateString('pl-PL');
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(s);
  });

  const totalMs = sessions.reduce((sum, s) => sum + getSessionDuration(s.startTime, s.endTime), 0);
  const totalCommuteMs = sessions.reduce((sum, s) => sum + commuteDuration(s), 0);
  const netWorkMs = totalMs - totalCommuteMs;
  const workSessions = sessions.filter(s => !s.delegation?.isTrip);
  const delegationTrips = sessions.filter(s => s.delegation?.isTrip);

  let rows = '';
  Object.entries(byDay)
    .sort(([a], [b]) => new Date(b.split('.').reverse().join('-')).getTime() - new Date(a.split('.').reverse().join('-')).getTime())
    .forEach(([, daySessions]) => {
      const dayDate = formatDateFull(daySessions[0].startTime);
      const dayTotal = daySessions.reduce((sum, s) => sum + getSessionDuration(s.startTime, s.endTime), 0);
      const dayCommute = daySessions.reduce((sum, s) => sum + commuteDuration(s), 0);
      const daySubtitle = dayCommute > 0
        ? ` &nbsp;<span style="font-size:10px;font-weight:500;color:#1E40AF">(praca: ${formatShortDuration(dayTotal - dayCommute)}, dojazd: ${formatShortDuration(dayCommute)})</span>`
        : '';

      rows += `
        <tr class="day-row">
          <td colspan="3" class="day-header">${dayDate}${daySubtitle}</td>
          <td class="day-total">${formatShortDuration(dayTotal)}</td>
        </tr>`;

      const trips = daySessions.filter(s => s.delegation?.isTrip);
      const linkedWork = daySessions.filter(s => s.delegationId);
      const regularWork = daySessions.filter(s => !s.delegationId && !s.delegation?.isTrip);

      trips.forEach(trip => {
        rows += sessionRow(trip, 'delegation-trip-row', '&#9992; DELEGACJA');
        linkedWork.filter(w => w.delegationId === trip.id).forEach(w => {
          rows += sessionRow(w, 'delegation-work-row', '&#8627; Praca', true);
        });
      });

      regularWork.forEach(s => {
        rows += sessionRow(s, 'work-row', 'Praca');
      });
    });

  const userName = settings.userFullName || 'Pracownik';
  const company = settings.companyName || '';
  const generatedDate = new Date().toLocaleDateString('pl-PL');
  const generatedFull = new Date().toLocaleString('pl-PL');
  const hasCommute = totalCommuteMs > 0;

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
    .summary-grid { display: flex; gap: 10px; }
    .summary-box { flex: 1; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; text-align: center; }
    .summary-box .val { font-size: 20px; font-weight: 700; color: #2563EB; }
    .summary-box .val-commute { color: #0369A1; }
    .summary-box .val-net { color: #16A34A; }
    .summary-box .lbl { font-size: 10px; color: #64748B; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .commute-note { background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 6px; padding: 8px 12px; margin-top: 10px; font-size: 11px; color: #0369A1; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #F1F5F9; font-size: 10px; font-weight: 700; color: #64748B; letter-spacing: 0.5px; text-transform: uppercase; padding: 8px 10px; text-align: left; border-bottom: 2px solid #CBD5E1; }
    th:last-child { text-align: right; }
    td { padding: 7px 10px; border-bottom: 1px solid #F1F5F9; vertical-align: middle; }
    .day-row td { background: #EFF6FF; border-bottom: 1px solid #BFDBFE; border-top: 1px solid #BFDBFE; }
    .day-header { font-size: 12px; color: #1E40AF; font-weight: 700; text-transform: capitalize; }
    .day-total { color: #1E40AF; font-size: 12px; font-weight: 700; text-align: right; }
    .delegation-trip-row td { background: #FAF5FF; color: #7C3AED; }
    .delegation-work-row td { background: #FEFBFF; color: #4C1D95; }
    .commute-sub-row td { background: #F8FFFE; border-bottom: 1px solid #E0F2FE; font-size: 10px; }
    .work-row td { }
    .session-type { font-weight: 600; width: 110px; }
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
      <div><div class="info-label">Pracownik</div><div class="info-value">${userName}</div></div>
      ${company ? `<div><div class="info-label">Firma</div><div class="info-value">${company}</div></div>` : ''}
      <div><div class="info-label">Okres</div><div class="info-value">${rangeLabel}</div></div>
      <div><div class="info-label">Wygenerowano</div><div class="info-value">${generatedDate}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Podsumowanie</div>
    <div class="summary-grid">
      <div class="summary-box">
        <div class="val">${formatShortDuration(totalMs)}</div>
        <div class="lbl">Łącznie</div>
      </div>
      ${hasCommute ? `
      <div class="summary-box">
        <div class="val val-net">${formatShortDuration(netWorkMs)}</div>
        <div class="lbl">Praca (netto)</div>
      </div>
      <div class="summary-box">
        <div class="val val-commute">${formatShortDuration(totalCommuteMs)}</div>
        <div class="lbl">Dojazd</div>
      </div>` : `
      <div class="summary-box">
        <div class="val">${workSessions.length}</div>
        <div class="lbl">Sesje pracy</div>
      </div>`}
      <div class="summary-box">
        <div class="val">${delegationTrips.length}</div>
        <div class="lbl">Delegacje</div>
      </div>
    </div>
    ${hasCommute ? `<div class="commute-note">&#8505; Raport zawiera czas dojazdu — wykazany osobno jako inna stawka rozliczeniowa.</div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">Szczegółowe wpisy</div>
    <table>
      <thead>
        <tr>
          <th>Typ</th>
          <th>Godziny</th>
          <th>Dojazd</th>
          <th>Czas</th>
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
