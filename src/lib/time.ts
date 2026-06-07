import dayjs from 'dayjs';

/** Spanish relative time ("hace 5 min"). Falls back to an absolute date past ~30 days. */
export function formatRelative(input: string | number | Date): string {
  const then = dayjs(input);
  const secs = dayjs().diff(then, 'second');
  if (secs < 0) return 'en unos instantes';
  if (secs < 10) return 'hace un momento';
  if (secs < 60) return `hace ${secs} s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} d`;
  return then.format('D MMM YYYY');
}
