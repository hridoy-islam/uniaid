import moment from 'moment';
import momentTz from 'moment-timezone';

// Slots are run in the UK, so "today" follows UK time whatever the device says
export const UK_TZ = 'Europe/London';
export const ukTodayKey = () => momentTz().tz(UK_TZ).format('YYYY-MM-DD');

// ── Calendar constants (same grid as the course routine) ─────────────────────
export const START_H = 8;
export const END_H = 23;
export const HOURS = Array.from(
  { length: END_H - START_H },
  (_, i) => START_H + i
);
export const ROW_HEIGHT = 68;
export const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Monday first, matching how the college reads a week.
export const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' }
];

export function pad(n: number) {
  return String(n).padStart(2, '0');
}
export function fmtH(h: number) {
  return `${pad(h)}:00`;
}

export function isToday(d: Date) {
  return moment(d).isSame(moment(), 'day');
}

export function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function timeRangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
) {
  return (
    toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd)
  );
}

// Turns "9", "930", "9:3" etc. into "09:00", "09:30", "09:03".
export function formatTimeInput(value: string): string {
  let cleanValue = value.trim();
  if (cleanValue) {
    const m = moment(cleanValue, ['HH:mm', 'H:mm', 'HHmm', 'Hmm', 'H']);
    if (m.isValid()) cleanValue = m.format('HH:mm');
  }
  return cleanValue;
}

// Keeps a typed time to digits and one colon, adding the colon after the hour.
export function maskTimeInput(next: string, prev: string) {
  let val = next
    .replace(/[^0-9:]/g, '')
    .replace(/:+/g, ':')
    .slice(0, 5);
  if (val.length === 2 && prev.length === 1 && !val.includes(':')) val += ':';
  return val;
}

// Duration is never typed, it is always end - start.
export function durationMinutes(startTime: string, endTime: string) {
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) return 0;
  return Math.max(toMinutes(endTime) - toMinutes(startTime), 0);
}

export function durationLabel(minutes: number) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} hr${h > 1 ? 's' : ''}` : '', m ? `${m} min` : '']
    .filter(Boolean)
    .join(' ');
}

// The server keeps a slot's day as UTC midnight, so the date part of the ISO
// string is the calendar day. A local Date is turned into the same key from
// its local parts so neither side shifts by a day across timezones.
export function slotDateKey(value: string) {
  return String(value).split('T')[0];
}

export function localDateKey(d: Date | moment.Moment) {
  return moment(d).format('YYYY-MM-DD');
}

export function keyToLocalDate(key: string) {
  return moment(key, 'YYYY-MM-DD').toDate();
}

export function formatSlotDate(value: string, format = 'ddd, DD MMM YYYY') {
  return moment(slotDateKey(value), 'YYYY-MM-DD').format(format);
}

// 24 hour clock, e.g. "14:30"
export function formatTime(t: string) {
  return moment(t, 'HH:mm').format('HH:mm');
}

export function isSlotPast(slot: { date: string; endTime: string }) {
  return moment(
    `${slotDateKey(slot.date)} ${slot.endTime}`,
    'YYYY-MM-DD HH:mm'
  ).isBefore(moment());
}

export function studentName(student: any) {
  if (!student) return '';
  return [student.firstName, student.lastName].filter(Boolean).join(' ');
}

export function teacherIdOf(slot: any): string {
  return slot?.teacherId?._id || slot?.teacherId || '';
}

export function makeRowId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// react-select renders its menu in a portal to <body> so the dialog or sheet
// it opens in can not clip it or paint over it. Radix sets
// `pointer-events: none` on <body> while a modal is open, so the portal has to
// restore it, and it sits above the dialog's z-index.
export const selectStyles = {
  menuPortal: (base: any) => ({ ...base, zIndex: 9999, pointerEvents: 'auto' }),
  menu: (base: any) => ({ ...base, zIndex: 9999 }),
  control: (base: any) => ({
    ...base,
    minHeight: '36px',
    height: '36px',
    borderColor: '#D1D5DB',
    boxShadow: 'none',
    fontSize: '0.75rem',
    '&:hover': { borderColor: '#9CA3AF' }
  }),
  valueContainer: (base: any) => ({ ...base, padding: '0 8px' }),
  input: (base: any) => ({ ...base, margin: 0, padding: 0 })
};

export const portalSelectProps = {
  styles: selectStyles,
  classNamePrefix: 'rs',
  menuPortalTarget: typeof document !== 'undefined' ? document.body : null
};

// Radix closes a dialog/sheet on any pointer down outside its content, which
// includes the select menu portaled to <body>. Keep it open for those.
export function keepOpenForSelectMenu(e: Event) {
  const target = e.target as HTMLElement | null;
  if (
    target?.closest?.(
      '.rs__menu-portal, .rs__menu, .react-datepicker, .react-datepicker-popper'
    )
  )
    e.preventDefault();
}

export const UNASSIGNED = 'unassigned';
