export type TimeValue = { hour: number; minute: number };

export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const POLISH_MONTHS = [
  'stycznia',
  'lutego',
  'marca',
  'kwietnia',
  'maja',
  'czerwca',
  'lipca',
  'sierpnia',
  'września',
  'października',
  'listopada',
  'grudnia',
];

export function formatPolishDate(date: Date = new Date()): string {
  return `${date.getDate()} ${POLISH_MONTHS[date.getMonth()]}`;
}

export function formatTimeValue({ hour, minute }: TimeValue): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function timeValueToDbTime(value: TimeValue | null): string | null {
  return value ? `${formatTimeValue(value)}:00` : null;
}

export function dbTimeToTimeValue(value: string | null): TimeValue | null {
  if (!value) return null;
  const [hourText, minuteText] = value.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return { hour, minute };
}
