import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import mockService from '../services/mockService';
import { INITIAL_WEBSITE_CONFIG } from '../data/mockData';

const WebsiteConfigContext = createContext(null);

export const WebsiteConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(() => {
    return mockService.getWebsiteConfig() || INITIAL_WEBSITE_CONFIG;
  });

  // Apply theme tokens to CSS Variables on document root
  const applyThemeTokens = useCallback((themeData) => {
    if (!themeData || typeof document === 'undefined') return;
    const root = document.documentElement;

    if (themeData.primaryColor) {
      root.style.setProperty('--color-primary', themeData.primaryColor);
    }
    if (themeData.highlightColor) {
      root.style.setProperty('--color-highlight', themeData.highlightColor);
    }
    if (themeData.accentColor) {
      root.style.setProperty('--color-accent', themeData.accentColor);
    }
  }, []);

  // Listen to external updates and sync state
  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail) {
        setConfig(e.detail);
        applyThemeTokens(e.detail.theme);
      }
    };

    applyThemeTokens(config.theme);
    window.addEventListener('fest:website_config_updated', handleUpdate);
    return () => {
      window.removeEventListener('fest:website_config_updated', handleUpdate);
    };
  }, [applyThemeTokens, config.theme]);

  // Save changes as draft
  const saveDraft = useCallback((updatedConfig) => {
    const newConfig = { ...config, ...updatedConfig };
    const saved = mockService.saveWebsiteConfig(newConfig, false);
    setConfig(saved);
    applyThemeTokens(saved.theme);
    return saved;
  }, [config, applyThemeTokens]);

  // Publish changes to public site
  const publishConfig = useCallback((updatedConfig) => {
    const newConfig = { ...config, ...updatedConfig };
    const saved = mockService.saveWebsiteConfig(newConfig, true);
    setConfig(saved);
    applyThemeTokens(saved.theme);
    return saved;
  }, [config, applyThemeTokens]);

  // Reset to default
  const resetToDefault = useCallback(() => {
    const def = mockService.resetWebsiteConfig();
    setConfig(def);
    applyThemeTokens(def.theme);
    return def;
  }, [applyThemeTokens]);

  // Helper: check if a section is enabled
  const isSectionEnabled = useCallback((sectionId) => {
    if (!config?.sections) return true;
    const sec = config.sections.find((s) => s.id === sectionId || s.key === sectionId);
    return sec ? sec.enabled : true;
  }, [config]);

  // Helper: get custom section title
  const getSectionTitle = useCallback((sectionId, fallback) => {
    if (!config?.sections) return fallback;
    const sec = config.sections.find((s) => s.id === sectionId || s.key === sectionId);
    return sec?.name || fallback;
  }, [config]);

  const value = {
    config,
    saveDraft,
    publishConfig,
    resetToDefault,
    isSectionEnabled,
    getSectionTitle,
    isDraft: config?.status === 'draft',
    isPublished: config?.status === 'published',
  };

  return (
    <WebsiteConfigContext.Provider value={value}>
      {children}
    </WebsiteConfigContext.Provider>
  );
};

export const useWebsiteConfig = () => {
  const context = useContext(WebsiteConfigContext);
  if (!context) {
    throw new Error('useWebsiteConfig must be used within a WebsiteConfigProvider');
  }
  return context;
};

export default WebsiteConfigContext;
