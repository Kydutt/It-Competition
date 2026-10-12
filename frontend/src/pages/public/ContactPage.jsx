import React from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useBuilderPage } from '../../builder/useBuilderPage';
import DynamicPageRenderer from '../../builder/DynamicPageRenderer';

export const ContactPage = () => {
  const builderPage = useBuilderPage('contact');

  if (builderPage && builderPage.elements && builderPage.elements.length > 0 && builderPage.status === 'published') {
    return (
      <div className="relative overflow-hidden min-h-screen">
        <DynamicPageRenderer page={builderPage} isEditMode={false} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-black font-display text-[#FFF7F0] tracking-tight">Hubungi Panitia</h1>
        <p className="text-sm sm:text-base text-[#C4B3A7] max-w-lg mx-auto">
          Ada pertanyaan atau kendala seputar pendaftaran? Hubungi tim panitia HIMATIF IT Competition.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#1C1410] p-8 rounded-3xl border border-[rgba(255,179,107,0.18)] shadow-xl space-y-6">
          <h3 className="text-xl font-bold font-display text-[#FFF7F0]">Saluran Resmi</h3>
          <div className="space-y-4 text-sm text-[#C4B3A7]">
            <div>
              <span className="font-semibold text-[#FFB36B] block">Email Sekretariat:</span>
              <a href="mailto:contact@nexusitc2026.id" className="text-[#FF7A1A] hover:underline">
                contact@nexusitc2026.id
              </a>
            </div>
            <div>
              <span className="font-semibold text-[#FFB36B] block">WhatsApp Helpdesk:</span>
              <span className="text-[#FFF7F0]">+62 812-3456-7890 (Chat Only)</span>
            </div>
            <div>
              <span className="font-semibold text-[#FFB36B] block">Instagram:</span>
              <span className="text-[#FFF7F0]">@nexusitc_official</span>
            </div>
            <div>
              <span className="font-semibold text-[#FFB36B] block">Alamat Sekretariat:</span>
              <span className="text-[#FFF7F0]">Gedung HIMATIF Center, Ciayumajakuning</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1C1410] p-8 rounded-3xl border border-[rgba(255,179,107,0.18)] shadow-xl space-y-4">
          <h3 className="text-xl font-bold font-display text-[#FFF7F0]">Kirim Pertanyaan Cepat</h3>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); alert('Pesan berhasil dikirimkan!'); }}>
            <Input label="Nama Lengkap" placeholder="Nama Anda" required />
            <Input label="Email / Kontak" placeholder="email@contoh.com" required />
            <div className="space-y-1">
              <label className="text-xs font-mono text-[#C4B3A7]">Isi Pesan</label>
              <textarea
                rows={3}
                placeholder="Tuliskan pertanyaan Anda..."
                required
                className="w-full bg-[#211811] border border-[rgba(255,179,107,0.2)] rounded-xl p-3 text-xs text-[#FFF7F0] focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
              />
            </div>
            <Button variant="glow" size="md" type="submit" className="w-full justify-center">
              Kirim Pesan
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

