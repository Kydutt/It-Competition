import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { participantService } from '../../services/participantService';
import { User, Mail, Phone, School, Award, CreditCard, MapPin, Camera, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [identityNumber, setIdentityNumber] = useState('');
  const [address, setAddress] = useState('');

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.profile?.phone || '');
      setInstitution(user.profile?.institution || '');
      setEducationLevel(user.profile?.education_level || '');
      setIdentityNumber(user.profile?.identity_number || '');
      setAddress(user.profile?.address || '');
      setAvatarPreview(user.profile?.profile_photo_url || null);
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    setAvatarLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      const res = await participantService.uploadAvatar(formData);
      await refreshUser();
      setAvatarPreview(res.data?.profile_photo_url || avatarPreview);
      setAvatarFile(null);
      setSuccess('Foto profil berhasil diperbarui.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengunggah foto profil.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await participantService.updateProfile({
        name,
        phone,
        institution,
        education_level: educationLevel,
        identity_number: identityNumber,
        address,
      });
      await refreshUser();
      setSuccess('Profil berhasil disimpan.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-sm text-gray-500">Kelola informasi pribadi dan data akademik Anda untuk keperluan kompetisi.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center space-x-3 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Kiri: Avatar & Info Akun */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-md flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-gray-400" />
              )}
            </div>
            <label className="absolute bottom-1 right-1 p-2 bg-[#F47B20] text-white rounded-full cursor-pointer hover:bg-[#e06d18] shadow-md transition-transform hover:scale-105">
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 text-lg">{user?.name}</h3>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#1769AA] border border-blue-100 uppercase">
              Peserta
            </span>
          </div>

          {avatarFile && (
            <button
              onClick={handleUploadAvatar}
              disabled={avatarLoading}
              className="w-full py-2 bg-[#F47B20] hover:bg-[#e06d18] text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {avatarLoading ? 'Mengunggah...' : 'Simpan Foto Baru'}
            </button>
          )}

          <div className="w-full pt-4 border-t border-gray-100 text-left text-xs space-y-2 text-gray-500">
            <div className="flex justify-between">
              <span>Status Akun:</span>
              <span className="font-semibold text-emerald-600">Aktif</span>
            </div>
            <div className="flex justify-between">
              <span>Tipe Akun:</span>
              <span className="font-semibold text-gray-700">Individual / Team Rep</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Form Data Diri */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Lengkap</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47B20] focus:border-transparent"
                    placeholder="Nama lengkap peserta"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email (Akun)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nomor WhatsApp / HP</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47B20] focus:border-transparent"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Institusi / Sekolah / Universitas</label>
                <div className="relative">
                  <School className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47B20] focus:border-transparent"
                    placeholder="Contoh: Universitas Indonesia"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Jenjang Pendidikan</label>
                <div className="relative">
                  <Award className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47B20] focus:border-transparent bg-white"
                  >
                    <option value="">Pilih Jenjang</option>
                    <option value="SMA/SMK">SMA / SMK / MA Sederajat</option>
                    <option value="D3/D4">Diploma (D3 / D4)</option>
                    <option value="S1">Sarjana (S1)</option>
                    <option value="Umum">Umum / Profesional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nomor Identitas (NISN / NIM / KTP)</label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={identityNumber}
                    onChange={(e) => setIdentityNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47B20] focus:border-transparent"
                    placeholder="Nomor identitas resmi"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Alamat Lengkap</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47B20] focus:border-transparent"
                  placeholder="Alamat domisili lengkap peserta..."
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2.5 bg-[#F47B20] hover:bg-[#e06d18] text-white text-sm font-semibold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
