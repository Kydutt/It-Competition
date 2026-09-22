import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import competitionService from '../../services/competitionService';

export const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await competitionService.getAnnouncements();
        if (res.success && res.data) {
          setAnnouncements(res.data);
        }
      } catch (err) {
        console.error('Failed to load announcements:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <div className="text-center max-w-xl mx-auto space-y-3">
        <h1 className="text-4xl font-black text-gray-950 tracking-tight">Pengumuman Resmi</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Informasi terkini mengenai mekanisme, seleksi berkas, jadwal juri, dan rilis ketentuan lomba.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat pengumuman...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
          <p className="text-gray-500">Belum ada pengumuman yang dipublikasikan saat ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs hover:border-brand-300 transition-colors">
              <span className="text-xs font-semibold text-brand-600">
                {new Date(item.published_at || item.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-1">
                <Link to={`/announcements/${item.slug}`} className="hover:text-brand-600 transition-colors">
                  {item.title}
                </Link>
              </h3>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.content}</p>
              <div className="mt-4">
                <Link to={`/announcements/${item.slug}`} className="text-xs font-bold text-brand-600 hover:text-brand-700">
                  Baca Selengkapnya &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
