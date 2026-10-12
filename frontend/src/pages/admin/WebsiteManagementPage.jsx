import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sliders, 
  Save, 
  Send, 
  RotateCcw, 
  Sparkles, 
  Layers, 
  Palette, 
  HelpCircle, 
  Building2, 
  FileText, 
  Eye, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Globe,
  Radio
} from 'lucide-react';

import { useWebsiteConfig } from '../../context/WebsiteConfigContext';
import PageHeader from '../../components/dashboard/PageHeader';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';

export const WebsiteManagementPage = () => {
  const { 
    config, 
    saveDraft, 
    publishConfig, 
    resetToDefault, 
    isDraft 
  } = useWebsiteConfig();

  // Active Tab
  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'sections' | 'theme' | 'sponsors' | 'faqs' | 'preview'
  
  // Local edit buffer
  const [formConfig, setFormConfig] = useState(() => JSON.parse(JSON.stringify(config)));
  
  // Feedback notification
  const [feedback, setFeedback] = useState(null);

  // Modals
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  
  // Sponsor Modal
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [sponsorForm, setSponsorForm] = useState({
    name: '',
    tier: 'gold',
    logoText: '',
    websiteUrl: '',
    status: 'published'
  });

  // FAQ Modal
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'umum'
  });

  // Color preset options
  const themePresets = [
    {
      id: 'futuristic-orange',
      name: 'Futuristic Orange (Default)',
      primary: '#FF6A00',
      highlight: '#FF7A1A',
      accent: '#FFB36B',
    },
    {
      id: 'cyber-amber',
      name: 'Cyber Amber',
      primary: '#F59E0B',
      highlight: '#FBBF24',
      accent: '#FCD34D',
    },
    {
      id: 'neon-solar',
      name: 'Neon Solar Core',
      primary: '#FF5722',
      highlight: '#FF7043',
      accent: '#FFAB91',
    },
    {
      id: 'hyper-violet',
      name: 'Hyper Violet Matrix',
      primary: '#8B5CF6',
      highlight: '#A78BFA',
      accent: '#C4B5FD',
    },
    {
      id: 'electric-cyan',
      name: 'Electric Cyan Pulse',
      primary: '#06B6D4',
      highlight: '#22D3EE',
      accent: '#67E8F9',
    },
  ];

  // Helper: update nested state
  const handleNestedChange = (section, field, value) => {
    setFormConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Section toggle
  const handleToggleSection = (sectionId) => {
    setFormConfig((prev) => {
      const updated = prev.sections.map((s) => {
        if (s.id === sectionId) {
          return { ...s, enabled: !s.enabled };
        }
        return s;
      });
      return { ...prev, sections: updated };
    });
  };

  // Section reorder
  const handleMoveSection = (index, direction) => {
    setFormConfig((prev) => {
      const newSections = [...prev.sections];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newSections.length) return prev;

      const temp = newSections[index];
      newSections[index] = newSections[targetIndex];
      newSections[targetIndex] = temp;

      return { ...prev, sections: newSections };
    });
  };

  // Apply Theme Preset
  const handleApplyPreset = (preset) => {
    setFormConfig((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        preset: preset.id,
        primaryColor: preset.primary,
        highlightColor: preset.highlight,
        accentColor: preset.accent,
      },
    }));
  };

  // Save Draft
  const handleSaveDraft = () => {
    saveDraft(formConfig);
    setFeedback({
      type: 'success',
      message: 'Draft pengaturan website berhasil disimpan secara lokal! Belum dipublikasikan ke publik.',
    });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Publish to public
  const handlePublishConfirm = () => {
    publishConfig(formConfig);
    setConfirmPublish(false);
    setFeedback({
      type: 'success',
      message: 'Konfigurasi website berhasil DIPUBLIKASIKAN! Pengunjung sekarang melihat konten dan tampilan terbaru.',
    });
    setTimeout(() => setFeedback(null), 6000);
  };

  // Reset to default
  const handleResetConfirm = () => {
    const def = resetToDefault();
    setFormConfig(JSON.parse(JSON.stringify(def)));
    setConfirmReset(false);
    setFeedback({
      type: 'info',
      message: 'Pengaturan website berhasil dikembalikan ke standar awal (Default NEXUS ITC 2026).',
    });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Sponsor Actions
  const handleOpenAddSponsor = () => {
    setEditingSponsor(null);
    setSponsorForm({ name: '', tier: 'gold', logoText: '', websiteUrl: '', status: 'published' });
    setIsSponsorModalOpen(true);
  };

  const handleOpenEditSponsor = (sp) => {
    setEditingSponsor(sp);
    setSponsorForm({ ...sp });
    setIsSponsorModalOpen(true);
  };

  const handleSaveSponsor = (e) => {
    e.preventDefault();
    if (!sponsorForm.name.trim()) return;

    setFormConfig((prev) => {
      let updatedSponsors = prev.sponsors ? [...prev.sponsors] : [];
      if (editingSponsor) {
        updatedSponsors = updatedSponsors.map((s) => s.id === editingSponsor.id ? { ...s, ...sponsorForm } : s);
      } else {
        updatedSponsors.push({
          id: `sp-${Date.now()}`,
          ...sponsorForm,
          order: updatedSponsors.length + 1,
        });
      }
      return { ...prev, sponsors: updatedSponsors };
    });

    setIsSponsorModalOpen(false);
  };

  const handleDeleteSponsor = (id) => {
    setFormConfig((prev) => ({
      ...prev,
      sponsors: prev.sponsors.filter((s) => s.id !== id),
    }));
  };

  // FAQ Actions
  const handleOpenAddFaq = () => {
    setEditingFaq(null);
    setFaqForm({ question: '', answer: '', category: 'umum' });
    setIsFaqModalOpen(true);
  };

  const handleOpenEditFaq = (f) => {
    setEditingFaq(f);
    setFaqForm({ ...f });
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = (e) => {
    e.preventDefault();
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return;

    setFormConfig((prev) => {
      let updatedFaqs = prev.faqs ? [...prev.faqs] : [];
      if (editingFaq) {
        updatedFaqs = updatedFaqs.map((f) => f.id === editingFaq.id ? { ...f, ...faqForm } : f);
      } else {
        updatedFaqs.push({
          id: `faq-${Date.now()}`,
          ...faqForm,
          order: updatedFaqs.length + 1,
        });
      }
      return { ...prev, faqs: updatedFaqs };
    });

    setIsFaqModalOpen(false);
  };

  const handleDeleteFaq = (id) => {
    setFormConfig((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((f) => f.id !== id),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Header with Action Buttons */}
      <PageHeader
        title="Pengaturan Website (No-Code System)"
        description="Kelola seluruh konten beranda, aktifkan/nonaktifkan section, pilih tema warna visual, serta kelola sponsor dan FAQ secara dinamis tanpa menyentuh source code."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Pengaturan Website', to: '/admin/website-management' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/website-editor">
              <Button
                variant="glow"
                className="text-xs flex items-center space-x-1.5 shadow-orange-glow font-bold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Buka Visual Builder</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => setConfirmReset(true)}
              className="text-xs flex items-center space-x-1.5 border-[rgba(255,179,107,0.2)] text-[#C4B3A7]"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#FFB36B]" />
              <span>Reset Default</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              className="text-xs flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5 text-[#FFB36B]" />
              <span>Simpan Draft</span>
            </Button>
            <Button
              variant="primary"
              onClick={() => setConfirmPublish(true)}
              className="text-xs flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publikasikan Website</span>
            </Button>
          </div>
        }
      />

      {/* Status Bar & Alert Feedback */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-2xl gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-[#948277] uppercase">STATUS PUBLIKASI:</span>
            {isDraft ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-950/40 text-[#FFB36B] border border-[#FFB36B]/30 text-xs font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFB36B] animate-ping" />
                <span>DRAFT (Ada Perubahan Belum Terbit)</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>PUBLISHED (Versi Terkini Aktif)</span>
              </span>
            )}
          </div>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-mono text-[#FF6A00] hover:underline flex items-center space-x-1 self-start sm:self-auto"
        >
          <span>Lihat Website Publik</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-[#948277] hover:text-white p-1">
            ✕
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[rgba(255,179,107,0.14)] pb-3">
        {[
          { id: 'content', label: 'Konten Hero & Umum', icon: FileText },
          { id: 'sections', label: 'Section Builder', icon: Layers },
          { id: 'theme', label: 'Tema & Visual', icon: Palette },
          { id: 'sponsors', label: 'Kelola Sponsor', icon: Building2 },
          { id: 'faqs', label: 'Kelola FAQ', icon: HelpCircle },
          { id: 'preview', label: 'Live Preview', icon: Eye },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#FF6A00] text-white shadow-orange-glow font-bold'
                  : 'bg-[#17110D] text-[#C4B3A7] hover:text-[#FFF7F0] border border-[rgba(255,179,107,0.12)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: KONTEN HERO & UMUM */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-3xl space-y-5">
            <h3 className="text-base font-bold font-display text-[#FFF7F0] flex items-center space-x-2">
              <Globe className="w-4 h-4 text-[#FF6A00]" />
              <span>Identitas Website & Hero Banner</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                  Nama Website / Brand
                </label>
                <input
                  type="text"
                  value={formConfig.general.siteName}
                  onChange={(e) => handleNestedChange('general', 'siteName', e.target.value)}
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                  Tagline Acara
                </label>
                <input
                  type="text"
                  value={formConfig.general.tagline}
                  onChange={(e) => handleNestedChange('general', 'tagline', e.target.value)}
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                  Tanggal Pelaksanaan Acara
                </label>
                <input
                  type="text"
                  value={formConfig.general.eventDates}
                  onChange={(e) => handleNestedChange('general', 'eventDates', e.target.value)}
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                  Lokasi / Venue
                </label>
                <input
                  type="text"
                  value={formConfig.general.eventVenue}
                  onChange={(e) => handleNestedChange('general', 'eventVenue', e.target.value)}
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>
            </div>

            <div className="border-t border-[rgba(255,179,107,0.12)] pt-4 space-y-4">
              <span className="text-xs font-mono text-[#FFB36B] uppercase block">
                Konfigurasi Teks Headline Hero
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#948277] mb-1">Baris 1</label>
                  <input
                    type="text"
                    value={formConfig.hero.headlineLine1}
                    onChange={(e) => handleNestedChange('hero', 'headlineLine1', e.target.value)}
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-3 py-2 text-xs text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#948277] mb-1">Baris 2</label>
                  <input
                    type="text"
                    value={formConfig.hero.headlineLine2}
                    onChange={(e) => handleNestedChange('hero', 'headlineLine2', e.target.value)}
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-3 py-2 text-xs text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#FF6A00] mb-1">Aksen Highlight</label>
                  <input
                    type="text"
                    value={formConfig.hero.headlineAccent}
                    onChange={(e) => handleNestedChange('hero', 'headlineAccent', e.target.value)}
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-3 py-2 text-xs font-bold text-[#FF6A00] focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                  Deskripsi Lengkap Hero
                </label>
                <textarea
                  rows={3}
                  value={formConfig.hero.description}
                  onChange={(e) => handleNestedChange('hero', 'description', e.target.value)}
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Teks Tombol Utama (Primary CTA)
                  </label>
                  <input
                    type="text"
                    value={formConfig.hero.primaryCtaText}
                    onChange={(e) => handleNestedChange('hero', 'primaryCtaText', e.target.value)}
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2 text-xs text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                    Teks Tombol Kedua (Secondary CTA)
                  </label>
                  <input
                    type="text"
                    value={formConfig.hero.secondaryCtaText}
                    onChange={(e) => handleNestedChange('hero', 'secondaryCtaText', e.target.value)}
                    className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2 text-xs text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* About & Footer info */}
          <div className="p-6 bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-3xl space-y-4">
            <h3 className="text-base font-bold font-display text-[#FFF7F0]">
              Tentang Acara & Kontak Penyelenggara
            </h3>
            <div>
              <label className="block text-xs font-mono text-[#FFB36B] uppercase tracking-wider mb-1">
                Kisah & Latar Belakang (About Story)
              </label>
              <textarea
                rows={3}
                value={formConfig.about.story}
                onChange={(e) => handleNestedChange('about', 'story', e.target.value)}
                className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-4 py-2.5 text-sm text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-mono text-[#948277] mb-1">Email Kontak</label>
                <input
                  type="email"
                  value={formConfig.general.contactEmail}
                  onChange={(e) => handleNestedChange('general', 'contactEmail', e.target.value)}
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-3 py-2 text-xs text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#948277] mb-1">WhatsApp / Telepon</label>
                <input
                  type="text"
                  value={formConfig.general.contactPhone}
                  onChange={(e) => handleNestedChange('general', 'contactPhone', e.target.value)}
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-3 py-2 text-xs text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#948277] mb-1">Instagram URL</label>
                <input
                  type="text"
                  value={formConfig.general.instagramUrl}
                  onChange={(e) => handleNestedChange('general', 'instagramUrl', e.target.value)}
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-3 py-2 text-xs text-[#FFF7F0] focus:outline-none focus:border-[#FF6A00]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SECTION BUILDER */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          <div className="p-6 bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-display text-[#FFF7F0] flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-[#FF6A00]" />
                  <span>Pengaturan Visibilitas & Urutan Section Beranda</span>
                </h3>
                <p className="text-xs text-[#948277]">
                  Aktifkan atau nonaktifkan section sesuai kebutuhan penyelenggaraan tanpa menghapus komponen kode.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {formConfig.sections.map((section, idx) => (
                <div
                  key={section.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
                    section.enabled
                      ? 'bg-[#1C1410] border-[rgba(255,179,107,0.2)]'
                      : 'bg-[#140D0A] border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs text-[#FFB36B] font-bold w-6">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="text-sm font-bold font-display text-[#FFF7F0] block">
                        {section.name}
                      </span>
                      <span className="text-[11px] font-mono text-[#948277]">
                        Key: {section.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveSection(idx, 'up')}
                      className="p-1.5 rounded-lg bg-[#211811] text-[#C4B3A7] hover:text-[#FFF7F0] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === formConfig.sections.length - 1}
                      onClick={() => handleMoveSection(idx, 'down')}
                      className="p-1.5 rounded-lg bg-[#211811] text-[#C4B3A7] hover:text-[#FFF7F0] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleSection(section.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 border transition-all ${
                        section.enabled
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
                          : 'bg-red-950/30 text-red-400 border-red-500/30'
                      }`}
                    >
                      <span>{section.enabled ? 'AKTIF (TAMPIL)' : 'NONAKTIF (SEMBUNYI)'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEMA & VISUAL */}
      {activeTab === 'theme' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-3xl space-y-6">
            <div>
              <h3 className="text-base font-bold font-display text-[#FFF7F0] flex items-center space-x-2">
                <Palette className="w-4 h-4 text-[#FF6A00]" />
                <span>Preset Palet Warna & Visual Identity</span>
              </h3>
              <p className="text-xs text-[#948277]">
                Pilih skema warna terkurasi atau tentukan kode hex kustom. Variabel warna otomatis disinkronkan ke dokumen CSS root.
              </p>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {themePresets.map((preset) => {
                const isSelected = formConfig.theme.primaryColor === preset.primary;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-4 rounded-2xl border text-left space-y-3 transition-all ${
                      isSelected
                        ? 'bg-[#2A1D15] border-[#FF6A00] shadow-orange-glow'
                        : 'bg-[#1C1410] border-[rgba(255,179,107,0.14)] hover:border-[#FF6A00]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#FFF7F0]">{preset.name}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#FF6A00]" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: preset.primary }} />
                      <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: preset.highlight }} />
                      <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: preset.accent }} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Hex Inputs */}
            <div className="border-t border-[rgba(255,179,107,0.12)] pt-5 space-y-4">
              <span className="text-xs font-mono text-[#FFB36B] uppercase block">
                Penyesuaian Kode Warna Manual (Hex Tokens):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#948277] mb-1">Warna Utama (Primary)</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formConfig.theme.primaryColor}
                      onChange={(e) => handleNestedChange('theme', 'primaryColor', e.target.value)}
                      className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formConfig.theme.primaryColor}
                      onChange={(e) => handleNestedChange('theme', 'primaryColor', e.target.value)}
                      className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-3 py-2 text-xs font-mono text-[#FFF7F0]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#948277] mb-1">Highlight Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formConfig.theme.highlightColor}
                      onChange={(e) => handleNestedChange('theme', 'highlightColor', e.target.value)}
                      className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formConfig.theme.highlightColor}
                      onChange={(e) => handleNestedChange('theme', 'highlightColor', e.target.value)}
                      className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-3 py-2 text-xs font-mono text-[#FFF7F0]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#948277] mb-1">Aksen Hangat (Accent)</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formConfig.theme.accentColor}
                      onChange={(e) => handleNestedChange('theme', 'accentColor', e.target.value)}
                      className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formConfig.theme.accentColor}
                      onChange={(e) => handleNestedChange('theme', 'accentColor', e.target.value)}
                      className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-3 py-2 text-xs font-mono text-[#FFF7F0]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KELOLA SPONSOR */}
      {activeTab === 'sponsors' && (
        <div className="space-y-4">
          <div className="p-6 bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-display text-[#FFF7F0] flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-[#FF6A00]" />
                  <span>Daftar Sponsor & Kemitraan</span>
                </h3>
                <p className="text-xs text-[#948277]">
                  Kelola kemitraan industri, tingkatan tier (Platinum, Gold, Silver), serta tautan resmi.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleOpenAddSponsor}
                className="text-xs flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Sponsor</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {(formConfig.sponsors || []).map((sp) => (
                <div
                  key={sp.id}
                  className="p-4 bg-[#1C1410] rounded-2xl border border-[rgba(255,179,107,0.14)] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2A1D15] text-[#FFB36B] uppercase font-bold border border-[rgba(255,179,107,0.2)]">
                      {sp.tier}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditSponsor(sp)}
                        className="p-1 rounded text-[#FFB36B] hover:text-[#FF6A00]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSponsor(sp.id)}
                        className="p-1 rounded text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold font-display text-[#FFF7F0]">{sp.name}</h4>
                    <p className="text-xs font-mono text-[#948277] truncate">{sp.websiteUrl}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: KELOLA FAQ */}
      {activeTab === 'faqs' && (
        <div className="space-y-4">
          <div className="p-6 bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-display text-[#FFF7F0] flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-[#FF6A00]" />
                  <span>Kelola Pertanyaan Umum (FAQ)</span>
                </h3>
                <p className="text-xs text-[#948277]">
                  Tuliskan pertanyaan penting untuk memandu peserta mengenai alur kompetisi.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleOpenAddFaq}
                className="text-xs flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah FAQ</span>
              </Button>
            </div>

            <div className="space-y-3 pt-2">
              {(formConfig.faqs || []).map((faq) => (
                <div
                  key={faq.id}
                  className="p-4 bg-[#1C1410] rounded-2xl border border-[rgba(255,179,107,0.14)] space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[#FFB36B] uppercase block">
                        Kategori: {faq.category}
                      </span>
                      <h4 className="text-sm font-bold text-[#FFF7F0]">{faq.question}</h4>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0 ml-2">
                      <button
                        onClick={() => handleOpenEditFaq(faq)}
                        className="p-1 rounded text-[#FFB36B] hover:text-[#FF6A00]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="p-1 rounded text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-[#C4B3A7] leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: LIVE PREVIEW */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="p-6 bg-[#17110D] border border-[rgba(255,179,107,0.16)] rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-display text-[#FFF7F0] flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-[#FF6A00]" />
                  <span>Simulasi Tampilan Hero Publik (Live Mock Preview)</span>
                </h3>
                <p className="text-xs text-[#948277]">
                  Pratinjau tampilan beranda sebelum dipublikasikan kepada peserta dan pengunjung.
                </p>
              </div>
              <Button variant="primary" onClick={() => setConfirmPublish(true)} className="text-xs">
                Publikasikan Sekarang
              </Button>
            </div>

            {/* Embedded Visual Hero Mockup */}
            <div className="p-8 rounded-3xl bg-[#100B08] border border-[rgba(255,179,107,0.25)] space-y-6 text-center max-w-3xl mx-auto shadow-2xl relative overflow-hidden">
              <div
                className="w-48 h-48 rounded-full blur-3xl absolute -top-10 -right-10 pointer-events-none opacity-40"
                style={{ backgroundColor: formConfig.theme.primaryColor }}
              />

              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#1C1410] border border-[rgba(255,179,107,0.25)] text-xs font-mono text-[#FFB36B]">
                <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: formConfig.theme.primaryColor }} />
                <span>{formConfig.general.editionTag}</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-5xl font-black font-display text-[#FFF7F0] leading-tight">
                  {formConfig.hero.headlineLine1} <br />
                  {formConfig.hero.headlineLine2} <br />
                  <span style={{ color: formConfig.theme.primaryColor }}>
                    {formConfig.hero.headlineAccent}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-[#C4B3A7] max-w-xl mx-auto leading-relaxed pt-2">
                  {formConfig.hero.description}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition-transform hover:scale-105"
                  style={{ backgroundColor: formConfig.theme.primaryColor }}
                >
                  {formConfig.hero.primaryCtaText}
                </button>
                <button className="px-5 py-2.5 rounded-xl font-bold text-xs text-[#FFF7F0] border border-[rgba(255,179,107,0.3)] bg-[#1C1410]">
                  {formConfig.hero.secondaryCtaText}
                </button>
              </div>

              <div className="pt-4 border-t border-[rgba(255,179,107,0.1)] flex justify-center gap-6 text-xs font-mono text-[#948277]">
                <span>📅 {formConfig.general.eventDates}</span>
                <span>📍 {formConfig.general.eventVenue}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SPONSOR MODAL */}
      {isSponsorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#17110D] border border-[rgba(255,179,107,0.2)] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold font-display text-[#FFF7F0]">
              {editingSponsor ? 'Edit Sponsor' : 'Tambah Sponsor Baru'}
            </h3>
            <form onSubmit={handleSaveSponsor} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase mb-1">Nama Perusahaan / Sponsor *</label>
                <input
                  type="text"
                  required
                  value={sponsorForm.name}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })}
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-3 py-2 text-xs text-[#FFF7F0]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase mb-1">Tingkatan Kemitraan (Tier)</label>
                <select
                  value={sponsorForm.tier}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, tier: e.target.value })}
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-3 py-2 text-xs text-[#FFF7F0]"
                >
                  <option value="platinum">Platinum Partner</option>
                  <option value="gold">Gold Partner</option>
                  <option value="silver">Silver Partner</option>
                  <option value="partner">Media / Community Partner</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase mb-1">Teks Logo Display</label>
                <input
                  type="text"
                  value={sponsorForm.logoText}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, logoText: e.target.value })}
                  placeholder="Contoh: MANDIRI DIGITAL"
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-3 py-2 text-xs text-[#FFF7F0]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase mb-1">Website URL</label>
                <input
                  type="url"
                  value={sponsorForm.websiteUrl}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, websiteUrl: e.target.value })}
                  placeholder="https://company.com"
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-3 py-2 text-xs text-[#FFF7F0]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsSponsorModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary">
                  Simpan Sponsor
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAQ MODAL */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#17110D] border border-[rgba(255,179,107,0.2)] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold font-display text-[#FFF7F0]">
              {editingFaq ? 'Edit Pertanyaan FAQ' : 'Tambah Pertanyaan FAQ'}
            </h3>
            <form onSubmit={handleSaveFaq} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase mb-1">Kategori FAQ</label>
                <select
                  value={faqForm.category}
                  onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-3 py-2 text-xs text-[#FFF7F0]"
                >
                  <option value="umum">Umum</option>
                  <option value="pendaftaran">Pendaftaran</option>
                  <option value="karya">Karya & Submission</option>
                  <option value="penjurian">Penjurian & Nilai</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase mb-1">Pertanyaan *</label>
                <input
                  type="text"
                  required
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-3 py-2 text-xs text-[#FFF7F0]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#FFB36B] uppercase mb-1">Jawaban Lengkap *</label>
                <textarea
                  rows={4}
                  required
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                  className="w-full bg-[#1C1410] border border-[rgba(255,179,107,0.2)] rounded-xl px-3 py-2 text-xs text-[#FFF7F0]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsFaqModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary">
                  Simpan FAQ
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM PUBLISH DIALOG */}
      <ConfirmDialog
        isOpen={confirmPublish}
        title="Publikasikan Perubahan Website?"
        message="Seluruh konfigurasi konten, section, tema visual, sponsor, dan FAQ akan langsung diterapkan pada website publik yang dapat dilihat oleh semua pengunjung."
        confirmLabel="Ya, Publikasikan Sekarang"
        cancelLabel="Kembali Edit"
        variant="primary"
        onConfirm={handlePublishConfirm}
        onCancel={() => setConfirmPublish(false)}
      />

      {/* CONFIRM RESET DIALOG */}
      <ConfirmDialog
        isOpen={confirmReset}
        title="Kembalikan Pengaturan ke Default?"
        message="Seluruh penyesuaian konten, tema warna, dan urutan section akan dikembalikan ke konfigurasi awal bawaan NEXUS ITC 2026."
        confirmLabel="Ya, Reset Default"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleResetConfirm}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
};

export default WebsiteManagementPage;
