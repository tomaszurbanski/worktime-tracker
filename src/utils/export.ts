import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { WorkSession, AppSettings } from '../types';
import { formatDateFull, formatTime, formatShortDuration, getSessionDuration } from './formatters';
import i18n from '../i18n';

const p = (key: string) => i18n.t(`pdf.${key}`);

const commuteDuration = (s: WorkSession): number => {
  if (!s.commuteStartTime) return 0;
  return getSessionDuration(s.commuteStartTime, s.commuteEndTime);
};

const sessionRow = (s: WorkSession, cls: string, label: string, indent = false): string => {
  const total = getSessionDuration(s.startTime, s.endTime);
  const commute = commuteDuration(s);
  const netWork = commute > 0 ? total - commute : 0;
  const timeRange = `${formatTime(s.startTime)} &ndash; ${s.endTime ? formatTime(s.endTime) : p('ongoing')}`;
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
      ? `${formatTime(s.commuteStartTime)} &ndash; ${s.commuteEndTime ? formatTime(s.commuteEndTime) : p('ongoing')}`
      : '';
    html += `
    <tr class="commute-sub-row">
      <td style="padding-left:${indent ? 36 : 20}px;color:#0369A1">&#128663; ${p('commute')}</td>
      <td style="color:#0369A1;font-size:10px">${commuteRange}</td>
      <td style="color:#0369A1;font-weight:600">${formatShortDuration(commute)}</td>
      <td style="text-align:right;color:#0369A1;font-weight:600">${formatShortDuration(commute)}</td>
    </tr>
    <tr class="commute-sub-row">
      <td style="padding-left:${indent ? 36 : 20}px;color:#15803D">&#9679; ${p('onSite')}</td>
      <td style="color:#15803D;font-size:10px"></td>
      <td></td>
      <td style="text-align:right;color:#15803D;font-weight:600">${formatShortDuration(netWork)}</td>
    </tr>`;
  }

  return html;
};

