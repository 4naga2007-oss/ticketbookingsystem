import React, { useEffect, useRef } from 'react';
import type { BookingStatus, PaymentStatus, AccountStatus, VehicleType } from '../../types/domain';

// ─── Status Badge ─────────────────────────────────────────────────────────────

interface BookingBadgeProps { status: BookingStatus }
export const BookingStatusBadge: React.FC<BookingBadgeProps> = ({ status }) => {
  const map: Record<BookingStatus, string> = {
    INITIATED: 'badge-initiated',
    CONFIRMED: 'badge-confirmed',
    CANCELLED: 'badge-cancelled',
  };
  return <span className={map[status]}>{status}</span>;
};

interface PaymentBadgeProps { status: PaymentStatus }
export const PaymentStatusBadge: React.FC<PaymentBadgeProps> = ({ status }) => {
  const map: Record<PaymentStatus, string> = {
    PENDING:  'badge-pending',
    SUCCESS:  'badge-success',
    FAILED:   'badge-failed',
    REFUNDED: 'badge-refunded',
  };
  return <span className={map[status]}>{status}</span>;
};

interface AccountBadgeProps { status: AccountStatus }
export const AccountStatusBadge: React.FC<AccountBadgeProps> = ({ status }) => {
  const map: Record<AccountStatus, string> = {
    Active:    'badge-active',
    Inactive:  'badge-inactive',
    Suspended: 'badge-suspended',
  };
  return <span className={map[status]}>{status}</span>;
};

interface VehicleBadgeProps { type: VehicleType }
export const VehicleTypeBadge: React.FC<VehicleBadgeProps> = ({ type }) => (
  <span className={type === 'Train' ? 'badge-train' : 'badge-bus'}>
    {type}
  </span>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export const SkeletonCard: React.FC<{ lines?: number }> = ({ lines = 4 }) => (
  <div className="glass-card p-6 space-y-3" aria-hidden="true">
    <div className="skeleton h-4 w-3/4 rounded" />
    {Array.from({ length: lines - 1 }).map((_, i) => (
      <div key={i} className="skeleton h-3 rounded" style={{ width: `${60 + (i % 3) * 15}%` }} />
    ))}
  </div>
);

export const SkeletonRow: React.FC = () => (
  <tr aria-hidden="true">
    {Array.from({ length: 6 }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="skeleton h-3 rounded" style={{ width: `${50 + (i % 4) * 12}%` }} />
      </td>
    ))}
  </tr>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center gap-4 py-12 text-center" role="status">
    {icon && <div className="mb-2 text-slate-400" aria-hidden="true">{icon}</div>}
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    {description && <p className="max-w-sm text-sm text-slate-600">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

// ─── Error State ──────────────────────────────────────────────────────────────

interface ErrorStateProps { message: string; onRetry?: () => void }
export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <div className="glass-card flex flex-col items-center gap-4 border-rose-200 p-8 text-center" role="alert">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-700 text-xl" aria-hidden="true">×</div>
    <p className="font-medium text-slate-800">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-secondary text-sm">
        Try Again
      </button>
    )}
  </div>
);

// ─── Spinner ──────────────────────────────────────────────────────────────────

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-7 h-7', lg: 'w-10 h-10' };
  return (
    <div
      className={`${sizeMap[size]} rounded-full border-2 border-brand-500 border-t-transparent animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
}
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, title, message, confirmLabel = 'Confirm',
  cancelLabel = 'Cancel', onConfirm, onCancel, variant = 'danger'
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;
  return (
    <div className="dialog-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="dialog-panel p-6"
      >
        <h3 id="confirm-dialog-title" className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
        <p id="confirm-dialog-message" className="mb-6 text-sm text-slate-600">{message}</p>
        <div className="flex gap-3 justify-end">
          <button ref={cancelRef} onClick={onCancel} className="btn-secondary">{cancelLabel}</button>
          <button
            onClick={onConfirm}
            className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────

interface SectionHeaderProps { title: string; subtitle?: string; action?: React.ReactNode }
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between gap-4 mb-6">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
      {subtitle && <p className="text-slate-600 text-sm mt-1">{subtitle}</p>}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);
