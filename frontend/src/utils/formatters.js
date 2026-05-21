import { format, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export function formatDate(dateString) {
  if (!dateString) return '-';
  return format(new Date(dateString), 'dd MMM yyyy', { locale: id });
}

export function formatDateTime(dateString) {
  if (!dateString) return '-';
  return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: id });
}

export function formatRelative(dateString) {
  if (!dateString) return '-';
  return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: id });
}

export function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num);
}

export function truncate(str, maxLength = 80) {
  if (!str) return '';
  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
}
