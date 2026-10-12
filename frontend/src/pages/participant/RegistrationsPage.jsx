import React, { useState, useMemo } from 'react';
import { 
  FolderCheck, 
  Upload, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Users, 
  ExternalLink,
  FileCode,
  Link as LinkIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import mockService from '../../services/mockService';
import PageHeader from '../../components/dashboard/PageHeader';
import DataTable from '../../components/dashboard/DataTable';
import StatusBadge from '../../components/dashboard/StatusBadge';
import EmptyState from '../../components/dashboard/EmptyState';
import Button from '../../components/ui/Button';

export const ParticipantRegistrationsPage = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState(() => mockService.registrations);
  const [selectedReg, setSelectedReg] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Submission Form State
  const [submissionTitle, setSubmissionTitle] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState('');
  const [submissionError, setSubmissionError] = useState('');

  const myRegistrations = useMemo(() => {
    return registrations.filter(
      (r) => r.participantId === user?.id || r.participantEmail === user?.email
    );
  }, [registrations, user?.id, user?.email]);

  const handleOpenSubmission = (reg) => {
    setSelectedReg(reg);
    setSubmissionTitle(reg.submissionTitle || '');
    setSubmissionUrl(reg.submissionUrl || '');
    setSubmissionError('');
    setIsSubmitModalOpen(true);
  };

  const handleSaveSubmission = (e) => {
    e.preventDefault();
    if (!submissionTitle.trim()) {
      setSubmissionError('Judul karya inovasi wajib diisi.');
      return;
    }
    if (!submissionUrl.trim()) {
      setSubmissionError('Tautan repositori atau berkas Google Drive wajib diisi.');
      return;
    }

    const idx = mockService.registrations.findIndex((r) => r.id === selectedReg.id);
    if (idx !== -1) {
      mockService.registrations[idx] = {
        ...mockService.registrations[idx],
        submissionTitle: submissionTitle.trim(),
        submissionUrl: submissionUrl.trim(),
        submissionStatus: 'submitted',
      };
      mockService.activities.unshift({
        id: `act-${Date.now()}`,
        type: 'submission',
        description: `Tim ${selectedReg.teamName} mengumpulkan karya: "${submissionTitle.trim()}"`,
        timestamp: 'Baru saja',
      });
      mockService.saveState();
      setRegistrations([...mockService.registrations]);
      setIsSubmitModalOpen(false);
      setSubmissionSuccess('Karya Anda berhasil dikirimkan dan siap untuk proses kurasi penjurian!');
      setTimeout(() => setSubmissionSuccess(''), 6000);
    }
  };

  const columns = [
    {
      header: 'Cabang & Tim',
      accessor: 'competitionName',
      render: (row) => (
        <div>
          <span className="font-bold font-display text-[#FFF7F0] text-sm block">
            {row.competitionName}
          </span>
          <span className="text-xs text-[#FFB36B] font-mono">
            {row.teamName} ({row.teamMembers?.length || 1} Anggota)
          </span>
        </div>
      ),
    },
    {
      header: 'Status Berkas',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Karya / Submission',
      accessor: 'submissionStatus',
      render: (row) => {
        if (row.submissionTitle) {
          return (
            <div>
              <span className="text-xs text-[#FFF7F0] font-medium block truncate max-w-xs">
                {row.submissionTitle}
              </span>
              <a
                href={row.submissionUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-mono text-[#FF6A00] hover:underline flex items-center space-x-1"
              >
                <span>Tautan Karya</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          );
        }
        return (
          <span className="text-xs font-mono text-[#948277] italic">
            Belum Dikirim
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
          <button
            onClick={() => {
              setSelectedReg(row);
              setIsDetailOpen(true);
            }}
            title="Lihat Detail Tim"
            className="p-1.5 rounded-lg text-[#C4B3A7] hover:text-[#FFF7F0] hover:bg-[#2A1D15] transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <Button
            variant="primary"
            className="text-xs py-1.5 px-3 flex items-center space-x-1.5"
            onClick={() => handleOpenSubmission(row)}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{row.submissionTitle ? 'Ubah Karya' : 'Unggah Karya'}</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pendaftaran & Tim Saya"
        description="Kelola seluruh pendaftaran kompetisi aktif, status verifikasi administrasi, dan pengiriman tautan karya inovasi."
        breadcrumbs={[
          { label: 'Peserta', to: '/participant/dashboard' },
          { label: 'Pendaftaran Saya', to: '/participant/registrations' },
        ]}
      />

      {submissionSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center space-x-3 text-emerald-300 text-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{submissionSuccess}</span>
        </div>
      )}

      {myRegistrations.length === 0 ? (
        <EmptyState
          title="Belum Ada Pendaftaran Kompetisi"
          message="Anda belum terdaftar pada cabang perlombaan manapun. Jelajahi kompetisi yang tersedia dan daftarkan tim Anda sekarang."
          actionLabel="Daftar Cabang Lomba"
          onAction={() => window.location.assign('/participant/competitions')}
        />
      ) : (
        <DataTable
          columns={columns}
          data={myRegistrations}
          keyExtractor={(item) => item.id}
          emptyMessage="Tidak ada pendaftaran kompetisi."
        />
      )}

      {/* TEAM DETAIL MODAL */}
      {isDetailOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#17110D] border border-[rgba(255,179,107,0.2)] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="border-b border-[rgba(255,179,107,0.14)] pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#FFB36B] uppercase">DETAIL PENDAFTARAN</span>
                <h3 className="text-xl font-bold font-display text-[#FFF7F0]">{selectedReg.teamName}</h3>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-[#948277] hover:text-[#FFF7F0] p-1 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#1C1410] rounded-xl border border-[rgba(255,179,107,0.1)]">
                <span className="text-[#948277] block text-[10px]">CABANG LOMBA</span>
                <span className="text-[#FFF7F0] font-bold text-sm">{selectedReg.competitionName}</span>
              </div>

              <div>
                <span className="text-xs font-mono text-[#FFB36B] uppercase block mb-2">
                  Daftar Anggota Tim:
                </span>
                <div className="space-y-2">
                  {(selectedReg.teamMembers || []).map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#1C1410] rounded-xl border border-[rgba(255,179,107,0.1)] flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-[#FFF7F0] block">{m.name}</span>
                        <span className="text-[10px] font-mono text-[#948277]">NIM: {m.studentId || '-'}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2A1D15] text-[#FFB36B] border border-[rgba(255,179,107,0.14)]">
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSION MODAL */}
      {isSubmitModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#17110D] border border-[rgba(255,179,107,0.2)] rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-[rgba(255,179,107,0.14)] pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#FFB36B] uppercase">SUBMISSION KARYA INOVASI</span>
                <h3 className="text-xl font-bold font-display text-[#FFF7F0]">{selectedReg.teamName}</h3>
                <p className="text-xs text-[#948277]">{selectedReg.competitionName}</p>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-[#948277] hover:text-[#FFF7F0] p-1 text-lg"
              >
                ✕
              </button>
            </div>

            {submissionError && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl flex items-center space-x-2 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submissionError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSubmission} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                  Judul Proyek / Karya Inovasi *
                </label>
                <input
                  type="text"
                  value={submissionTitle}
                  onChange={(e) => setSubmissionTitle(e.target.value)}
                  placeholder="Contoh: MediConnect - Telemedisin Cerdas Berbasis AI"
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                  Tautan Karya (GitHub / Google Drive / Figma) *
                </label>
                <input
                  type="url"
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  placeholder="https://github.com/... atau https://drive.google.com/..."
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                />
                <span className="text-[11px] text-[#948277] block mt-1">
                  Pastikan akses Google Drive telah disetel menjadi "Anyone with the link can view".
                </span>
              </div>

              <div className="pt-4 border-t border-[rgba(255,179,107,0.14)] flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSubmitModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary">
                  Simpan & Kirim Karya
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantRegistrationsPage;
