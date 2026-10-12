import React from 'react';
import SectionHeading from '../../components/ui/SectionHeading';
import { FESTIVAL_INFO } from '../../data/festivalData';
import { ShieldCheck, Target, Users, Sparkles } from 'lucide-react';

export const AboutPage = () => {
  return (
    <div className="relative py-28 sm:py-32 bg-[#100B08] overflow-hidden min-h-screen">
      {/* Background Lighting */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[radial-gradient(circle,rgba(255,106,0,0.1)_0%,transparent_70%)] pointer-events-none blur-3xl -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <SectionHeading
          badge="// ABOUT // NEXUS 2026"
          title="Tentang Festival &"
          highlight="Visi Transformasi"
          description="Mewadahi talenta digital, mahasiswa, dan pelajar muda Indonesia untuk berinovasi dan berkarya melalui kompetisi IT berstandar tinggi."
        />

        {/* Content Panel */}
        <div className="bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-3xl p-8 sm:p-12 shadow-2xl space-y-10 leading-relaxed">
          
          {/* Latar Belakang */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold font-display text-[#FFF7F0] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF6A00]" />
              <span>Latar Belakang & Identitas</span>
            </h2>
            <p className="text-[#C4B3A7] text-base leading-relaxed font-sans">
              Himpunan Mahasiswa Teknik Informatika (HIMATIF) menyelenggarakan <strong>NEXUS IT Competition 2026</strong> sebagai ajang perlombaan teknologi tahunan bergengsi. Kegiatan ini hadir untuk merespons percepatan disrupsi teknologi kecerdasan buatan, keamanan siber, dan rekayasa perangkat lunak dengan menyediakan ruang kompetisi yang objektif, menantang, dan terstandarisasi.
            </p>
          </div>

          {/* Visi & Misi */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-display text-[#FFF7F0] flex items-center gap-2">
              <Target className="w-5 h-5 text-[#FF7A1A]" />
              <span>Visi & Misi Utama</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Inovasi Nyata', desc: 'Mendorong penciptaan produk digital aplikatif yang menjawab problem sosial dan kota cerdas.' },
                { title: 'Standar Industri', desc: 'Membiasakan peserta dengan metodologi pengujian, penulisan kode bersih, dan keamanan modern.' },
                { title: 'Jejaring Kolaboratif', desc: 'Menghubungkan civitas akademika dengan praktisi industri teknologi dan mentor profesional.' },
                { title: 'Inklusivitas Nasional', desc: 'Menjangkau mahasiswa perguruan tinggi serta siswa SMA/SMK se-wilayah Ciayumajakuning dan nasional.' },
              ].map((m, i) => (
                <div key={i} className="p-5 rounded-2xl bg-[#211811] border border-[rgba(255,179,107,0.12)] space-y-1">
                  <h4 className="text-base font-bold font-display text-[#FFB36B]">{m.title}</h4>
                  <p className="text-xs sm:text-sm text-[#C4B3A7]">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Wilayah Resmi */}
          <div className="space-y-4 pt-4 border-t border-[rgba(255,179,107,0.12)]">
            <h2 className="text-xl font-bold font-display text-[#FFF7F0] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FFB36B]" />
              <span>Wilayah Resmi Kepesertaan</span>
            </h2>
            <p className="text-sm text-[#C4B3A7]">
              Terbuka bagi perwakilan perguruan tinggi dan sekolah dari seluruh nusantara, dengan basis penyelenggaraan regional:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {['Cirebon', 'Indramayu', 'Majalengka', 'Kuningan'].map((reg) => (
                <div key={reg} className="p-4 bg-[#211811] rounded-2xl border border-[rgba(255,179,107,0.15)] text-center space-y-1">
                  <span className="font-bold font-display text-[#FFF7F0] block">{reg}</span>
                  <span className="text-[10px] font-mono text-[#948277]">Wilayah Inti</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AboutPage;
