/** Return a calendar key for the user's local timezone, never UTC. */
export const toLocalDateKey = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseLocalDateKey = (key: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
};

export const daysFromToday = (key: string, now: Date = new Date()): number | null => {
  const date = parseLocalDateKey(key);
  if (!date) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
};

/** Convert Google Events labels (for example, "Jul 27") into a calendar key. */
export const normalizeEventDate = (value: string, now: Date = new Date()): string | null => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const relative = /^upcoming\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/i.exec(value.trim());
  if (relative) {
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const target = weekdays.indexOf(relative[1].toLowerCase());
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    date.setDate(date.getDate() + ((target - date.getDay() + 7) % 7 || 7));
    return toLocalDateKey(date);
  }
  const parsed = new Date(`${value.replace(',', '')} ${now.getFullYear()} 12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - 86_400_000) {
    parsed.setFullYear(parsed.getFullYear() + 1);
  }
  return toLocalDateKey(parsed);
};
