import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  FolderCheck, 
  Calendar, 
  Megaphone, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import mockService from '../../services/mockService';
import PageHeader from '../../components/dashboard/PageHeader';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/dashboard/StatusBadge';
import Button from '../../components/ui/Button';

export const ParticipantDashboardPage = () => {
  const { user } = useAuth();
  const overview = useMemo(() => {
    return mockService.getParticipantOverview(user?.id);
  }, [user?.id]);

  return (
    <div className="space-y-8">
      {/* Personalized Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#211811] via-[#17110D] to-[#2A1D15] border border-[rgba(255,179,107,0.2)] p-6 md:p-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#FF6A00]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#2A1D15] border border-[rgba(255,179,107,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span className="text-[11px] font-mono text-[#FFB36B] uppercase tracking-wider">
              PORTAL RESMI PESERTA // 2026
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black font-display text-[#FFF7F0] tracking-tight">
            Selamat Datang, <span className="text-[#FF6A00]">{user?.name || 'Inovator'}</span>!
          </h1>
          <p className="text-xs md:text-sm text-[#C4B3A7] leading-relaxed">
            Institusi: <strong className="text-[#FFF7F0]">{user?.institution || 'Belum diisi'}</strong> • NIM/ID:{' '}
            <strong className="text-[#FFF7F0]">{user?.studentId || '-'}</strong>. Pantau status tim, jadwal babak penyisihan, dan kirimkan karya terbaik Anda di sini.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link to="/participant/competitions">
              <Button variant="primary" className="flex items-center space-x-2 text-xs">
                <Trophy className="w-4 h-4" />
                <span>Eksplorasi Cabang Lomba</span>
              </Button>
            </Link>
            <Link to="/participant/registrations">
              <Button variant="outline" className="flex items-center space-x-2 text-xs">
                <FolderCheck className="w-4 h-4" />
                <span>Lihat Tim Saya</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Cabang Lomba Terdaftar"
          value={overview.registeredCount}
          change={overview.registeredCount > 0 ? 'Pendaftaran aktif' : 'Belum mendaftar lomba'}
          changeType={overview.registeredCount > 0 ? 'positive' : 'neutral'}
          icon={Trophy}
        />
        <StatCard
          title="Status Lolos / Approved"
          value={overview.approvedCount}
          change={`${overview.pendingCount} menunggu verifikasi`}
          changeType={overview.approvedCount > 0 ? 'positive' : 'neutral'}
          icon={CheckCircle2}
        />
        <StatCard
          title="Agenda Mendatang"
          value={overview.upcomingSchedules.length}
          change="Milestone terjadwal"
          changeType="neutral"
          icon={Calendar}
        />
      </div>

      {/* 2-Column Section: My Active Registrations & Next Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Registrations List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-[#FFF7F0] flex items-center space-x-2">
              <FolderCheck className="w-4 h-4 text-[#FF6A00]" />
              <span>Status Pendaftaran Tim Anda</span>
            </h3>
            <Link
              to="/participant/registrations"
              className="text-xs font-mono text-[#FFB36B] hover:text-[#FF6A00] flex items-center space-x-1"
            >
              <span>Selengkapnya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {overview.myRegistrations.length === 0 ? (
            <div className="p-8 bg-[#17110D] border border-[rgba(255,179,107,0.14)] rounded-3xl text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2A1D15] border border-[rgba(255,179,107,0.2)] flex items-center justify-center text-[#FFB36B] mx-auto">
                <Trophy className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold font-display text-[#FFF7F0]">
                Anda Belum Mendaftar di Cabang Lomba Apapun
              </h4>
              <p className="text-xs text-[#948277] max-w-sm mx-auto">
                Pilih cabang kompetisi inovatif yang sesuai dengan keahlian Anda dan daftarkan tim Anda sekarang.
              </p>
              <Link to="/participant/competitions" className="inline-block pt-2">
                <Button variant="primary" className="text-xs">
                  Daftar Kompetisi Sekarang
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {overview.myRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className="p-5 bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-2xl space-y-3 hover:border-[#FF6A00]/40 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-bold font-display text-[#FFF7F0] block">
                        {reg.competitionName}
                      </span>
                      <span className="text-xs text-[#FFB36B] font-mono">
                        Tim: {reg.teamName} ({reg.teamMembers?.length || 1} Anggota)
                      </span>
                    </div>
                    <StatusBadge status={reg.status} />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,179,107,0.1)] text-xs font-mono">
                    <span className="text-[#948277]">
                      Submission: {reg.submissionTitle ? 'Telah Dikirim' : 'Belum Dikirim'}
                    </span>
                    <Link
                      to="/participant/registrations"
                      className="text-[#FF6A00] hover:underline font-semibold"
                    >
                      Buka Rincian &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Next Milestones & Announcements */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upcoming Schedule */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-display text-[#FFF7F0] flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-[#FFB36B]" />
                <span>Jadwal Terdekat</span>
              </h3>
              <Link
                to="/participant/schedule"
                className="text-xs font-mono text-[#FFB36B] hover:text-[#FF6A00]"
              >
                Lihat Kalender
              </Link>
            </div>

            <div className="space-y-2">
              {overview.upcomingSchedules.map((sch) => (
                <div
                  key={sch.id}
                  className="p-3.5 bg-[#17110D] border border-[rgba(255,179,107,0.14)] rounded-2xl flex items-start space-x-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#2A1D15] border border-[rgba(255,179,107,0.2)] flex flex-col items-center justify-center text-[#FFB36B] shrink-0 font-mono">
                    <span className="text-[10px] uppercase">
                      {new Date(sch.date).toLocaleDateString('id-ID', { month: 'short' })}
                    </span>
                    <span className="text-sm font-bold leading-none">
                      {new Date(sch.date).getDate()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold font-display text-[#FFF7F0] truncate">
                      {sch.title}
                    </h5>
                    <p className="text-[11px] text-[#948277]">{sch.time} • {sch.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements Widget */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-display text-[#FFF7F0] flex items-center space-x-2">
                <Megaphone className="w-4 h-4 text-[#FF6A00]" />
                <span>Pengumuman Panitia</span>
              </h3>
              <Link
                to="/participant/announcements"
                className="text-xs font-mono text-[#FFB36B] hover:text-[#FF6A00]"
              >
                Semua
              </Link>
            </div>

            <div className="space-y-2">
              {overview.recentAnnouncements.map((anc) => (
                <div
                  key={anc.id}
                  className="p-3.5 bg-[#17110D] border border-[rgba(255,179,107,0.14)] rounded-2xl space-y-1"
                >
                  <span className="text-xs font-bold text-[#FFF7F0] block">
                    {anc.title}
                  </span>
                  <p className="text-[11px] text-[#948277] line-clamp-2 leading-relaxed">
                    {anc.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantDashboardPage;
