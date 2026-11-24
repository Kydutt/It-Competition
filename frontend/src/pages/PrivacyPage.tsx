import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, ArrowLeft, AlertCircle } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export const PrivacyPage: React.FC = () => {
  return (
    <div className="bg-[#FAF9F5] min-h-screen py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
          <Link to="/" className="hover:text-[#17243A]">
            Beranda
          </Link>
          <span>/</span>
          <span className="text-[#17243A]">Kebijakan Privasi</span>
        </nav>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF4CE] border border-[#F5C842]/40 text-[#17243A] text-xs font-bold tracking-wider uppercase shadow-2xs">
            <Shield className="w-3.5 h-3.5 text-[#E8AD22]" />
            <span>PRIVASI &amp; PERLINDUNGAN DATA</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#17243A] tracking-tight">
            Kebijakan Privasi
          </h1>
          <p className="text-xs text-[#64748B]">
            Terakhir diperbarui: 21 November 2026 • Status: Kebijakan Resmi IT COMP 2026
          </p>
        </div>

        {/* Notice Banner */}
        <div className="flex items-start gap-3 p-4 sm:p-5 rounded-2xl bg-[#FFF4CE] border border-[#F5C842]/50 text-[#17243A] text-xs sm:text-sm leading-relaxed">
          <AlertCircle className="w-5 h-5 text-[#E8AD22] shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold">Komitmen Keamanan Data:</span> Platform IT COMP mengedepankan keamanan dan kerahasiaan informasi peserta. Data hanya digunakan secara sah untuk verifikasi administrasi dan kebutuhan operasional kompetisi.
          </div>
        </div>

        {/* Privacy Body */}
        <Card className="p-6 sm:p-10 lg:p-12 space-y-6 text-sm text-[#17243A]/90 leading-relaxed bg-[#FFFEFA]">
          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-[#17243A]">1. Data yang Dikumpulkan</h2>
            <p>
              Untuk memproses partisipasi dalam kompetisi, platform mengumpulkan data pribadi mencakup:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#64748B]">
              <li>Nama lengkap, alamat email, dan nomor telepon aktif.</li>
              <li>Nama institusi pendidikan asal (sekolah / perguruan tinggi) dan jenjang pendidikan.</li>
              <li>Kartu identitas resmi pelajar/mahasiswa untuk verifikasi kepesertaan.</li>
              <li>Berkas pengumpulan submisi dan repositori proyek lomba.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-[#17243A]">2. Penggunaan Data</h2>
            <p>
              Informasi yang dikumpulkan digunakan semata-mata untuk verifikasi kepesertaan, komunikasi teknis terkait jadwal dan seleksi, penjurian karya, serta penerbitan sertifikat resmi kompetisi.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-[#17243A]">3. Perlindungan &amp; Keamanan Sesi</h2>
            <p>
              Platform memanfaatkan protokol keamanan modern berbasis HTTP-only cookies, proteksi CSRF, serta enkripsi data untuk memastikan kredensial dan sesi pengguna terlindungi dari akses tidak berwenang.
            </p>
          </section>
        </Card>

        {/* Back CTA */}
        <div>
          <Link to="/">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
