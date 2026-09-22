import React from 'react';
import { Link } from 'react-router-dom';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export const CompetitionCard = ({ competition }) => {
  const {
    name,
    slug,
    category_label,
    target_level_label,
    theme,
    description,
    registration_fee = 0,
    quota = 50,
    min_team_member = 1,
    max_team_member = 3,
    registration_start,
    registration_end,
    status = 'draft',
    status_label,
  } = competition;

  const formattedFee = registration_fee > 0
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(registration_fee)
    : 'Gratis';

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  };

  const statusVariant = {
    registration_open: 'success',
    registration_closed: 'warning',
    submission_open: 'primary',
    judging: 'info',
    finished: 'default',
    draft: 'default',
    archived: 'default',
  }[status] || 'default';

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-brand-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      {/* Top Card Header */}
      <div className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="primary" className="text-xs font-semibold">
              {category_label || competition.category}
            </Badge>
            <Badge variant="info" className="text-xs font-semibold">
              {target_level_label || (competition.target_level === 'university' ? 'Mahasiswa' : 'Siswa SMA/SMK')}
            </Badge>
          </div>
          <Badge variant={statusVariant} className="text-xs font-medium">
            {status_label || status}
          </Badge>
        </div>

        <h3 className="text-xl font-bold text-gray-950 group-hover:text-brand-600 transition-colors mb-1">
          {name}
        </h3>

        {theme && (
          <p className="text-xs font-medium text-brand-700 bg-brand-50 rounded-lg px-2.5 py-1 mb-3 inline-block">
            Tema: {theme}
          </p>
        )}

        <p className="text-sm text-gray-600 line-clamp-3 mb-5 leading-relaxed">
          {description}
        </p>

        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100 text-xs">
          <div>
            <span className="text-gray-400 block mb-0.5">Biaya</span>
            <span className="font-bold text-gray-900">{formattedFee}</span>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">Format Tim</span>
            <span className="font-bold text-gray-900">
              {min_team_member === max_team_member ? `${min_team_member} Orang` : `${min_team_member}-${max_team_member} Orang`}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">Pendaftaran</span>
            <span className="font-bold text-gray-900">
              {formatDate(registration_start)} - {formatDate(registration_end)}
            </span>
          </div>
        </div>
      </div>

      {/* Card Action footer */}
      <div className="px-6 py-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-3">
        <Link to={`/competitions/${slug}`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full font-semibold">
            Lihat Detail
          </Button>
        </Link>
        <div className="flex-1" title="Pendaftaran peserta akan dibuka pada Fase 3">
          <Button variant="primary" size="sm" className="w-full font-semibold opacity-60 cursor-not-allowed" disabled>
            Daftar (Fase 3)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompetitionCard;
