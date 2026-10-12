import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Building2, 
  Phone, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Save,
  ShieldCheck
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import mockService from '../../services/mockService';
import PageHeader from '../../components/dashboard/PageHeader';
import Button from '../../components/ui/Button';

export const ParticipantProfilePage = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    institution: user?.institution || '',
    studentId: user?.studentId || '',
  });

  const [errors, setErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState('');

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Nama lengkap wajib diisi';
    if (!formData.institution.trim()) errs.institution = 'Institusi / asal sekolah wajib diisi';
    if (!formData.studentId.trim()) errs.studentId = 'NIM / NISN wajib diisi';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      mockService.updateParticipantProfile(user?.id, formData);
      setSaveSuccess('Profil Anda berhasil diperbarui!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      setErrors({ submit: err.message || 'Gagal menyimpan profil.' });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Profil Peserta"
        description="Kelola informasi identitas akun peserta Anda untuk keperluan verifikasi sertifikat dan administrasi lomba."
        breadcrumbs={[
          { label: 'Peserta', to: '/participant/dashboard' },
          { label: 'Profil Saya', to: '/participant/profile' },
        ]}
      />

      {saveSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center space-x-3 text-emerald-300 text-xs">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {errors.submit && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl flex items-center space-x-3 text-red-300 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{errors.submit}</span>
        </div>
      )}

      <div className="bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-[rgba(255,179,107,0.14)]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF6A00] to-[#FFB36B] flex items-center justify-center text-white text-2xl font-bold font-display shadow-orange-glow">
            {formData.name.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-lg font-bold font-display text-[#FFF7F0]">{formData.name}</h3>
            <span className="text-xs font-mono text-[#FFB36B]">{formData.email}</span>
            <span className="text-[10px] font-mono block text-[#948277] uppercase mt-0.5">
              ROLE: PARTICIPANT (VERIFIED)
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
              />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                Email (ID Akun - Permanen)
              </label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="w-full bg-[#100B08] border border-[rgba(255,179,107,0.1)] rounded-xl px-4 py-2.5 text-sm text-[#948277] cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                Nomor NIM / NISN Siswa *
              </label>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder="2204010..."
                className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
              />
              {errors.studentId && <p className="text-xs text-red-400 mt-1">{errors.studentId}</p>}
            </div>

            <div>
              <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                Nomor WhatsApp Aktif
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08123456789"
                className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                Institusi / Universitas / Sekolah *
              </label>
              <input
                type="text"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="Universitas Swadaya Gunung Jati / SMAN 1 Cirebon"
                className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
              />
              {errors.institution && <p className="text-xs text-red-400 mt-1">{errors.institution}</p>}
            </div>
          </div>

          <div className="pt-4 border-t border-[rgba(255,179,107,0.14)] flex items-center justify-between">
            <span className="text-[11px] text-[#948277]">
              Pastikan data ejaan nama benar untuk pencetakan sertifikat resmi.
            </span>
            <Button type="submit" variant="primary" className="flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ParticipantProfilePage;
