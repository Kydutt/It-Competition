import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, Calendar, ArrowUpRight } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export const CompetitionCard = ({ competition }) => {
  const {
    name = competition.title,
    title = name,
    slug,
    category_label = competition.category,
    target_level_label = competition.target_level_label || 'Mahasiswa & SMA',
    theme,
    description = competition.shortDescription,
    registration_fee = 0,
    registration_fee_formatted,
    quota = 50,
    min_team_member = 1,
    max_team_member = 3,
    registration_start,
    registration_end,
    status = 'registration_open',
    status_label = 'Pendaftaran Dibuka',
    prizePool = 'Rp 10.000.000',
  } = competition;

  const formattedFee = registration_fee > 0
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(registration_fee)
    : registration_fee_formatted || 'Gratis';

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="bg-[#1C1410] rounded-3xl border border-[rgba(255,179,107,0.18)] hover:border-[#FF7A1A] transition-all duration-300 shadow-lg hover:shadow-orange-glow flex flex-col justify-between overflow-hidden group">
      {/* Top Card Header */}
      <div className="p-6 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[11px] font-semibold text-[#FFB36B] tracking-wide uppercase bg-[#211811] px-2.5 py-1 rounded-lg border border-[rgba(255,179,107,0.15)]">
            {category_label}
          </span>
          <Badge variant="fest" className="text-[11px]">
            {target_level_label}
          </Badge>
        </div>

        <div>
          <h3 className="text-xl font-bold font-display text-[#FFF7F0] group-hover:text-[#FFB36B] transition-colors leading-snug">
            {title}
          </h3>
          {theme && (
            <p className="text-xs font-mono text-[#FF7A1A] mt-1 line-clamp-1">
              Tema: {theme}
            </p>
          )}
        </div>

        <p className="text-sm text-[#C4B3A7] line-clamp-3 leading-relaxed font-sans">
          {description}
        </p>

        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[rgba(255,179,107,0.12)] text-xs font-mono">
          <div>
            <span className="text-[#948277] block text-[10px] uppercase">Biaya</span>
            <span className="font-bold text-[#FFF7F0]">{formattedFee}</span>
          </div>
          <div>
            <span className="text-[#948277] block text-[10px] uppercase">Tim</span>
            <span className="font-bold text-[#FFF7F0]">
              {min_team_member === max_team_member ? `${min_team_member} Org` : `${min_team_member}-${max_team_member} Org`}
            </span>
          </div>
          <div>
            <span className="text-[#948277] block text-[10px] uppercase">Hadiah</span>
            <span className="font-bold text-[#FF6A00]">{prizePool}</span>
          </div>
        </div>
      </div>

      {/* Card Action footer */}
      <div className="px-6 py-4 bg-[#211811] border-t border-[rgba(255,179,107,0.12)] flex items-center justify-between gap-3">
        <Link to={`/competitions/${slug}`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full font-semibold text-xs gap-1">
            <span>Rincian Lomba</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
        <Link to={`/register?competition=${slug}`} className="flex-1">
          <Button variant="glow" size="sm" className="w-full font-semibold text-xs">
            Daftar Sekarang
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default CompetitionCard;
