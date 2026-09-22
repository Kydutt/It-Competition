import React, { useState, useEffect } from 'react';
import competitionService from '../../services/competitionService';

export const FaqPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await competitionService.getFaqs();
        if (res.success && res.data) {
          setFaqs(res.data);
        }
      } catch (err) {
        console.error('Failed to load FAQs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <div className="text-center max-w-xl mx-auto space-y-3">
        <h1 className="text-4xl font-black text-gray-950 tracking-tight">Tanya Jawab (FAQ)</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Pertanyaan yang sering diajukan seputar pendaftaran, ketentuan tim, dan mekanisme lomba.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat FAQ...</p>
        </div>
      ) : faqs.length === 0 ? (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
            <h3 className="text-base font-bold text-gray-900">Siapa saja yang boleh mengikuti kompetisi ini?</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Mahasiswa aktif perguruan tinggi serta siswa aktif SMA/SMK/Sederajat yang berdomisili atau bersekolah di wilayah Ciayumajakuning (Cirebon, Indramayu, Majalengka, Kuningan).
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
            <h3 className="text-base font-bold text-gray-900">Apakah anggota tim boleh berasal dari instansi yang berbeda?</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Untuk kategori Mahasiswa dan Siswa, seluruh anggota dalam satu tim wajib berasal dari perguruan tinggi atau sekolah yang sama.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
            <h3 className="text-base font-bold text-gray-900">Bagaimana proses verifikasi pembayaran pendaftaran?</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Setelah ketua tim mentransfer biaya pendaftaran dan mengunggah bukti transfer, panitia admin akan memverifikasi maksimal 1x24 jam kerja.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
              <h3 className="text-base font-bold text-gray-900">{faq.question}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FaqPage;
