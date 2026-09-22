import React from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export const ContactPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-black text-gray-950 tracking-tight">Hubungi Panitia</h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto">
          Ada pertanyaan atau kendala seputar pendaftaran? Hubungi tim panitia HIMATIF IT Competition.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-gray-900">Saluran Resmi</h3>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <span className="font-semibold text-gray-900 block">Email Sekretariat:</span>
              <a href="mailto:competition@himatif.org" className="text-brand-600 hover:underline">
                competition@himatif.org
              </a>
            </div>
            <div>
              <span className="font-semibold text-gray-900 block">WhatsApp Helpdesk:</span>
              <span className="text-gray-700">+62 812-3456-7890 (Chat Only)</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900 block">Instagram:</span>
              <span className="text-gray-700">@himatif_itcompetition</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900 block">Alamat Sekretariat:</span>
              <span className="text-gray-700">Gedung HIMATIF Center, Ciayumajakuning</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Kirim Pesan Cepat</h3>
          <Input label="Nama Lengkap" placeholder="Masukkan nama Anda" />
          <Input label="Email Aktif" type="email" placeholder="nama@email.com" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pesan Anda</label>
            <textarea
              rows={4}
              placeholder="Tuliskan pertanyaan atau kendala..."
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            ></textarea>
          </div>
          <Button variant="primary" className="w-full font-bold">
            Kirim Pesan
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
