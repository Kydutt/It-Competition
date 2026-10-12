import React from 'react';
import { Scale, Mail, Building2, BookOpen, ShieldCheck } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import mockService from '../../services/mockService';
import PageHeader from '../../components/dashboard/PageHeader';

export const JudgeProfilePage = () => {
  const { user } = useAuth();
  const overview = mockService.getJudgeOverview(user?.id || user?.email);
  const judge = overview.judge;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Profil Dewan Juri"
        description="Identitas dan kredensial akademik dewan juri kehormatan kompetisi."
        breadcrumbs={[
          { label: 'Juri', to: '/judge/dashboard' },
          { label: 'Profil Juri', to: '/judge/profile' },
        ]}
      />

      <div className="bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-[rgba(255,179,107,0.14)]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF6A00] to-[#FFB36B] flex items-center justify-center text-white text-2xl font-bold font-display shadow-orange-glow">
            {judge?.name?.charAt(0) || 'J'}
          </div>
          <div>
            <h3 className="text-lg font-bold font-display text-[#FFF7F0]">{judge?.name || user?.name}</h3>
            <span className="text-xs font-mono text-[#FFB36B]">{judge?.email || user?.email}</span>
            <span className="text-[10px] font-mono block text-[#948277] uppercase mt-0.5">
              ROLE: DEWAN JURI RESMI // CERTIFIED EVALUATOR
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 bg-[#1C1410] rounded-2xl border border-[rgba(255,179,107,0.1)]">
            <span className="text-[#948277] block text-[10px] uppercase">INSTITUSI / AFILIASI</span>
            <span className="text-[#FFF7F0] font-bold text-sm">{judge?.institution || 'Praktisi Industri'}</span>
          </div>
          <div className="p-4 bg-[#1C1410] rounded-2xl border border-[rgba(255,179,107,0.1)]">
            <span className="text-[#948277] block text-[10px] uppercase">BIDANG KEPAKARAN</span>
            <span className="text-[#FF6A00] font-bold text-sm">{judge?.specialization || 'Software Engineering'}</span>
          </div>
        </div>

        <div className="p-4 bg-[#1C1410] rounded-2xl border border-[rgba(255,179,107,0.14)] space-y-2">
          <span className="text-xs font-mono text-[#FFB36B] uppercase block">
            Cabang Perlombaan Dalam Wewenang Penjurian:
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {overview.assignedCompetitions.map((comp) => (
              <span
                key={comp.id}
                className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[#2A1D15] text-[#FFB36B] border border-[rgba(255,179,107,0.2)] font-semibold"
              >
                {comp.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JudgeProfilePage;
