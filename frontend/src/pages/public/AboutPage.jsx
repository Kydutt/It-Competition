import React from 'react';

export const AboutPage = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-gray-950 tracking-tight">
          Tentang HIMATIF IT Competition
        </h1>
        <p className="text-base text-gray-600 max-w-2xl mx-auto">
          Wadah kolaborasi, inovasi, dan unjuk kebolehan talenta digital muda se-wilayah Ciayumajakuning.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 shadow-sm space-y-8 leading-relaxed text-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Latar Belakang</h2>
          <p>
            Himpunan Mahasiswa Teknik Informatika (HIMATIF) menyelenggarakan <strong>HIMATIF IT Competition</strong> sebagai respon terhadap pesatnya perkembangan industri teknologi informasi dan kebutuhan akan wadah kompetisi yang terstandarisasi, transparan, dan inklusif bagi generasi muda di wilayah Cirebon, Indramayu, Majalengka, dan Kuningan (Ciayumajakuning).
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Visi & Misi</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Menumbuhkan budaya inovasi dan pemecahan masalah nyata melalui teknologi.</li>
            <li>Mengasah keterampilan komputasi, desain antarmuka, dan penulisan karya ilmiah.</li>
            <li>Membangun jejaring kolaboratif antara mahasiswa, siswa, akademisi, dan praktisi industri IT.</li>
            <li>Menghadirkan sistem kompetisi multi-event modern berbasis platform digital terintegrasi.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Wilayah Kepesertaan</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-center">
              <span className="font-bold text-brand-700 block">Cirebon</span>
              <span className="text-xs text-gray-500">Kota & Kabupaten</span>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-center">
              <span className="font-bold text-brand-700 block">Indramayu</span>
              <span className="text-xs text-gray-500">Kabupaten</span>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-center">
              <span className="font-bold text-brand-700 block">Majalengka</span>
              <span className="text-xs text-gray-500">Kabupaten</span>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-center">
              <span className="font-bold text-brand-700 block">Kuningan</span>
              <span className="text-xs text-gray-500">Kabupaten</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
