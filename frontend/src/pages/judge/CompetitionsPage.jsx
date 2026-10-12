import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  CheckSquare, 
  Scale, 
  ExternalLink, 
  Users, 
  FileText,
  AlertCircle
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import mockService from '../../services/mockService';
import PageHeader from '../../components/dashboard/PageHeader';
import StatusBadge from '../../components/dashboard/StatusBadge';
import EmptyState from '../../components/dashboard/EmptyState';
import Button from '../../components/ui/Button';

export const JudgeCompetitionsPage = () => {
  const { user } = useAuth();
  const overview = useMemo(() => {
    return mockService.getJudgeOverview(user?.id || user?.email);
  }, [user?.id, user?.email]);

  const assignedCompetitions = overview.assignedCompetitions;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cabang Lomba Ditugaskan"
        description="Daftar cabang kompetisi resmi yang didelegasikan kepada Anda sebagai dewan juri penilai."
        breadcrumbs={[
          { label: 'Juri', to: '/judge/dashboard' },
          { label: 'Lomba Ditugaskan', to: '/judge/competitions' },
        ]}
      />

      {assignedCompetitions.length === 0 ? (
        <EmptyState
          title="Belum Ada Penugasan Lomba"
          message="Administrator belum menugaskan cabang lomba untuk akun juri Anda."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignedCompetitions.map((comp) => {
            const submissions = mockService.registrations.filter(
              (r) => r.competitionId === comp.id && r.status === 'approved'
            );
            const evaluated = mockService.evaluations.filter(
              (e) => e.competitionId === comp.id && e.status === 'submitted'
            );
            const progress = submissions.length > 0
              ? Math.round((evaluated.length / submissions.length) * 100)
              : 0;

            return (
              <div
                key={comp.id}
                className="bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-[#FF6A00]/40 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#2A1D15] text-[#FFB36B] border border-[rgba(255,179,107,0.2)] font-semibold">
                      {comp.category_label || comp.category}
                    </span>
                    <StatusBadge status={comp.status} label={comp.status_label} />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold font-display text-[#FFF7F0]">
                      {comp.name}
                    </h3>
                    <p className="text-xs text-[#FFB36B] font-mono mt-0.5">
                      Tema: {comp.theme}
                    </p>
                  </div>

                  <p className="text-xs text-[#C4B3A7] line-clamp-2 leading-relaxed">
                    {comp.description}
                  </p>

                  {/* Evaluation Progress Bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#948277]">Progres Penilaian Juri:</span>
                      <span className="text-[#FF6A00] font-bold">
                        {evaluated.length} / {submissions.length} Selesai ({progress}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#100B08] h-2 rounded-full overflow-hidden border border-[rgba(255,179,107,0.1)]">
                      <div
                        className="h-full bg-gradient-to-r from-[#FF6A00] to-[#FFB36B] rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Rubric Breakdown */}
                  <div className="p-3.5 bg-[#1C1410] rounded-2xl border border-[rgba(255,179,107,0.12)] space-y-2">
                    <span className="text-[10px] font-mono text-[#FFB36B] uppercase block">
                      Rubrik Penilaian & Bobot:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      {(comp.rubric || [
                        { id: '1', name: 'Teknis', weight: 40 },
                        { id: '2', name: 'Inovasi', weight: 30 },
                        { id: '3', name: 'Presentasi', weight: 20 },
                        { id: '4', name: 'Dokumen', weight: 10 },
                      ]).map((r) => (
                        <div key={r.id} className="flex justify-between text-xs">
                          <span className="text-[#C4B3A7]">{r.name}</span>
                          <span className="text-[#FFB36B] font-bold">{r.weight}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[rgba(255,179,107,0.14)] flex items-center justify-between">
                  <span className="text-xs font-mono text-[#948277]">
                    {submissions.length} Peserta Terdaftar
                  </span>
                  <Link to="/judge/evaluations">
                    <Button variant="primary" className="text-xs flex items-center space-x-1.5">
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Evaluasi Karya</span>
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JudgeCompetitionsPage;
