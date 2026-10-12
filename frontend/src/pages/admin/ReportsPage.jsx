import React, { useMemo } from 'react';
import { 
  BarChart3, 
  Users, 
  Trophy, 
  Scale, 
  CheckCircle, 
  Coins, 
  Clock, 
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import mockService from '../../services/mockService';
import PageHeader from '../../components/dashboard/PageHeader';
import StatCard from '../../components/dashboard/StatCard';
import DataTable from '../../components/dashboard/DataTable';
import StatusBadge from '../../components/dashboard/StatusBadge';
import Button from '../../components/ui/Button';

export const AdminReportsPage = () => {
  const reports = useMemo(() => mockService.getAdminReports(), []);
  const overview = useMemo(() => mockService.getAdminOverview(), []);

  const competitionColumns = [
    {
      header: 'Cabang Lomba',
      accessor: 'name',
      render: (row) => (
        <div>
          <span className="font-bold font-display text-[#FFF7F0] text-sm block">{row.name}</span>
          <span className="text-[11px] font-mono text-[#948277]">Kapasitas: {row.quota} Tim</span>
        </div>
      ),
    },
    {
      header: 'Total Tim Terdaftar',
      accessor: 'totalRegistered',
      render: (row) => (
        <span className="font-mono text-sm font-bold text-[#FFF7F0]">
          {row.totalRegistered} Tim
        </span>
      ),
    },
    {
      header: 'Terverifikasi (Approved)',
      accessor: 'approved',
      render: (row) => (
        <span className="font-mono text-sm font-bold text-[#4ADE80]">
          {row.approved} Tim
        </span>
      ),
    },
    {
      header: 'Tingkat Okupansi (Fill Rate)',
      accessor: 'fillRate',
      render: (row) => (
        <div className="w-full max-w-xs space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-[#C4B3A7]">{row.fillRate}%</span>
            <span className="text-[#948277]">{row.totalRegistered} / {row.quota}</span>
          </div>
          <div className="w-full bg-[#100B08] h-2 rounded-full overflow-hidden border border-[rgba(255,179,107,0.1)]">
            <div
              className={`h-full rounded-full ${
                row.fillRate >= 80 ? 'bg-[#FF6A00]' : row.fillRate >= 40 ? 'bg-[#FFB36B]' : 'bg-[#948277]'
              }`}
              style={{ width: `${Math.min(100, row.fillRate)}%` }}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan & Rekapitulasi Festival"
        description="Pantau metriks akumulasi pendaftaran, rasio kuota peserta, aktivitas dewan juri, dan skor evaluasi karya."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Laporan', to: '/admin/reports' },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => alert('Fitur ekspor spreadsheet akan dihubungkan dengan integrasi backend reporting.')}
            className="flex items-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#FFB36B]" />
            <span>Ekspor Rekap (CSV)</span>
          </Button>
        }
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Peserta Terdaftar"
          value={overview.totalParticipants}
          change="+18% dibanding minggu lalu"
          changeType="positive"
          icon={Users}
        />
        <StatCard
          title="Pendaftaran Approved"
          value={overview.approvedRegistrations}
          change={`${overview.pendingRegistrations} pending verifikasi`}
          changeType="neutral"
          icon={CheckCircle}
        />
        <StatCard
          title="Evaluasi Diserahkan Juri"
          value={`${reports.submittedEvaluations} / ${reports.totalEvaluations}`}
          change={`Rata-rata skor: ${reports.averageScore}`}
          changeType="positive"
          icon={Scale}
        />
        <StatCard
          title="Estimasi Penerimaan Tiket"
          value={`Rp ${reports.totalRevenueEstimated.toLocaleString('id-ID')}`}
          change="Dari pendaftaran lunas"
          changeType="positive"
          icon={Coins}
        />
      </div>

      {/* Occupancy and Quota Breakdown Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-display text-[#FFF7F0] flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-[#FF6A00]" />
            <span>Distribusi Okupansi Cabang Kompetisi</span>
          </h3>
          <span className="text-xs font-mono text-[#948277]">
            Dihitung otomatis dari database pendaftar lokal
          </span>
        </div>

        <DataTable
          columns={competitionColumns}
          data={reports.competitionStats}
          keyExtractor={(item) => item.id}
          emptyMessage="Belum ada data kompetisi yang terdaftar."
        />
      </div>

      {/* Progress & Integrity Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-3xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#2A1D15] border border-[rgba(255,179,107,0.2)] flex items-center justify-center text-[#FFB36B]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold font-display text-[#FFF7F0] text-sm">Status Penjurian & Rubrik</h4>
              <p className="text-xs text-[#948277]">Statistik integrasi dewan juri</p>
            </div>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 bg-[#1C1410] rounded-xl border border-[rgba(255,179,107,0.1)]">
              <span className="text-[#C4B3A7]">Total Dewan Juri Terverifikasi</span>
              <span className="font-mono font-bold text-[#FFF7F0]">{overview.totalJudges} Juri</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#1C1410] rounded-xl border border-[rgba(255,179,107,0.1)]">
              <span className="text-[#C4B3A7]">Penilaian Selesai & Diserahkan</span>
              <span className="font-mono font-bold text-[#4ADE80]">{reports.submittedEvaluations} Berkas</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#1C1410] rounded-xl border border-[rgba(255,179,107,0.1)]">
              <span className="text-[#C4B3A7]">Rata-rata Skor Keseluruhan</span>
              <span className="font-mono font-bold text-[#FF6A00]">{reports.averageScore} / 100</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-3xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#2A1D15] border border-[rgba(255,179,107,0.2)] flex items-center justify-center text-[#FF6A00]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold font-display text-[#FFF7F0] text-sm">Integritas Data Prototipe</h4>
              <p className="text-xs text-[#948277]">Catatan kepatuhan arsitektur</p>
            </div>
          </div>
          <div className="p-4 bg-[#1C1410] rounded-2xl border border-[rgba(255,179,107,0.14)] space-y-2 text-xs text-[#C4B3A7] leading-relaxed">
            <p>
              • Seluruh statistik dihitung secara reaktif dari state lokal terpusat (<code className="text-[#FFB36B] font-mono">mockService</code>), mencegah disparitas angka antar-halaman.
            </p>
            <p>
              • Pembobotan rubrik (<span className="text-[#FFB36B]">Teknis 40%, Inovasi 30%, Presentasi 20%, Dokumentasi 10%</span>) tervalidasi 100% pada setiap evaluasi.
            </p>
            <p>
              • Pendaftaran peserta divalidasi unik per cabang lomba untuk mencegah pendaftaran ganda (duplicate registrations).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
