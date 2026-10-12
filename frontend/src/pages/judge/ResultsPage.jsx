import React, { useMemo } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Trophy, 
  Scale, 
  Clock, 
  ExternalLink 
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import mockService from '../../services/mockService';
import PageHeader from '../../components/dashboard/PageHeader';
import DataTable from '../../components/dashboard/DataTable';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/dashboard/StatusBadge';

export const JudgeResultsPage = () => {
  const { user } = useAuth();
  const overview = useMemo(() => {
    return mockService.getJudgeOverview(user?.id || user?.email);
  }, [user?.id, user?.email]);

  const assignedCompIds = useMemo(() => {
    return overview.assignedCompetitions.map((c) => c.id);
  }, [overview.assignedCompetitions]);

  // Evaluated submissions by current judge
  const judgeEvals = useMemo(() => {
    return mockService.evaluations.filter(
      (e) => (e.judgeId === overview.judge?.id || e.judgeId === user?.id) && assignedCompIds.includes(e.competitionId)
    );
  }, [overview.judge?.id, user?.id, assignedCompIds]);

  const columns = [
    {
      header: 'Tim & Cabang Lomba',
      accessor: 'teamName',
      render: (row) => {
        const comp = overview.assignedCompetitions.find((c) => c.id === row.competitionId);
        return (
          <div>
            <span className="font-bold font-display text-[#FFF7F0] text-sm block">{row.teamName}</span>
            <span className="text-xs text-[#FFB36B] font-mono">{comp?.name || 'Kompetisi'}</span>
          </div>
        );
      },
    },
    {
      header: 'Judul Karya',
      accessor: 'submissionTitle',
      render: (row) => (
        <span className="text-xs text-[#C4B3A7] line-clamp-1">
          {row.submissionTitle || 'Karya Inovasi'}
        </span>
      ),
    },
    {
      header: 'Nilai Akhir (Tertimbang)',
      accessor: 'totalScore',
      render: (row) => (
        <div className="flex items-center space-x-1.5 font-mono">
          <span className="text-sm font-bold text-[#FF6A00]">{row.totalScore}</span>
          <span className="text-xs text-[#948277]">/ 100</span>
        </div>
      ),
    },
    {
      header: 'Status Penyerahan',
      accessor: 'status',
      render: (row) => (
        <StatusBadge
          status={row.status === 'submitted' ? 'approved' : 'pending'}
          label={row.status === 'submitted' ? 'Final Diserahkan' : 'Draft'}
        />
      ),
    },
    {
      header: 'Tanggal Evaluasi',
      accessor: 'updatedAt',
      render: (row) => (
        <span className="text-xs font-mono text-[#948277]">
          {new Date(row.updatedAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  const averageScore = useMemo(() => {
    const finalEvals = judgeEvals.filter((e) => e.status === 'submitted');
    if (finalEvals.length === 0) return 0;
    const total = finalEvals.reduce((acc, curr) => acc + curr.totalScore, 0);
    return (total / finalEvals.length).toFixed(1);
  }, [judgeEvals]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekapitulasi Nilai Dewan Juri"
        description="Ringkasan akumulasi penilaian karya yang telah Anda evaluasi secara objektif untuk penentuan juara."
        breadcrumbs={[
          { label: 'Juri', to: '/judge/dashboard' },
          { label: 'Rekap Nilai', to: '/judge/results' },
        ]}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Evaluasi Selesai"
          value={overview.completedEvaluations}
          change="Nilai terkunci"
          changeType="positive"
          icon={CheckCircle2}
        />
        <StatCard
          title="Menunggu Finalisasi"
          value={overview.pendingEvaluations}
          change="Belum diserahkan"
          changeType="neutral"
          icon={Clock}
        />
        <StatCard
          title="Rata-rata Skor Diberikan"
          value={averageScore}
          change="Skala 0 - 100"
          changeType="positive"
          icon={Scale}
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={judgeEvals}
        keyExtractor={(item) => item.id}
        emptyMessage="Belum ada evaluasi nilai yang tersimpan untuk penugasan Anda."
      />
    </div>
  );
};

export default JudgeResultsPage;
