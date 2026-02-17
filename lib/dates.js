import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, isSameDay, addDays, subDays, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(date, "d 'de' MMMM, yyyy", { locale: es });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(date, 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export function getDayName(dateStr) {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(date, 'EEEE', { locale: es });
  } catch {
    return '';
  }
}

export function getWeekRange() {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  };
}

export function getMonthRange() {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
}

export function isTodayDate(dateStr) {
  if (!dateStr) return false;
  try {
    return isToday(parseISO(dateStr));
  } catch {
    return false;
  }
}

export function isSameDate(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return false;
  try {
    return isSameDay(parseISO(dateStr1), parseISO(dateStr2));
  } catch {
    return false;
  }
}

export function generateCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = startOfWeek(firstDay, { weekStartsOn: 1 });
  
  const days = [];
  let current = startDay;
  
  while (days.length < 42) {
    days.push(new Date(current));
    current = addDays(current, 1);
  }
  
  return days;
}

export function toISODate(date) {
  return format(date, 'yyyy-MM-dd');
}
