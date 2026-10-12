import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '../ui/Button';

export const ConfirmDialog = ({
  isOpen = false,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  onConfirm = () => {},
  onCancel = () => {},
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1C1410] border border-[rgba(255,179,107,0.25)] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative">
        <button
          onClick={onCancel}
          className="absolute top-5 right-5 text-[#948277] hover:text-[#FFF7F0]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold font-display text-[#FFF7F0]">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-[#C4B3A7] leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[rgba(255,179,107,0.1)]">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
