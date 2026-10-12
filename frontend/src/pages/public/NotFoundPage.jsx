import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft, Home } from 'lucide-react';
import Button from '../../components/ui/Button';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-3xl p-8 md:p-10 shadow-2xl space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-[#2A1D15] border border-[rgba(255,179,107,0.25)] flex items-center justify-center text-[#FF6A00] mx-auto shadow-orange-glow">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        <div>
          <span className="text-xs font-mono text-[#FFB36B] uppercase tracking-wider block">
            ERROR 404 // NOT FOUND
          </span>
          <h1 className="text-2xl md:text-3xl font-black font-display text-[#FFF7F0] mt-1">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs text-[#948277] mt-2 leading-relaxed">
            Halaman yang Anda tuju mungkin telah dipindahkan, dinonaktifkan, atau URL yang dimasukkan kurang tepat.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button variant="primary" className="text-xs w-full flex items-center justify-center space-x-1.5">
              <Home className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full py-2.5 px-4 rounded-xl border border-[rgba(255,179,107,0.2)] bg-[#1C1410] text-[#FFF7F0] text-xs font-semibold hover:border-[#FF6A00] transition-colors flex items-center justify-center space-x-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-[#FFB36B]" />
            <span>Halaman Sebelumnya</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
