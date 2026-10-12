import React, { useState, useMemo } from 'react';
import { Check, X, Eye, Users, Search, Filter } from 'lucide-react';
import mockService from '../../services/mockService';
import PageHeader from '../../components/dashboard/PageHeader';
import DataTable from '../../components/dashboard/DataTable';
import SearchInput from '../../components/dashboard/SearchInput';
import FilterControl from '../../components/dashboard/FilterControl';
import StatusBadge from '../../components/dashboard/StatusBadge';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import Button from '../../components/ui/Button';

export const AdminParticipantsPage = () => {
  const [registrations, setRegistrations] = useState(() => mockService.registrations);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReg, setSelectedReg] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, regId: null, action: null });

  // Filtered registrations
  const filteredData = useMemo(() => {
    return registrations.filter((reg) => {
      const matchSearch =
        search === '' ||
        reg.participantName.toLowerCase().includes(search.toLowerCase()) ||
        reg.participantEmail.toLowerCase().includes(search.toLowerCase()) ||
        reg.teamName.toLowerCase().includes(search.toLowerCase()) ||
        reg.competitionName.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' || reg.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [registrations, search, statusFilter]);

  const handleActionConfirm = () => {
    const { regId, action } = confirmDialog;
    if (!regId || !action) return;

    const updated = mockService.updateRegistrationStatus(regId, action);
    setRegistrations([...mockService.registrations]);
    setConfirmDialog({ isOpen: false, regId: null, action: null });

    if (selectedReg && selectedReg.id === regId) {
      setSelectedReg({ ...updated });
    }
  };

  const columns = [
    {
      header: 'Tim & Ketua',
      accessor: 'teamName',
      render: (row) => (
        <div>
          <p className="font-bold font-display text-[#FFF7F0] text-sm">{row.teamName}</p>
          <p className="text-xs text-[#948277]">{row.participantName} • {row.participantInstitution}</p>
        </div>
      ),
    },
    {
      header: 'Cabang Lomba',
      accessor: 'competitionName',
      render: (row) => (
        <span className="font-medium text-[#FFB36B] text-xs sm:text-sm">
          {row.competitionName}
        </span>
      ),
    },
    {
      header: 'Anggota',
      accessor: 'teamMembers',
      render: (row) => (
        <span className="font-mono text-xs text-[#C4B3A7]">
          {row.teamMembers?.length || 1} Peserta
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Aksi Tindakan',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setSelectedReg(row);
              setDetailModalOpen(true);
            }}
            className="p-1.5 rounded-lg bg-[#211811] hover:bg-[#FF6A00]/20 text-[#FFB36B] border border-[rgba(255,179,107,0.2)] text-xs font-semibold transition-colors"
            title="Lihat Detail"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status === 'pending' && (
            <>
              <button
                onClick={() =>
                  setConfirmDialog({
                    isOpen: true,
                    regId: row.id,
                    action: 'approved',
                    title: `Setujui Pendaftaran ${row.teamName}`,
                    message: `Apakah Anda yakin ingin menyetujui pendaftaran tim "${row.teamName}" untuk cabang "${row.competitionName}"?`,
                  })
                }
                className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-800/60 transition-colors"
                title="Setujui"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setConfirmDialog({
                    isOpen: true,
                    regId: row.id,
                    action: 'rejected',
                    title: `Tolak Pendaftaran ${row.teamName}`,
                    message: `Apakah Anda yakin ingin menolak berkas pendaftaran tim "${row.teamName}"?`,
                  })
                }
                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-400 border border-rose-800/60 transition-colors"
                title="Tolak"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        badge="// ADMIN // PARTICIPANTS"
        title="Manajemen Peserta & Pendaftaran"
        description="Verifikasi dokumen administrasi peserta, persetujuan cabang lomba, dan pengawasan status keikutsertaan tim."
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <FilterControl
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Semua Status', value: 'all' },
            { label: 'Menunggu', value: 'pending' },
            { label: 'Disetujui', value: 'approved' },
            { label: 'Ditolak', value: 'rejected' },
          ]}
        />

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari nama, email, tim, lomba..."
          className="w-full md:w-80"
        />
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        keyField="id"
        emptyTitle="Tidak Ada Pendaftaran Ditemukan"
        emptyDescription="Tidak ada data pendaftaran yang cocok dengan filter atau kata kunci pencarian Anda."
      />

      {/* Detail Modal */}
      {detailModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1C1410] border border-[rgba(255,179,107,0.25)] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative">
            <button
              onClick={() => setDetailModalOpen(false)}
              className="absolute top-5 right-5 text-[#948277] hover:text-[#FFF7F0]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#FFB36B] uppercase">DETAIL PENDAFTARAN</span>
              <h3 className="text-xl font-bold font-display text-[#FFF7F0]">
                {selectedReg.teamName}
              </h3>
              <p className="text-xs text-[#948277] font-mono">{selectedReg.competitionName}</p>
            </div>

            <div className="space-y-3 bg-[#211811] p-4 rounded-2xl border border-[rgba(255,179,107,0.12)] text-xs">
              <div className="flex justify-between py-1 border-b border-[rgba(255,179,107,0.08)]">
                <span className="text-[#948277]">Ketua Tim:</span>
                <span className="font-semibold text-[#FFF7F0]">{selectedReg.participantName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[rgba(255,179,107,0.08)]">
                <span className="text-[#948277]">Email Ketua:</span>
                <span className="font-mono text-[#FFB36B]">{selectedReg.participantEmail}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[rgba(255,179,107,0.08)]">
                <span className="text-[#948277]">Institusi / Kampus:</span>
                <span className="text-[#FFF7F0]">{selectedReg.participantInstitution}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[rgba(255,179,107,0.08)]">
                <span className="text-[#948277]">Status Verifikasi:</span>
                <StatusBadge status={selectedReg.status} />
              </div>
            </div>

            {/* Team Members List */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase text-[#FFB36B]">Anggota Tim:</h4>
              <div className="space-y-1.5">
                {selectedReg.teamMembers?.map((m, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-[#211811] border border-[rgba(255,179,107,0.1)] flex items-center justify-between text-xs">
                    <span className="font-medium text-[#FFF7F0]">{m.name}</span>
                    <span className="font-mono text-[11px] text-[#948277]">{m.role} • {m.studentId}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions in Modal */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgba(255,179,107,0.1)]">
              {selectedReg.status === 'pending' && (
                <>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setDetailModalOpen(false);
                      setConfirmDialog({
                        isOpen: true,
                        regId: selectedReg.id,
                        action: 'rejected',
                        title: `Tolak Pendaftaran ${selectedReg.teamName}`,
                        message: 'Tolak pendaftaran berkas tim ini?',
                      });
                    }}
                  >
                    Tolak Pendaftaran
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setDetailModalOpen(false);
                      setConfirmDialog({
                        isOpen: true,
                        regId: selectedReg.id,
                        action: 'approved',
                        title: `Setujui Pendaftaran ${selectedReg.teamName}`,
                        message: 'Setujui pendaftaran berkas tim ini?',
                      });
                    }}
                  >
                    Setujui Pendaftaran
                  </Button>
                </>
              )}
              <Button variant="secondary" size="sm" onClick={() => setDetailModalOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={handleActionConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, regId: null, action: null })}
      />
    </div>
  );
};

export default AdminParticipantsPage;
