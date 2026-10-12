import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Trophy, 
  Scale, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  Activity,
  Plus
} from 'lucide-react';
import mockService from '../../services/mockService';
import PageHeader from '../../components/dashboard/PageHeader';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/dashboard/StatusBadge';
import Button from '../../components/ui/Button';

export const AdminDashboardPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(mockService.getAdminOverview());
  }, []);

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        badge="// ADMINISTRATOR OVERVIEW"
        title="Pusat Kendali Festival & Kompetisi"
        description="Ringkasan metrik partisipasi, status pendaftaran peserta, dan aktivitas sistem kompetisi secara real-time."
        actions={
          <div className="flex items-center gap-2.5">
            <Link to="/admin/competitions">
              <Button variant="secondary" size="sm" className="text-xs">
                Kelola Lomba
              </Button>
            </Link>
            <Link to="/admin/participants">
              <Button variant="primary" size="sm" className="text-xs gap-1.5">
                <span>Verifikasi Pendaftaran</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        }
      />

      {/* 4 Overview Statistics Cards (Calculated Dynamically from Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Peserta Terdaftar"
          value={data.totalParticipants}
          description="Peserta akun aktif di sistem"
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Cabang Kompetisi"
          value={data.totalCompetitions}
          description="Kategori lomba aktif 2026"
          icon={Trophy}
          variant="orange"
        />
        <StatCard
          title="Dewan Juri Ditugaskan"
          value={data.totalJudges}
          description="Pakar industri & akademisi"
          icon={Scale}
          variant="amber"
        />
        <StatCard
          title="Pendaftaran Menunggu"
          value={data.pendingRegistrations}
          description="Perlu verifikasi dokumen"
          icon={Clock}
          variant="emerald"
        />
      </div>

      {/* Two Column Grid: Recent Activity & Upcoming Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Recent Activities (7 cols) */}
        <div className="lg:col-span-7 bg-[#1C1410] border border-[rgba(255,179,107,0.18)] rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#FF6A00]" />
              <h3 className="text-lg font-bold font-display text-[#FFF7F0]">
                Aktivitas Sistem Terkini
              </h3>
            </div>
            <span className="font-mono text-xs text-[#948277]">
              LIVE TELEMETRY
            </span>
          </div>

          <div className="space-y-4">
            {data.recentActivities.map((act) => (
              <div
                key={act.id}
                className="p-4 rounded-2xl bg-[#211811] border border-[rgba(255,179,107,0.1)] flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#FF6A00] mt-1.5 shrink-0 animate-pulse" />
                  <p className="text-xs sm:text-sm text-[#C4B3A7] leading-relaxed">
                    {act.description}
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[#948277] whitespace-nowrap shrink-0">
                  {act.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Upcoming Schedule Milestones (5 cols) */}
        <div className="lg:col-span-5 bg-[#1C1410] border border-[rgba(255,179,107,0.18)] rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#FF7A1A]" />
              <h3 className="text-lg font-bold font-display text-[#FFF7F0]">
                Milestone Mendatang
              </h3>
            </div>
            <Link to="/admin/schedule" className="text-xs font-mono text-[#FFB36B] hover:underline">
              Kelola Jadwal &rarr;
            </Link>
          </div>

          <div className="space-y-3.5">
            {data.upcomingMilestones.map((milestone) => (
              <div
                key={milestone.id}
                className="p-4 rounded-2xl bg-[#211811] border border-[rgba(255,179,107,0.1)] space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs sm:text-sm text-[#FFF7F0] font-display">
                    {milestone.title}
                  </span>
                  <span className="font-mono text-[10px] text-[#FFB36B] bg-[#17110D] px-2 py-0.5 rounded border border-[rgba(255,179,107,0.15)]">
                    {milestone.date}
                  </span>
                </div>
                <p className="text-xs text-[#948277] line-clamp-1">
                  {milestone.description}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboardPage;
