import React from 'react';

export const TimelinePage = () => {
  const steps = [
    {
      date: '1 - 25 Oktober 2026',
      title: 'Pendaftaran & Pengisian Data Tim',
      desc: 'Peserta membuat akun ketua tim, mendaftarkan anggota, memilih cabang lomba, dan melengkapi pembayaran.',
      badge: 'Sedang Berlangsung',
      status: 'active',
    },
    {
      date: '26 Oktober - 10 November 2026',
      title: 'Unggah Karya & Proposal (Submission)',
      desc: 'Pengumpulan proposal LKTI, file presentasi & desain UI/UX, serta repositori source code untuk Web Development.',
      badge: 'Segera',
      status: 'upcoming',
    },
    {
      date: '11 - 20 November 2026',
      title: 'Penjurian & Verifikasi Hasil',
      desc: 'Evaluasi karya oleh dewan juri ahli berdasarkan rubrik penilaian dan pembobotan kriteria terstandarisasi.',
      badge: 'Mendatang',
      status: 'upcoming',
    },
    {
      date: '28 November 2026',
      title: 'Grand Final & Awarding Day',
      desc: 'Presentasi finalis terbaik dan pengumuman pemenang juara 1, 2, 3 di masing-masing cabang lomba.',
      badge: 'Puncak Acara',
      status: 'upcoming',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-black text-gray-950 tracking-tight">Timeline & Agenda Lomba</h1>
        <p className="text-gray-600 max-w-xl mx-auto text-sm sm:text-base">
          Ikuti alur tahapan kegiatan secara tepat waktu untuk memastikan partisipasi tim Anda berjalan lancar.
        </p>
      </div>

      <div className="relative border-l-2 border-brand-200 ml-4 md:ml-32 space-y-10 py-4">
        {steps.map((step, idx) => (
          <div key={idx} className="relative pl-6 md:pl-10">
            {/* Timeline node */}
            <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 bg-white ${
              step.status === 'active' ? 'border-brand-600 bg-brand-500' : 'border-gray-300'
            }`}></div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600">{step.date}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                  {step.badge}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelinePage;
