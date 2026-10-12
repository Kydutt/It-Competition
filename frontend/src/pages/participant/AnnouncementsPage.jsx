import React, { useState, useMemo } from 'react';
import { 
  Megaphone, 
  Pin, 
  Clock, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import mockService from '../../services/mockService';
import PageHeader from '../../components/dashboard/PageHeader';
import Button from '../../components/ui/Button';

export const ParticipantAnnouncementsPage = () => {
  const [announcements] = useState(() => mockService.announcements);
  const [selectedAnc, setSelectedAnc] = useState(null);

  const participantAnnouncements = useMemo(() => {
    return announcements.filter(
      (a) => a.status === 'published' && (a.audience === 'all' || a.audience === 'participants')
    );
  }, [announcements]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengumuman Panitia"
        description="Warta terkini, pembaruan panduan teknis, dan informasi krusial pelaksanaan kompetisi dari panitia penyelenggara."
        breadcrumbs={[
          { label: 'Peserta', to: '/participant/dashboard' },
          { label: 'Pengumuman', to: '/participant/announcements' },
        ]}
      />

      <div className="space-y-4">
        {participantAnnouncements.map((anc) => (
          <div
            key={anc.id}
            className={`p-6 bg-[#17110D] border rounded-3xl space-y-3 transition-colors ${
              anc.isPinned
                ? 'border-[#FF6A00]/50 shadow-orange-glow/10'
                : 'border-[rgba(255,179,107,0.16)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {anc.isPinned && (
                  <span className="flex items-center space-x-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#FF6A00]/20 text-[#FF6A00] border border-[#FF6A00]/40 font-bold">
                    <Pin className="w-3 h-3 rotate-45" />
                    <span>PINNED</span>
                  </span>
                )}
                <span className="text-[10px] font-mono text-[#948277]">
                  {new Date(anc.createdAt || Date.now()).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-base md:text-lg font-bold font-display text-[#FFF7F0]">
                {anc.title}
              </h3>
              <p className="text-xs md:text-sm text-[#C4B3A7] leading-relaxed pt-1">
                {anc.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticipantAnnouncementsPage;
