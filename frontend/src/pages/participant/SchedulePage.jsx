import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Tag, 
  Sparkles,
  Search
} from 'lucide-react';
import mockService from '../../services/mockService';
import PageHeader from '../../components/dashboard/PageHeader';
import SearchInput from '../../components/dashboard/SearchInput';
import StatusBadge from '../../components/dashboard/StatusBadge';

export const ParticipantSchedulePage = () => {
  const [schedules] = useState(() => mockService.schedules);
  const [search, setSearch] = useState('');

  const filteredSchedules = useMemo(() => {
    return schedules.filter((sch) => {
      return (
        search === '' ||
        sch.title.toLowerCase().includes(search.toLowerCase()) ||
        sch.description?.toLowerCase().includes(search.toLowerCase()) ||
        sch.location?.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [schedules, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal & Agenda Kompetisi"
        description="Lini masa tahapan kompetisi resmi dari pendaftaran, technical meeting, batas pengumpulan karya, hingga awarding night."
        breadcrumbs={[
          { label: 'Peserta', to: '/participant/dashboard' },
          { label: 'Jadwal', to: '/participant/schedule' },
        ]}
      />

      <div className="p-4 bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-2xl max-w-md">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari agenda atau nama kegiatan..."
        />
      </div>

      <div className="space-y-4">
        {filteredSchedules.map((sch, idx) => (
          <div
            key={sch.id}
            className="p-5 md:p-6 bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#FF6A00]/40 transition-colors"
          >
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-[#2A1D15] border border-[rgba(255,179,107,0.2)] flex flex-col items-center justify-center text-[#FFB36B] shrink-0 font-mono">
                <span className="text-[11px] uppercase">
                  {new Date(sch.date).toLocaleDateString('id-ID', { month: 'short' })}
                </span>
                <span className="text-xl font-bold leading-none">
                  {new Date(sch.date).getDate()}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1C1410] text-[#FFB36B] border border-[rgba(255,179,107,0.14)]">
                    {sch.competitionName || 'Semua Cabang'}
                  </span>
                  <StatusBadge status={sch.status} />
                </div>
                <h3 className="text-base font-bold font-display text-[#FFF7F0]">
                  {sch.title}
                </h3>
                <p className="text-xs text-[#948277] max-w-xl leading-relaxed">
                  {sch.description}
                </p>
              </div>
            </div>

            <div className="flex md:flex-col items-start md:items-end justify-between md:justify-center border-t md:border-t-0 border-[rgba(255,179,107,0.1)] pt-3 md:pt-0 text-xs font-mono text-[#C4B3A7] shrink-0 space-y-1">
              <div className="flex items-center space-x-1 text-[#FFB36B]">
                <Clock className="w-3.5 h-3.5" />
                <span>{sch.time}</span>
              </div>
              <div className="flex items-center space-x-1 text-[#948277]">
                <MapPin className="w-3.5 h-3.5" />
                <span>{sch.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticipantSchedulePage;
