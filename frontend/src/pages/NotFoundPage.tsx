import React from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Home, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-orange-100 text-[var(--color-brand-orange)] flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-2">
        404
      </h1>
      <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
        Halaman Tidak Ditemukan
      </h2>
      <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
        Halaman yang Anda tuju mungkin telah dipindahkan, dihapus, atau alamat URL yang Anda masukkan salah.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/">
          <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
            Kembali ke Beranda
          </Button>
        </Link>
        <Link to="/competitions">
          <Button variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Lihat Kompetisi
          </Button>
        </Link>
      </div>
    </div>
  )
}
