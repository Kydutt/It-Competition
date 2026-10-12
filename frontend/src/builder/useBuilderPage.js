import { useState, useEffect } from 'react';
import mockService from '../services/mockService';

/**
 * Reusable Hook to load and reactively sync a page configured via Visual Website Builder
 * @param {string} pageId - e.g. 'home', 'about', 'competitions', 'timeline', 'faq', 'contact'
 */
export const useBuilderPage = (pageId) => {
  const [page, setPage] = useState(() => mockService.getBuilderPage(pageId));

  useEffect(() => {
    const handleUpdate = (e) => {
      if (!e.detail?.page || e.detail.page.id === pageId) {
        setPage(mockService.getBuilderPage(pageId));
      }
    };

    window.addEventListener('fest:builder_page_updated', handleUpdate);
    return () => {
      window.removeEventListener('fest:builder_page_updated', handleUpdate);
    };
  }, [pageId]);

  return page;
};

export default useBuilderPage;
