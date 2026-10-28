/**
 * Utility functions used across the frontend.
 */

/** Format a date string to a human-readable format (e.g. "06 Oct 2026") */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/** Format a time string (HH:MM:SS) to short form (HH:MM) */
export function formatTime(timeStr: string): string {
  if (!timeStr) return '—';
  return timeStr.slice(0, 5);
}

/** Format a currency amount (in INR) */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Mask a card number showing only last 4 digits */
export function maskCardNumber(cardNumber: string): string {
  const stripped = cardNumber.replace(/\s/g, '').replace(/\D/g, '');
  if (stripped.length < 4) return '•••• •••• •••• ••••';
  const last4 = stripped.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

/** Format a card number input as "XXXX XXXX XXXX XXXX" */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

/** Format an expiry date input as "MM/YY" */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

/** Calculate duration between two HH:MM time strings */
export function calcDuration(dep: string, arr: string): string {
  try {
    const [dh, dm] = dep.split(':').map(Number);
    const [ah, am] = arr.split(':').map(Number);
    let mins = (ah * 60 + am) - (dh * 60 + dm);
    if (mins < 0) mins += 24 * 60;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  } catch {
    return '';
  }
}

/** Truncate a string to a max length */
export function truncate(str: string, maxLen = 40): string {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}

/** Generate seat labels A1–A10, B1–B10, … */
export function generateSeatLabels(total: number): string[] {
  const seats: string[] = [];
  const rows = 'ABCDEFGHIJ';
  let rowIdx = 0;
  let seatInRow = 1;
  for (let i = 0; i < total; i++) {
    seats.push(`${rows[rowIdx]}${seatInRow}`);
    seatInRow++;
    if (seatInRow > 10) { seatInRow = 1; rowIdx++; }
  }
  return seats;
}

/** Get initials from a name string */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() ?? '')
    .join('');
}
