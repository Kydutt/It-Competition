import React from 'react';

export const StatusBadge = ({ status = 'pending', className = '' }) => {
  const configs = {
    approved: { label: 'Disetujui', bg: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' },
    active: { label: 'Aktif', bg: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' },
    paid: { label: 'Lunas', bg: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' },
    submitted: { label: 'Diserahkan', bg: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' },
    completed: { label: 'Selesai', bg: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' },
    published: { label: 'Dipublikasikan', bg: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' },

    pending: { label: 'Menunggu', bg: 'bg-amber-950/60 text-amber-400 border-amber-800/60' },
    pending_verification: { label: 'Verifikasi', bg: 'bg-amber-950/60 text-amber-400 border-amber-800/60' },
    upcoming: { label: 'Mendatang', bg: 'bg-amber-950/60 text-amber-400 border-amber-800/60' },
    draft: { label: 'Draft', bg: 'bg-[#211811] text-[#C4B3A7] border-[rgba(255,179,107,0.2)]' },

    rejected: { label: 'Ditolak', bg: 'bg-rose-950/60 text-rose-400 border-rose-800/60' },
    closed: { label: 'Ditutup', bg: 'bg-rose-950/60 text-rose-400 border-rose-800/60' },
    registration_closed: { label: 'Ditutup', bg: 'bg-rose-950/60 text-rose-400 border-rose-800/60' },

    registration_open: { label: 'Buka', bg: 'bg-[#FF6A00]/15 text-[#FFB36B] border-[#FF6A00]/40' },
  };

  const config = configs[status] || {
    label: status.replace(/_/g, ' '),
    bg: 'bg-[#211811] text-[#C4B3A7] border-[rgba(255,179,107,0.2)]',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold tracking-wide border ${config.bg} ${className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
