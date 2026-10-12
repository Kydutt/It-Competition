import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Search, 
  Filter, 
  Users, 
  Coins, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import mockService from '../../services/mockService';
import PageHeader from '../../components/dashboard/PageHeader';
import SearchInput from '../../components/dashboard/SearchInput';
import FilterControl from '../../components/dashboard/FilterControl';
import StatusBadge from '../../components/dashboard/StatusBadge';
import EmptyState from '../../components/dashboard/EmptyState';
import Button from '../../components/ui/Button';

export const ParticipantCompetitionsPage = () => {
  const { user } = useAuth();
  const [competitions] = useState(() => mockService.competitions);
  const [registrations, setRegistrations] = useState(() => mockService.registrations);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Registration Modal State
  const [selectedComp, setSelectedComp] = useState(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState([
    { name: user?.name || '', role: 'Ketua Tim', studentId: user?.studentId || '' },
  ]);
  const [registrationError, setRegistrationError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState('');

  // Already registered competition IDs for current user
  const myRegisteredCompIds = useMemo(() => {
    return registrations
      .filter((r) => r.participantId === user?.id || r.participantEmail === user?.email)
      .map((r) => r.competitionId);
  }, [registrations, user?.id, user?.email]);

  const categoryOptions = [
    { value: 'all', label: 'Semua Kategori' },
    { value: 'ui_ux', label: 'UI/UX Design' },
    { value: 'web_dev', label: 'Web Development' },
    { value: 'mobile_dev', label: 'Mobile App' },
    { value: 'competitive_prog', label: 'Competitive Programming' },
    { value: 'data_science', label: 'Data Science' },
    { value: 'cyber_security', label: 'Cyber Security' },
  ];

  const filteredCompetitions = useMemo(() => {
    return competitions.filter((comp) => {
      const matchSearch =
        search === '' ||
        comp.name.toLowerCase().includes(search.toLowerCase()) ||
        comp.theme?.toLowerCase().includes(search.toLowerCase()) ||
        comp.category_label?.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        categoryFilter === 'all' ||
        comp.category === categoryFilter ||
        comp.id?.includes(categoryFilter);

      return matchSearch && matchCategory;
    });
  }, [competitions, search, categoryFilter]);

  const handleOpenRegister = (comp) => {
    setSelectedComp(comp);
    setTeamName(`${user?.name || 'Inovator'} Team`);
    setMembers([
      { name: user?.name || 'Ketua Tim', role: 'Ketua Tim', studentId: user?.studentId || '' },
    ]);
    setRegistrationError('');
    setIsRegisterModalOpen(true);
  };

  const handleAddMember = () => {
    if (selectedComp && members.length >= (selectedComp.max_team_member || 3)) {
      setRegistrationError(`Maksimal anggota untuk cabang ini adalah ${selectedComp.max_team_member} orang.`);
      return;
    }
    setMembers([
      ...members,
      { name: '', role: `Anggota ${members.length}`, studentId: '' },
    ]);
  };

  const handleRemoveMember = (idx) => {
    if (members.length <= 1) return;
    setMembers(members.filter((_, i) => i !== idx));
  };

  const handleMemberChange = (idx, field, val) => {
    const updated = [...members];
    updated[idx][field] = val;
    setMembers(updated);
  };

  const handleSubmitRegistration = (e) => {
    e.preventDefault();
    setRegistrationError('');

    if (!teamName.trim()) {
      setRegistrationError('Nama tim wajib diisi.');
      return;
    }

    for (let i = 0; i < members.length; i++) {
      if (!members[i].name.trim()) {
        setRegistrationError(`Nama pada baris ${i + 1} belum diisi.`);
        return;
      }
    }

    try {
      mockService.registerForCompetition(user, {
        competitionId: selectedComp.id,
        teamName,
        members,
      });

      setRegistrations([...mockService.registrations]);
      setRegistrationSuccess(`Berhasil mendaftar di cabang "${selectedComp.name}"! Status pendaftaran Anda kini menunggu verifikasi berkas.`);
      setIsRegisterModalOpen(false);
      setTimeout(() => setRegistrationSuccess(''), 6000);
    } catch (err) {
      setRegistrationError(err.message || 'Gagal mendaftar kompetisi.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Eksplorasi Cabang Kompetisi"
        description="Temukan cabang lomba inovasi teknologi bergengsi dan daftarkan tim Anda untuk memperebutkan total hadiah puluhan juta rupiah."
        breadcrumbs={[
          { label: 'Peserta', to: '/participant/dashboard' },
          { label: 'Cabang Kompetisi', to: '/participant/competitions' },
        ]}
      />

      {registrationSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center space-x-3 text-emerald-300 text-xs">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{registrationSuccess}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-2xl">
        <div className="md:col-span-8">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari cabang lomba berdasarkan nama atau tema inovasi..."
          />
        </div>
        <div className="md:col-span-4">
          <FilterControl
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categoryOptions}
          />
        </div>
      </div>

      {/* Competitions Grid */}
      {filteredCompetitions.length === 0 ? (
        <EmptyState
          title="Tidak Ada Cabang Kompetisi"
          message="Tidak ditemukan cabang lomba dengan kriteria pencarian yang Anda masukkan."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompetitions.map((comp) => {
            const isRegistered = myRegisteredCompIds.includes(comp.id);
            return (
              <div
                key={comp.id}
                className="bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-[#FF6A00]/40 hover:shadow-orange-glow transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#2A1D15] text-[#FFB36B] border border-[rgba(255,179,107,0.2)] font-semibold">
                      {comp.category_label || comp.category}
                    </span>
                    <StatusBadge status={comp.status} label={comp.status_label} />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold font-display text-[#FFF7F0] group-hover:text-[#FF6A00] transition-colors">
                      {comp.name}
                    </h3>
                    <p className="text-xs text-[#FFB36B] font-mono mt-0.5 line-clamp-1">
                      {comp.theme}
                    </p>
                  </div>

                  <p className="text-xs text-[#C4B3A7] line-clamp-2 leading-relaxed">
                    {comp.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono">
                    <div className="p-2.5 bg-[#1C1410] rounded-xl border border-[rgba(255,179,107,0.1)]">
                      <span className="text-[#948277] text-[10px] block">TOTAL HADIAH</span>
                      <span className="text-[#FF6A00] font-bold">{comp.prizePool}</span>
                    </div>
                    <div className="p-2.5 bg-[#1C1410] rounded-xl border border-[rgba(255,179,107,0.1)]">
                      <span className="text-[#948277] text-[10px] block">FORMAT TIM</span>
                      <span className="text-[#FFF7F0] font-bold">
                        {comp.min_team_member === comp.max_team_member
                          ? `${comp.min_team_member} Orang`
                          : `${comp.min_team_member}-${comp.max_team_member} Orang`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[rgba(255,179,107,0.14)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#948277]">Biaya:</span>
                    <span className="text-[#FFF7F0] font-bold">
                      {comp.registration_fee > 0
                        ? `Rp ${comp.registration_fee.toLocaleString('id-ID')}`
                        : 'Gratis'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="text-xs py-2 w-full"
                      onClick={() => {
                        setSelectedComp(comp);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      Detail
                    </Button>

                    {isRegistered ? (
                      <button
                        disabled
                        className="w-full py-2 px-3 rounded-xl bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono cursor-not-allowed flex items-center justify-center space-x-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Terdaftar</span>
                      </button>
                    ) : (
                      <Button
                        variant="primary"
                        className="text-xs py-2 w-full"
                        onClick={() => handleOpenRegister(comp)}
                      >
                        Daftar Lomba
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailModalOpen && selectedComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#17110D] border border-[rgba(255,179,107,0.2)] rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="border-b border-[rgba(255,179,107,0.14)] pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#FFB36B] uppercase">SPESIFIKASI LOMBA</span>
                <h3 className="text-xl font-bold font-display text-[#FFF7F0]">{selectedComp.name}</h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-[#948277] hover:text-[#FFF7F0] p-1 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[#1C1410] rounded-2xl border border-[rgba(255,179,107,0.14)] space-y-1">
                <span className="font-mono text-[#FFB36B] uppercase text-[10px]">Tema Spesifik:</span>
                <p className="font-bold text-[#FFF7F0] text-sm">{selectedComp.theme}</p>
                <p className="text-[#C4B3A7] leading-relaxed pt-1">{selectedComp.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-3 bg-[#1C1410] rounded-xl border border-[rgba(255,179,107,0.1)]">
                  <span className="text-[#948277] block">ELIGIBILITY</span>
                  <span className="text-[#FFF7F0] font-bold">{selectedComp.target_level_label || 'Mahasiswa & Pelajar'}</span>
                </div>
                <div className="p-3 bg-[#1C1410] rounded-xl border border-[rgba(255,179,107,0.1)]">
                  <span className="text-[#948277] block">KUOTA TIM</span>
                  <span className="text-[#FF6A00] font-bold">{selectedComp.quota} Tim</span>
                </div>
              </div>

              <div className="p-4 bg-[#1C1410] rounded-2xl border border-[rgba(255,179,107,0.14)] space-y-2">
                <span className="font-mono text-[#FFB36B] uppercase text-[10px]">Rubrik Penilaian:</span>
                <div className="space-y-1.5">
                  {(selectedComp.rubric || [
                    { id: 'crit-1', name: 'Kualitas Teknis', weight: 40 },
                    { id: 'crit-2', name: 'Inovasi', weight: 30 },
                    { id: 'crit-3', name: 'Presentasi', weight: 20 },
                    { id: 'crit-4', name: 'Dokumentasi', weight: 10 },
                  ]).map((rub) => (
                    <div key={rub.id} className="flex justify-between items-center text-xs">
                      <span className="text-[#C4B3A7]">{rub.name}</span>
                      <span className="font-mono text-[#FFB36B] font-bold">{rub.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                Tutup
              </Button>
              {!myRegisteredCompIds.includes(selectedComp.id) && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenRegister(selectedComp);
                  }}
                >
                  Daftar Sekarang
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REGISTRATION FORM MODAL */}
      {isRegisterModalOpen && selectedComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#17110D] border border-[rgba(255,179,107,0.2)] rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 my-8 shadow-2xl">
            <div className="border-b border-[rgba(255,179,107,0.14)] pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#FFB36B] uppercase">FORMULIR PENDAFTARAN LOMBA</span>
                <h3 className="text-xl font-bold font-display text-[#FFF7F0]">{selectedComp.name}</h3>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-[#948277] hover:text-[#FFF7F0] p-1 text-lg"
              >
                ✕
              </button>
            </div>

            {registrationError && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl flex items-center space-x-2 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{registrationError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRegistration} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                  Nama Tim *
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Contoh: Quantum Cipher"
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono text-[#FFB36B] uppercase tracking-wider">
                    Anggota Tim ({members.length}/{selectedComp.max_team_member || 3})
                  </label>
                  {members.length < (selectedComp.max_team_member || 3) && (
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="text-xs text-[#FF6A00] hover:underline flex items-center space-x-1 font-mono"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Anggota</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                  {members.map((member, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#1C1410] border border-[rgba(255,179,107,0.14)] rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-[#FFB36B]">
                          {idx === 0 ? 'Ketua Tim (Anda)' : `Anggota ${idx + 1}`}
                        </span>
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(idx)}
                            className="text-red-400 hover:text-red-300 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                          placeholder="Nama Anggota"
                          className="bg-[#100B08] border border-[rgba(255,179,107,0.18)] rounded-lg px-2.5 py-1.5 text-xs text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                        />
                        <input
                          type="text"
                          value={member.studentId}
                          onChange={(e) => handleMemberChange(idx, 'studentId', e.target.value)}
                          placeholder="NIM / ID Siswa"
                          className="bg-[#100B08] border border-[rgba(255,179,107,0.18)] rounded-lg px-2.5 py-1.5 text-xs text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#1C1410] border border-[rgba(255,179,107,0.14)] rounded-xl text-xs text-[#948277]">
                <p className="leading-relaxed">
                  Pendaftaran ini akan diverifikasi oleh panitia. Pastikan data seluruh anggota telah sesuai dengan kartu identitas mahasiswa/pelajar.
                </p>
              </div>

              <div className="pt-4 border-t border-[rgba(255,179,107,0.14)] flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRegisterModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary">
                  Konfirmasi Pendaftaran
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantCompetitionsPage;