const buildHtml = (sessions: WorkSession[], rangeLabel: string, settings: AppSettings): string => {
  const lang = i18n.language;

  const byDay: Record<string, WorkSession[]> = {};
  sessions.forEach(s => {
    const key = new Date(s.startTime).toISOString().split('T')[0];
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
    .sort(([a], [b]) => b.localeCompare(a))
    .forEach(([, daySessions]) => {
      const dayDate = formatDateFull(daySessions[0].startTime);
      const dayTotal = daySessions.reduce((sum, s) => sum + getSessionDuration(s.startTime, s.endTime), 0);
      const dayCommute = daySessions.reduce((sum, s) => sum + commuteDuration(s), 0);
      const daySubtitle = dayCommute > 0
        ? ` &nbsp;<span style="font-size:10px;font-weight:500;color:#1E40AF">(${p('work').toLowerCase()}: ${formatShortDuration(dayTotal - dayCommute)}, ${p('commute').toLowerCase()}: ${formatShortDuration(dayCommute)})</span>`
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
        rows += sessionRow(trip, 'delegation-trip-row', `&#9992; ${p('delegation')}`);
        linkedWork.filter(w => w.delegationId === trip.id).forEach(w => {
          rows += sessionRow(w, 'delegation-work-row', `&#8627; ${p('work')}`, true);
        });
      });

      regularWork.forEach(s => {
        rows += sessionRow(s, 'work-row', p('work'));
      });
    });

  const userName = settings.userFullName || p('employee');
  const company = settings.companyName || '';
  const generatedDate = new Date().toLocaleDateString(lang);
  const generatedFull = new Date().toLocaleString(lang);
  const hasCommute = totalCommuteMs > 0;

  return `<!DOCTYPE html>
<html lang="${lang}">
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
    .summary-box .val-net { color: #15803D; }
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
    .session-type { font-weight: 600; width: 110px; }
    .footer { padding: 16px 32px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 10px; color: #94A3B8; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${p('title')}</h1>
    <div class="subtitle">${userName}${company ? ' &middot; ' + company : ''}</div>
  </div>

  <div class="section">
    <div class="info-grid">
      <div><div class="info-label">${p('employee')}</div><div class="info-value">${userName}</div></div>
      ${company ? `<div><div class="info-label">${p('company')}</div><div class="info-value">${company}</div></div>` : ''}
      <div><div class="info-label">${p('period')}</div><div class="info-value">${rangeLabel}</div></div>
      <div><div class="info-label">${p('generated')}</div><div class="info-value">${generatedDate}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${p('summary')}</div>
    <div class="summary-grid">
      <div class="summary-box">
        <div class="val">${formatShortDuration(totalMs)}</div>
        <div class="lbl">${p('total')}</div>
      </div>
      ${hasCommute ? `
      <div class="summary-box">
        <div class="val val-net">${formatShortDuration(netWorkMs)}</div>
        <div class="lbl">${p('netWork')}</div>
      </div>
      <div class="summary-box">
        <div class="val val-commute">${formatShortDuration(totalCommuteMs)}</div>
        <div class="lbl">${p('commute')}</div>
      </div>` : `
      <div class="summary-box">
        <div class="val">${workSessions.length}</div>
        <div class="lbl">${p('workSessions')}</div>
      </div>`}
      <div class="summary-box">
        <div class="val">${delegationTrips.length}</div>
        <div class="lbl">${p('delegations')}</div>
      </div>
    </div>
    ${hasCommute ? `<div class="commute-note">&#8505; ${p('commuteNote')}</div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">${p('details')}</div>
    <table>
      <thead>
        <tr>
          <th>${p('type')}</th>
          <th>${p('hours')}</th>
          <th>${p('commute')}</th>
          <th>${p('time')}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div class="footer">${p('footer')} &middot; ${generatedFull}</div>
</body>
</html>`;
};

export const exportToCSV = async (sessions: WorkSession[], rangeLabel: string, settings: AppSettings): Promise<void> => {
  const lang = i18n.language;
  const userName = settings.userFullName || '';
  const company = settings.companyName || '';

  const escapeCSV = (val: string | number | undefined): string => {
    if (val === undefined || val === null) return '';
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const header = ['Date', 'Start', 'End', 'Duration (min)', 'Type', 'Mode', 'Commute (min)', 'Destination', 'Purpose', 'Distance (km)', 'Note'].join(',');

  const rows = [...sessions]
    .sort((a, b) => a.startTime - b.startTime)
    .map(s => {
      const date = new Date(s.startTime).toLocaleDateString(lang);
      const start = formatTime(s.startTime);
      const end = s.endTime ? formatTime(s.endTime) : '';
      const durationMin = Math.floor(getSessionDuration(s.startTime, s.endTime) / 60000);
      const type = s.delegation?.isTrip ? 'delegation' : s.type;
      const mode = s.mode;
      const commuteMin = s.commuteStartTime
        ? Math.floor(getSessionDuration(s.commuteStartTime, s.commuteEndTime) / 60000)
        : 0;
      const dest = s.delegation?.destination ?? '';
      const purpose = s.delegation?.purpose ?? '';
      const dist = s.delegation?.distance ?? '';
      const note = s.note ?? '';
      return [date, start, end, durationMin, type, mode, commuteMin, dest, purpose, dist, note]
        .map(escapeCSV).join(',');
    });

  const metaLines = [
    `# WorkTime Tracker — Export`,
    `# ${i18n.t('pdf.employee')}: ${userName}${company ? ' / ' + company : ''}`,
    `# ${i18n.t('pdf.period')}: ${rangeLabel}`,
    `# ${i18n.t('pdf.generated')}: ${new Date().toLocaleString(lang)}`,
    '',
  ].join('\n');

  const csv = metaLines + header + '\n' + rows.join('\n');
  const fileName = `worktime_${rangeLabel.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: i18n.t('stats.exportCsv'),
      UTI: 'public.comma-separated-values-text',
    });
  }
};

export const exportToPDF = async (sessions: WorkSession[], rangeLabel: string, settings: AppSettings): Promise<void> => {
  const html = buildHtml(sessions, rangeLabel, settings);
  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: i18n.t('stats.exportPdf'),
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ html });
  }
};
