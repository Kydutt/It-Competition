import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  ExternalLink, 
  Eye, 
  Save, 
  Send, 
  Lock, 
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileText
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import mockService from '../../services/mockService';
import PageHeader from '../../components/dashboard/PageHeader';
import DataTable from '../../components/dashboard/DataTable';
import SearchInput from '../../components/dashboard/SearchInput';
import FilterControl from '../../components/dashboard/FilterControl';
import StatusBadge from '../../components/dashboard/StatusBadge';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import Button from '../../components/ui/Button';

export const JudgeEvaluationsPage = () => {
  const { user } = useAuth();
  const overview = useMemo(() => {
    return mockService.getJudgeOverview(user?.id || user?.email);
  }, [user?.id, user?.email]);

  const [evaluations, setEvaluations] = useState(() => mockService.evaluations);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Scoring Modal State
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isScoringOpen, setIsScoringOpen] = useState(false);
  const [scores, setScores] = useState({
    'crit-1': 80,
    'crit-2': 75,
    'crit-3': 85,
    'crit-4': 70,
  });
  const [feedback, setFeedback] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Assigned competition IDs
  const assignedCompIds = useMemo(() => {
    return overview.assignedCompetitions.map((c) => c.id);
  }, [overview.assignedCompetitions]);

  // Assigned approved submissions
  const assignedSubmissions = useMemo(() => {
    return mockService.registrations.filter(
      (r) => assignedCompIds.includes(r.competitionId) && r.status === 'approved'
    );
  }, [assignedCompIds]);

  const filterOptions = [
    { value: 'all', label: 'Semua Status Evaluasi' },
    { value: 'pending', label: 'Belum Dinilai' },
    { value: 'draft', label: 'Draft Tersimpan' },
    { value: 'submitted', label: 'Final Diserahkan' },
  ];

  // Map each submission to its evaluation status
  const submissionsWithEval = useMemo(() => {
    return assignedSubmissions.map((sub) => {
      const existingEval = evaluations.find(
        (e) => e.registrationId === sub.id && (e.judgeId === overview.judge?.id || e.judgeId === user?.id)
      );
      return {
        ...sub,
        evaluation: existingEval || null,
        evalStatus: existingEval ? existingEval.status : 'pending',
        totalScore: existingEval ? existingEval.totalScore : null,
      };
    });
  }, [assignedSubmissions, evaluations, overview.judge?.id, user?.id]);

  const filteredData = useMemo(() => {
    return submissionsWithEval.filter((item) => {
      const matchSearch =
        search === '' ||
        item.teamName.toLowerCase().includes(search.toLowerCase()) ||
        item.competitionName.toLowerCase().includes(search.toLowerCase()) ||
        item.participantName.toLowerCase().includes(search.toLowerCase()) ||
        item.submissionTitle?.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' || item.evalStatus === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [submissionsWithEval, search, statusFilter]);

  // Open scoring modal
  const handleOpenScoring = (item) => {
    setSelectedSubmission(item);
    if (item.evaluation) {
      setScores(item.evaluation.scores || { 'crit-1': 80, 'crit-2': 80, 'crit-3': 80, 'crit-4': 80 });
      setFeedback(item.evaluation.feedback || '');
    } else {
      setScores({ 'crit-1': 75, 'crit-2': 75, 'crit-3': 75, 'crit-4': 75 });
      setFeedback('');
    }
    setIsScoringOpen(true);
  };

  // Rubric for current competition
  const currentRubric = useMemo(() => {
    if (!selectedSubmission) return [];
    const comp = overview.assignedCompetitions.find((c) => c.id === selectedSubmission.competitionId);
    return comp?.rubric || [
      { id: 'crit-1', name: 'Kualitas Teknis', weight: 40 },
      { id: 'crit-2', name: 'Inovasi & Kreativitas', weight: 30 },
      { id: 'crit-3', name: 'Presentasi & Demo', weight: 20 },
      { id: 'crit-4', name: 'Kelengkapan Dokumentasi', weight: 10 },
    ];
  }, [selectedSubmission, overview.assignedCompetitions]);

  // Live weighted total calculation
  const calculatedTotal = useMemo(() => {
    let sum = 0;
    currentRubric.forEach((crit) => {
      const val = Number(scores[crit.id]) || 0;
      const clamped = Math.max(0, Math.min(100, val));
      sum += (clamped * crit.weight) / 100;
    });
    return Number(sum.toFixed(2));
  }, [currentRubric, scores]);

  const handleScoreChange = (critId, val) => {
    // Clamping score between 0 and 100
    const num = Math.max(0, Math.min(100, Number(val) || 0));
    setScores((prev) => ({
      ...prev,
      [critId]: num,
    }));
  };

  const handleSaveDraft = () => {
    if (!selectedSubmission) return;
    mockService.saveJudgeEvaluation({
      judgeId: overview.judge?.id || user?.id,
      registrationId: selectedSubmission.id,
      scores,
      feedback,
      status: 'draft',
    });
    setEvaluations([...mockService.evaluations]);
    setIsScoringOpen(false);
    setActionSuccess(`Draft penilaian untuk tim "${selectedSubmission.teamName}" berhasil disimpan.`);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const handleFinalSubmit = () => {
    if (!selectedSubmission) return;
    mockService.saveJudgeEvaluation({
      judgeId: overview.judge?.id || user?.id,
      registrationId: selectedSubmission.id,
      scores,
      feedback,
      status: 'submitted',
    });
    setEvaluations([...mockService.evaluations]);
    setConfirmSubmit(false);
    setIsScoringOpen(false);
    setActionSuccess(`Penilaian final untuk tim "${selectedSubmission.teamName}" berhasil dikunci dan diserahkan!`);
    setTimeout(() => setActionSuccess(''), 5000);
  };

  const isLocked = selectedSubmission?.evalStatus === 'submitted';

  const columns = [
    {
      header: 'Tim & Cabang Lomba',
      accessor: 'teamName',
      render: (row) => (
        <div>
          <span className="font-bold font-display text-[#FFF7F0] text-sm block">{row.teamName}</span>
          <span className="text-xs text-[#FFB36B] font-mono">{row.competitionName}</span>
          <p className="text-[11px] text-[#948277]">{row.participantInstitution}</p>
        </div>
      ),
    },
    {
      header: 'Karya / Submission',
      accessor: 'submissionTitle',
      render: (row) => (
        <div>
          <span className="text-xs text-[#FFF7F0] font-medium block truncate max-w-xs">
            {row.submissionTitle || 'Karya Inovasi Digital'}
          </span>
          {row.submissionUrl && (
            <a
              href={row.submissionUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-mono text-[#FF6A00] hover:underline flex items-center space-x-1"
            >
              <span>Buka Tautan Karya</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      ),
    },
    {
      header: 'Status Penilaian',
      accessor: 'evalStatus',
      render: (row) => {
        if (row.evalStatus === 'submitted') {
          return (
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 w-max">
              <CheckCircle2 className="w-3 h-3" />
              <span>Final ({row.totalScore})</span>
            </span>
          );
        }
        if (row.evalStatus === 'draft') {
          return (
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-amber-950/40 text-[#FFB36B] border border-[#FFB36B]/30 flex items-center space-x-1 w-max">
              <span>Draft ({row.totalScore})</span>
            </span>
          );
        }
        return (
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[#1C1410] text-[#948277] border border-[rgba(255,179,107,0.14)] w-max block">
            Belum Dinilai
          </span>
        );
      },
    },
    {
      header: 'Aksi',
      accessor: 'id',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-2">
          {row.evalStatus === 'submitted' ? (
            <Button
              variant="outline"
              className="text-xs py-1.5 px-3 flex items-center space-x-1"
              onClick={() => handleOpenScoring(row)}
            >
              <Lock className="w-3.5 h-3.5 text-[#948277]" />
              <span>Lihat Nilai</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              className="text-xs py-1.5 px-3 flex items-center space-x-1"
              onClick={() => handleOpenScoring(row)}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{row.evalStatus === 'draft' ? 'Lanjutkan Skor' : 'Nilai Karya'}</span>
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evaluasi & Skoring Karya"
        description="Lakukan penilaian terhadap berkas dan demo inovasi peserta berdasarkan parameter bobot rubrik yang telah ditetapkan."
        breadcrumbs={[
          { label: 'Juri', to: '/judge/dashboard' },
          { label: 'Evaluasi Karya', to: '/judge/evaluations' },
        ]}
      />

      {actionSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center space-x-3 text-emerald-300 text-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-2xl">
        <div className="md:col-span-8">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari tim, judul karya, atau nama ketua tim..."
          />
        </div>
        <div className="md:col-span-4">
          <FilterControl
            value={statusFilter}
            onChange={setStatusFilter}
            options={filterOptions}
          />
        </div>
      </div>

      {/* Evaluations Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        keyExtractor={(item) => item.id}
        emptyMessage="Tidak ada karya peserta yang ditugaskan kepada Anda sesuai kriteria pencarian."
      />

      {/* SCORING INTERFACE MODAL */}
      {isScoringOpen && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#17110D] border border-[rgba(255,179,107,0.2)] rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 my-8 shadow-2xl">
            {/* Modal Header */}
            <div className="border-b border-[rgba(255,179,107,0.14)] pb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-[#FFB36B] uppercase">RUBRIK PENILAIAN RESMI</span>
                  {isLocked && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                      TERKUNCI / SUBMITTED
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold font-display text-[#FFF7F0]">
                  {selectedSubmission.teamName}
                </h3>
                <p className="text-xs text-[#948277]">
                  {selectedSubmission.competitionName} • {selectedSubmission.participantInstitution}
                </p>
              </div>
              <button
                onClick={() => setIsScoringOpen(false)}
                className="text-[#948277] hover:text-[#FFF7F0] p-1 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Submission preview banner */}
            <div className="p-4 bg-[#1C1410] rounded-2xl border border-[rgba(255,179,107,0.14)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#948277] uppercase block">Judul Karya Inovasi:</span>
                <p className="text-sm font-bold text-[#FFF7F0]">{selectedSubmission.submissionTitle || 'Karya Inovasi Peserta'}</p>
              </div>
              {selectedSubmission.submissionUrl && (
                <a
                  href={selectedSubmission.submissionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[#2A1D15] text-[#FF6A00] border border-[#FF6A00]/30 text-xs font-mono hover:bg-[#FF6A00]/10 flex items-center space-x-1"
                >
                  <span>Buka Berkas</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Rubric Inputs */}
            <div className="space-y-4">
              <span className="text-xs font-mono text-[#FFB36B] uppercase block">
                Parameter Penilaian (Rentang Skor 0 - 100):
              </span>

              <div className="space-y-3">
                {currentRubric.map((crit) => (
                  <div
                    key={crit.id}
                    className="p-4 bg-[#1C1410] rounded-2xl border border-[rgba(255,179,107,0.12)] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-[#FFF7F0] block">{crit.name}</span>
                        <span className="text-[11px] font-mono text-[#948277]">
                          Bobot Kontribusi: <strong className="text-[#FFB36B]">{crit.weight}%</strong>
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          disabled={isLocked}
                          value={scores[crit.id] ?? 0}
                          onChange={(e) => handleScoreChange(crit.id, e.target.value)}
                          className="w-20 bg-[#100B08] border border-[rgba(255,179,107,0.25)] rounded-xl px-3 py-1.5 text-center font-mono font-bold text-sm text-[#FF6A00] focus:outline-none focus:border-[#FF6A00] disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        <span className="text-xs font-mono text-[#948277]">/ 100</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Weighted Total Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#2A1D15] to-[#1C1410] border border-[#FF6A00]/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-[#FFB36B] uppercase block">
                    TOTAL NILAI TERTIMBANG (WEIGHTED TOTAL)
                  </span>
                  <span className="text-[11px] text-[#948277]">
                    Kalkulasi live berdasarkan total bobot 100%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black font-mono text-[#FF6A00]">
                    {calculatedTotal}
                  </span>
                  <span className="text-xs font-mono text-[#948277]"> / 100</span>
                </div>
              </div>

              {/* Comments / Feedback */}
              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                  Catatan Evaluasi / Ulasan Dewan Juri
                </label>
                <textarea
                  rows={3}
                  disabled={isLocked}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Berikan masukan konstruktif mengenai aspek teknis, kebaruan ide, atau implementasi..."
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00] disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[rgba(255,179,107,0.14)] flex items-center justify-between">
              <Button variant="outline" onClick={() => setIsScoringOpen(false)}>
                Tutup
              </Button>

              {!isLocked && (
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    className="flex items-center space-x-1.5"
                    onClick={handleSaveDraft}
                  >
                    <Save className="w-4 h-4 text-[#FFB36B]" />
                    <span>Simpan Draft</span>
                  </Button>
                  <Button
                    variant="primary"
                    className="flex items-center space-x-1.5"
                    onClick={() => setConfirmSubmit(true)}
                  >
                    <Send className="w-4 h-4" />
                    <span>Serahkan Nilai Final</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION SUBMIT DIALOG */}
      <ConfirmDialog
        isOpen={confirmSubmit}
        title="Kunci & Serahkan Nilai Final?"
        message={`Nilai akhir sebesar ${calculatedTotal} untuk "${selectedSubmission?.teamName}" akan dikunci dan dikirimkan ke panitia. Anda tidak dapat mengubah nilai ini setelah diserahkan.`}
        confirmLabel="Ya, Kunci & Serahkan"
        cancelLabel="Kembali Periksa"
        variant="primary"
        onConfirm={handleFinalSubmit}
        onCancel={() => setConfirmSubmit(false)}
      />
    </div>
  );
};

export default JudgeEvaluationsPage;
