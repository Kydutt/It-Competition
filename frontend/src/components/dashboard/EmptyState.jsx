import React from 'react';
import { Inbox } from 'lucide-react';
import Button from '../ui/Button';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'Tidak Ada Data Ditemukan',
  description = 'Belum ada catatan untuk kriteria atau status yang dipilih.',
  actionLabel = null,
  onAction = null,
}) => {
  return (
    <div className="bg-[#1C1410] border border-[rgba(255,179,107,0.18)] rounded-3xl p-10 sm:p-14 text-center space-y-4 max-w-lg mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-[#211811] border border-[rgba(255,179,107,0.25)] text-[#FFB36B] flex items-center justify-center mx-auto shadow-md">
        <Icon className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h4 className="text-lg font-bold font-display text-[#FFF7F0]">
          {title}
        </h4>
        <p className="text-xs sm:text-sm text-[#C4B3A7] max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
