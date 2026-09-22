import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import Button from '../../components/ui/Button';

export const AnnouncementDetailPage = () => {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await competitionService.getAnnouncementBySlug(slug);
        if (res.success && res.data) {
          setItem(res.data);
        }
      } catch (err) {
        console.error('Failed to load announcement detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="text-center py-24">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">Memuat pengumuman...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pengumuman Tidak Ditemukan</h2>
        <Link to="/announcements">
          <Button variant="primary">Kembali ke Daftar Pengumuman</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <div>
        <Link to="/announcements" className="text-xs font-semibold text-brand-600 hover:underline">
          &larr; Kembali ke Semua Pengumuman
        </Link>
        <span className="block text-xs font-medium text-gray-400 mt-4">
          Diterbitkan pada {new Date(item.published_at || item.created_at).toLocaleDateString('id-ID', { dateStyle: 'full' })}
        </span>
        <h1 className="text-3xl font-black text-gray-950 mt-2">{item.title}</h1>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-gray-700 leading-relaxed space-y-4 whitespace-pre-line">
        {item.content}
      </div>
    </div>
  );
};

export default AnnouncementDetailPage;
