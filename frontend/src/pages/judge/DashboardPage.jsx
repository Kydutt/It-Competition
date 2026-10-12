import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Scale, 
  Trophy, 
  CheckSquare, 
  Clock, 
  BarChart3, 
  ArrowRight,
  Sparkles,
  FileText
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import mockService from '../../services/mockService';
import PageHeader from '../../components/dashboard/PageHeader';
import StatCard from '../../components/dashboard/StatCard';
import Button from '../../components/ui/Button';

export const JudgeDashboardPage = () => {
  const { user } = useAuth();
  const overview = useMemo(() => {
    return mockService.getJudgeOverview(user?.id || user?.email);
  }, [user?.id, user?.email]);

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#211811] via-[#17110D] to-[#2A1D15] border border-[rgba(255,179,107,0.2)] p-6 md:p-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#FF6A00]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#2A1D15] border border-[rgba(255,179,107,0.2)]">
            <Scale className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span className="text-[11px] font-mono text-[#FFB36B] uppercase tracking-wider">
              PORTAL DEWAN JURI // 2026
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black font-display text-[#FFF7F0] tracking-tight">
            Selamat Bertugas, <span className="text-[#FF6A00]">{user?.name || 'Dewan Juri'}</span>
          </h1>
          <p className="text-xs md:text-sm text-[#C4B3A7] leading-relaxed">
            Spesialisasi: <strong className="text-[#FFF7F0]">{overview.judge?.specialization || 'Software Engineering'}</strong> • Institusi:{' '}
            <strong className="text-[#FFF7F0]">{overview.judge?.institution || 'Praktisi'}</strong>. Berikan penilaian objektif berdasarkan rubrik terstandar.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link to="/judge/evaluations">
              <Button variant="primary" className="flex items-center space-x-2 text-xs">
                <CheckSquare className="w-4 h-4" />
                <span>Mulai Evaluasi Karya</span>
              </Button>
            </Link>
            <Link to="/judge/competitions">
              <Button variant="outline" className="flex items-center space-x-2 text-xs">
                <Trophy className="w-4 h-4" />
                <span>Lihat Lomba Ditugaskan</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Lomba Ditugaskan"
          value={overview.assignedCompetitions.length}
          change="Cabang lomba resmi"
          changeType="neutral"
          icon={Trophy}
        />
        <StatCard
          title="Total Berkas Karya"
          value={overview.totalSubmissions}
          change="Dari pendaftaran approved"
          changeType="neutral"
          icon={FileText}
        />
        <StatCard
          title="Menunggu Penilaian"
          value={overview.pendingEvaluations}
          change="Perlu evaluasi segera"
          changeType={overview.pendingEvaluations > 0 ? 'negative' : 'positive'}
          icon={Clock}
        />
        <StatCard
          title="Evaluasi Selesai"
          value={overview.completedEvaluations}
          change="Nilai final diserahkan"
          changeType="positive"
          icon={CheckSquare}
        />
      </div>

      {/* Assigned Competitions Quick Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-display text-[#FFF7F0] flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-[#FF6A00]" />
            <span>Cabang Kompetisi Yang Ditugaskan</span>
          </h3>
          <Link
            to="/judge/competitions"
            className="text-xs font-mono text-[#FFB36B] hover:text-[#FF6A00] flex items-center space-x-1"
          >
            <span>Selengkapnya</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overview.assignedCompetitions.map((comp) => (
            <div
              key={comp.id}
              className="p-6 bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-3xl space-y-4 hover:border-[#FF6A00]/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#FFB36B] uppercase block">
                    {comp.category_label || comp.category}
                  </span>
                  <h4 className="text-base font-bold font-display text-[#FFF7F0]">
                    {comp.name}
                  </h4>
                </div>
                <Link to="/judge/evaluations">
                  <Button variant="outline" className="text-xs py-1.5 px-3">
                    Buka Penilaian
                  </Button>
                </Link>
              </div>

              <div className="space-y-2 pt-2 border-t border-[rgba(255,179,107,0.1)] text-xs">
                <span className="font-mono text-[#948277] text-[11px] block uppercase">
                  Bobot Rubrik:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  {(comp.rubric || [
                    { id: '1', name: 'Teknis', weight: 40 },
                    { id: '2', name: 'Inovasi', weight: 30 },
                    { id: '3', name: 'Presentasi', weight: 20 },
                    { id: '4', name: 'Dokumen', weight: 10 },
                  ]).map((r) => (
                    <div key={r.id} className="flex justify-between p-2 rounded-lg bg-[#1C1410]">
                      <span className="text-[#C4B3A7]">{r.name}</span>
                      <span className="text-[#FF6A00] font-bold">{r.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JudgeDashboardPage;
