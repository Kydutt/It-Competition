import React from 'react'
import { Link } from 'react-router-dom'
import { FileText, ArrowLeft, AlertCircle } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export const TermsPage: React.FC = () => {
  return (
    <div className="bg-[#FAF9F5] min-h-screen py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
          <Link to="/" className="hover:text-[#17243A]">
            Beranda
          </Link>
          <span>/</span>
          <span className="text-[#17243A]">Syarat &amp; Ketentuan</span>
        </nav>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF4CE] border border-[#F5C842]/40 text-[#17243A] text-xs font-bold tracking-wider uppercase shadow-2xs">
            <FileText className="w-3.5 h-3.5 text-[#E8AD22]" />
            <span>DOKUMEN LEGAL PLATFORM</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#17243A] tracking-tight">
            Syarat dan Ketentuan Partisipasi
          </h1>
          <p className="text-xs text-[#64748B]">
            Terakhir diperbarui: 21 November 2026 • Status: Regulasi Resmi IT COMP 2026
          </p>
        </div>

        {/* Notice Banner */}
        <div className="flex items-start gap-3 p-4 sm:p-5 rounded-2xl bg-[#FFF4CE] border border-[#F5C842]/50 text-[#17243A] text-xs sm:text-sm leading-relaxed">
          <AlertCircle className="w-5 h-5 text-[#E8AD22] shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold">Pemberitahuan Resmi:</span> Dokumen ini mengikat seluruh peserta dan tim yang terdaftar dalam kegiatan IT Festival 2026. Ketentuan dapat disesuaikan oleh dewan panitia sesuai pedoman teknis per cabang lomba.
          </div>
        </div>

        {/* Terms Body */}
        <Card className="p-6 sm:p-10 lg:p-12 space-y-6 text-sm text-[#17243A]/90 leading-relaxed bg-[#FFFEFA]">
          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-[#17243A]">1. Ketentuan Umum</h2>
            <p>
              Dengan mendaftarkan akun dan berpartisipasi dalam IT Festival 2026, peserta menyatakan telah membaca, memahami, dan menyetujui seluruh aturan umum maupun aturan khusus masing-masing cabang kompetisi yang tercantum dalam panduan teknis (rulebook).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-[#17243A]">2. Keaslian Karya dan Hak Cipta</h2>
            <p>
              Setiap karya yang diserahkan wajib merupakan hasil pemikiran dan kreasi orisinal dari peserta atau anggota tim yang bersangkutan. Penggunaan library, framework, atau aset pihak ketiga bersifat open-source diperbolehkan selama dicantumkan dengan jelas sumber dan lisensinya.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-[#17243A]">3. Kejujuran Akademik &amp; Integritas</h2>
            <p>
              Segala bentuk plagiarisme, fabrikasi data, kecurangan pengiriman kode milik pihak lain, atau pelanggaran etika digital berakibat pada diskualifikasi langsung tanpa toleransi serta pembatalan seluruh hak perolehan kejuaraan.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-[#17243A]">4. Keputusan Dewan Juri</h2>
            <p>
              Keputusan dewan juri dan panitia penilai bersifat mutlak, independen, dan tidak dapat diganggu gugat melalui media apa pun.
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
