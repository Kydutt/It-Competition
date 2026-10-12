import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Eye, 
  EyeOff, 
  Undo2, 
  Redo2, 
  Save, 
  Send, 
  Clock, 
  Image as ImageIcon, 
  Layers, 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  RotateCcw, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Upload, 
  Sparkles,
  ExternalLink,
  Settings,
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import mockService from '../../services/mockService';
import { COMPONENT_DEFINITIONS, COMPONENT_CATEGORIES } from '../../builder/componentRegistry';
import DynamicPageRenderer from '../../builder/DynamicPageRenderer';
import Button from '../../components/ui/Button';

export const WebsiteEditorPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPageId = searchParams.get('page') || 'home';

  // --- STATE ---
  const [pages, setPages] = useState(() => mockService.getBuilderPages());
  const [activePageId, setActivePageId] = useState(initialPageId);
  const [activePage, setActivePage] = useState(() => mockService.getBuilderPage(initialPageId));
  
  // Undo / Redo History Stack
  const [history, setHistory] = useState([JSON.parse(JSON.stringify(mockService.getBuilderPage(initialPageId)))]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Editor Viewport & Mode
  const [viewport, setViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Left Panel Tab
  const [leftTab, setLeftTab] = useState('layers'); // 'pages' | 'layers' | 'components'
  const [componentSearch, setComponentSearch] = useState('');

  // Selected Element on Canvas
  const [selectedElementId, setSelectedElementId] = useState(null);

  // Modals
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isNewPageModalOpen, setIsNewPageModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState(null);

  // Assets Library
  const [assets, setAssets] = useState(() => mockService.getBuilderAssets());
  const [selectedAssetCategory, setSelectedAssetCategory] = useState('all');

  // New Page Form
  const [newPageForm, setNewPageForm] = useState({ title: '', slug: '', description: '' });

  // Update active page when selection or query param changes
  useEffect(() => {
    const page = mockService.getBuilderPage(activePageId);
    if (page) {
      setActivePage(JSON.parse(JSON.stringify(page)));
      setHistory([JSON.parse(JSON.stringify(page))]);
      setHistoryIndex(0);
      setSelectedElementId(null);
      setHasUnsavedChanges(false);
      setSearchParams({ page: activePageId });
    }
  }, [activePageId, setSearchParams]);

  // Show Toast Helper
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Push new state to History Stack
  const pushState = useCallback((newPage) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newPage)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setActivePage(newPage);
    setHasUnsavedChanges(true);
  }, [history, historyIndex]);

  // Undo Action
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setActivePage(JSON.parse(JSON.stringify(prev)));
      setHasUnsavedChanges(true);
      showToast('Undo berhasil');
    }
  };

  // Redo Action
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setActivePage(JSON.parse(JSON.stringify(next)));
      setHasUnsavedChanges(true);
      showToast('Redo berhasil');
    }
  };

  // Find Element Helper Recursively
  const findElementRecursive = (elements, id) => {
    for (const el of elements) {
      if (el.id === id) return el;
      if (el.children) {
        const found = findElementRecursive(el.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Find Parent and Index Helper
  const findParentAndIndex = (elements, id, parent = null) => {
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].id === id) {
        return { parent, index: i, list: elements };
      }
      if (elements[i].children) {
        const found = findParentAndIndex(elements[i].children, id, elements[i]);
        if (found) return found;
      }
    }
    return null;
  };

  // Get currently selected element
  const selectedElement = useMemo(() => {
    if (!selectedElementId || !activePage) return null;
    return findElementRecursive(activePage.elements, selectedElementId);
  }, [selectedElementId, activePage]);

  // Update Element Properties in tree
  const updateElementProps = (elementId, newProps) => {
    if (!activePage) return;
    const cloned = JSON.parse(JSON.stringify(activePage));
    const target = findElementRecursive(cloned.elements, elementId);
    if (target) {
      target.props = { ...target.props, ...newProps };
      pushState(cloned);
    }
  };

  // Add Component to Page / Active Section
  const handleAddComponent = (componentType) => {
    const def = COMPONENT_DEFINITIONS[componentType];
    if (!def) return;

    const newId = `el-${Date.now()}`;
    const newElement = {
      id: newId,
      type: componentType,
      props: JSON.parse(JSON.stringify(def.defaultProps)),
      children: def.supportsChildren ? [] : undefined,
    };

    const cloned = JSON.parse(JSON.stringify(activePage));

    // If an element is selected and it supports children (e.g. section or container), insert into it
    if (selectedElement && selectedElement.children) {
      const targetParent = findElementRecursive(cloned.elements, selectedElement.id);
      if (targetParent) {
        targetParent.children.push(newElement);
        pushState(cloned);
        setSelectedElementId(newId);
        showToast(`Komponen "${def.label}" ditambahkan ke ${targetParent.props?.name || targetParent.type}`);
        return;
      }
    }

    // If a section is selected, insert after it or inside it
    if (componentType === 'section') {
      cloned.elements.push(newElement);
    } else {
      // Find last section to append to, or create a default section
      if (cloned.elements.length === 0) {
        const defSec = {
          id: `sec-${Date.now()}`,
          type: 'section',
          props: { ...COMPONENT_DEFINITIONS.section.defaultProps, name: 'Section Baru' },
          children: [newElement],
        };
        cloned.elements.push(defSec);
      } else {
        const lastSection = cloned.elements[cloned.elements.length - 1];
        if (!lastSection.children) lastSection.children = [];
        lastSection.children.push(newElement);
      }
    }

    pushState(cloned);
    setSelectedElementId(newId);
    showToast(`Komponen "${def.label}" berhasil ditambahkan ke canvas.`);
  };

  // Delete Element
  const handleDeleteElement = (elementId) => {
    if (!activePage) return;
    const cloned = JSON.parse(JSON.stringify(activePage));
    const location = findParentAndIndex(cloned.elements, elementId);

    if (location) {
      location.list.splice(location.index, 1);
      pushState(cloned);
      setSelectedElementId(null);
      showToast('Elemen berhasil dihapus.');
    }
  };

  // Duplicate Element
  const handleDuplicateElement = (elementId) => {
    if (!activePage) return;
    const cloned = JSON.parse(JSON.stringify(activePage));
    const location = findParentAndIndex(cloned.elements, elementId);

    if (location) {
      const original = location.list[location.index];
      const duplicate = JSON.parse(JSON.stringify(original));
      duplicate.id = `el-${Date.now()}`;
      if (duplicate.children) {
        duplicate.children = duplicate.children.map((c) => ({
          ...c,
          id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        }));
      }

      location.list.splice(location.index + 1, 0, duplicate);
      pushState(cloned);
      setSelectedElementId(duplicate.id);
      showToast('Elemen berhasil diduplikasi.');
    }
  };

  // Move Element Up/Down
  const handleMoveElement = (elementId, direction) => {
    if (!activePage) return;
    const cloned = JSON.parse(JSON.stringify(activePage));
    const location = findParentAndIndex(cloned.elements, elementId);

    if (location) {
      const { index, list } = location;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex >= 0 && targetIndex < list.length) {
        const [moved] = list.splice(index, 1);
        list.splice(targetIndex, 0, moved);
        pushState(cloned);
      }
    }
  };

  // Save Draft
  const handleSaveDraft = () => {
    if (!activePage) return;
    const saved = mockService.saveBuilderPageDraft(activePage.id, activePage);
    if (saved) {
      setActivePage(saved);
      setHasUnsavedChanges(false);
      setPages(mockService.getBuilderPages());
      showToast(`Draft halaman "${saved.title}" berhasil disimpan.`);
    }
  };

  // Publish Page
  const handlePublishPage = () => {
    if (!activePage) return;
    const published = mockService.publishBuilderPage(activePage.id, activePage);
    if (published) {
      setActivePage(published);
      setHasUnsavedChanges(false);
      setIsPublishModalOpen(false);
      setPages(mockService.getBuilderPages());
      showToast(`Halaman "${published.title}" berhasil diterbitkan ke website publik!`, 'success');
    }
  };

  // Reset to Default Template
  const handleResetToDefault = () => {
    if (!activePage) return;
    const reset = mockService.resetBuilderPage(activePage.id);
    if (reset) {
      setActivePage(reset);
      setHistory([JSON.parse(JSON.stringify(reset))]);
      setHistoryIndex(0);
      setHasUnsavedChanges(false);
      setIsResetConfirmOpen(false);
      showToast(`Halaman "${reset.title}" telah direset ke template default.`);
    }
  };

  // Create New Page
  const handleCreatePage = (e) => {
    e.preventDefault();
    if (!newPageForm.title || !newPageForm.slug) {
      showToast('Mohon lengkapi judul dan slug halaman', 'error');
      return;
    }

    try {
      const newPage = mockService.createBuilderPage(newPageForm);
      setPages(mockService.getBuilderPages());
      setActivePageId(newPage.id);
      setIsNewPageModalOpen(false);
      setNewPageForm({ title: '', slug: '', description: '' });
      showToast(`Halaman baru "${newPage.title}" berhasil dibuat!`);
    } catch (err) {
      showToast(err.message || 'Gagal membuat halaman', 'error');
    }
  };

  // Delete Custom Page
  const handleDeletePage = (pageId) => {
    try {
      mockService.deleteBuilderPage(pageId);
      const remaining = mockService.getBuilderPages();
      setPages(remaining);
      setActivePageId('home');
      showToast('Halaman berhasil dihapus.');
    } catch (err) {
      showToast(err.message || 'Tidak dapat menghapus halaman', 'error');
    }
  };

  // Asset Upload Simulation
  const handleAssetUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar (PNG, JPG, SVG, WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran gambar maksimal 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      const uploaded = mockService.uploadBuilderAsset({
        name: file.name.replace(/\.[^/.]+$/, ''),
        url: dataUrl,
        type: file.type,
        size: `${Math.round(file.size / 1024)} KB`,
        category: 'uploads',
      });
      setAssets(mockService.getBuilderAssets());
      showToast(`Gambar "${uploaded.name}" berhasil diunggah ke Asset Library!`);
    };
    reader.readAsDataURL(file);
  };

  // Restore Version Snapshot
  const handleRestoreSnapshot = (snapshotId) => {
    const restored = mockService.restoreBuilderSnapshot(activePage.id, snapshotId);
    if (restored) {
      setActivePage(restored);
      pushState(restored);
      setIsHistoryModalOpen(false);
      showToast('Versi halaman berhasil dipulihkan.');
    }
  };

  // Viewport Container Width Classes
  const viewportClasses = {
    desktop: 'w-full max-w-7xl',
    tablet: 'w-[768px] min-h-[960px] border-4 border-[#2A201A] rounded-3xl shadow-2xl overflow-hidden',
    mobile: 'w-[390px] min-h-[800px] border-4 border-[#2A201A] rounded-[36px] shadow-2xl overflow-hidden',
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#100B08] text-[#FFF7F0] select-none overflow-hidden font-sans">
      
      {/* ========================================================= */}
      {/* 1. TOP TOOLBAR                                            */}
      {/* ========================================================= */}
      <header className="h-14 border-b border-[rgba(255,179,107,0.18)] bg-[#17110D] px-4 flex items-center justify-between z-30 flex-shrink-0">
        
        {/* Left: Brand, Back, Page Switcher */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/admin/website-management')}
            className="p-1.5 rounded-lg bg-[#211811] hover:bg-[#FF6A00]/20 hover:text-[#FFB36B] text-[#C4B3A7] transition-colors border border-[rgba(255,179,107,0.15)] flex items-center gap-1.5 text-xs font-mono"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden md:inline">Dashboard</span>
          </button>

          <div className="h-4 w-px bg-[rgba(255,179,107,0.2)]" />

          {/* Page Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#948277] font-mono hidden sm:inline">Halaman:</span>
            <select
              value={activePageId}
              onChange={(e) => setActivePageId(e.target.value)}
              className="bg-[#211811] border border-[rgba(255,179,107,0.25)] text-[#FFF7F0] text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
            >
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {activePage?.status === 'published' ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                PUBLISHED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                DRAFT
              </span>
            )}
            {hasUnsavedChanges && (
              <span className="text-[10px] text-[#FFB36B] animate-pulse">
                • Ada perubahan belum disimpan
              </span>
            )}
          </div>
        </div>

        {/* Center: Viewport & Undo/Redo & Preview */}
        <div className="flex items-center space-x-2">
          {/* Viewport Switcher */}
          <div className="bg-[#211811] border border-[rgba(255,179,107,0.18)] rounded-lg p-0.5 flex items-center">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewport === 'desktop' ? 'bg-[#FF6A00] text-white' : 'text-[#C4B3A7] hover:text-white'
              }`}
              title="Desktop View (100%)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewport === 'tablet' ? 'bg-[#FF6A00] text-white' : 'text-[#C4B3A7] hover:text-white'
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewport === 'mobile' ? 'bg-[#FF6A00] text-white' : 'text-[#C4B3A7] hover:text-white'
              }`}
              title="Mobile View (390px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`p-1.5 rounded-lg border border-[rgba(255,179,107,0.15)] ${
                historyIndex > 0 ? 'bg-[#211811] text-[#FFF7F0] hover:bg-white/10' : 'opacity-40 cursor-not-allowed text-[#948277]'
              }`}
              title="Undo (Urungkan)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`p-1.5 rounded-lg border border-[rgba(255,179,107,0.15)] ${
                historyIndex < history.length - 1 ? 'bg-[#211811] text-[#FFF7F0] hover:bg-white/10' : 'opacity-40 cursor-not-allowed text-[#948277]'
              }`}
              title="Redo (Ulangi)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Preview Toggle */}
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isPreviewMode 
                ? 'bg-[#FF6A00] border-[#FF6A00] text-white shadow-orange-glow' 
                : 'bg-[#211811] border-[rgba(255,179,107,0.18)] text-[#C4B3A7] hover:text-white'
            }`}
          >
            {isPreviewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isPreviewMode ? 'Keluar Preview' : 'Preview'}</span>
          </button>
        </div>

        {/* Right: Modals, Save, Publish */}
        <div className="flex items-center space-x-2">
          {/* Asset Manager Button */}
          <button
            onClick={() => setIsAssetModalOpen(true)}
            className="p-1.5 rounded-lg bg-[#211811] hover:bg-[#FF6A00]/20 hover:text-[#FFB36B] text-[#C4B3A7] border border-[rgba(255,179,107,0.15)] transition-colors"
            title="Kelola Aset & Gambar"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Version History Button */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="p-1.5 rounded-lg bg-[#211811] hover:bg-[#FF6A00]/20 hover:text-[#FFB36B] text-[#C4B3A7] border border-[rgba(255,179,107,0.15)] transition-colors"
            title="Riwayat Versi Publikasi"
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Reset Page Button */}
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="p-1.5 rounded-lg bg-[#211811] hover:bg-red-500/20 hover:text-red-300 text-[#948277] border border-[rgba(255,179,107,0.15)] transition-colors"
            title="Reset Halaman ke Template Awal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Save Draft Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveDraft}
            className="text-xs gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Simpan Draft</span>
          </Button>

          {/* Publish Button */}
          <Button
            variant="glow"
            size="sm"
            onClick={() => setIsPublishModalOpen(true)}
            className="text-xs gap-1.5 font-bold"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publikasikan</span>
          </Button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MAIN WORKSPACE (LEFT PANEL + CANVAS + RIGHT PANEL)     */}
      {/* ========================================================= */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* --------------------------------------------------------- */}
        {/* A. LEFT SIDEBAR PANEL                                    */}
        {/* --------------------------------------------------------- */}
        {!isPreviewMode && (
          <aside className="w-72 sm:w-80 border-r border-[rgba(255,179,107,0.18)] bg-[#17110D] flex flex-col z-20 flex-shrink-0">
            {/* Tab Header */}
            <div className="grid grid-cols-3 border-b border-[rgba(255,179,107,0.15)] text-xs font-mono">
              <button
                onClick={() => setLeftTab('layers')}
                className={`py-3 flex flex-col items-center gap-1 border-b-2 transition-colors ${
                  leftTab === 'layers'
                    ? 'border-[#FF6A00] text-[#FFB36B] bg-[#211811]'
                    : 'border-transparent text-[#948277] hover:text-[#FFF7F0]'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Layers</span>
              </button>
              <button
                onClick={() => setLeftTab('components')}
                className={`py-3 flex flex-col items-center gap-1 border-b-2 transition-colors ${
                  leftTab === 'components'
                    ? 'border-[#FF6A00] text-[#FFB36B] bg-[#211811]'
                    : 'border-transparent text-[#948277] hover:text-[#FFF7F0]'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Komponen</span>
              </button>
              <button
                onClick={() => setLeftTab('pages')}
                className={`py-3 flex flex-col items-center gap-1 border-b-2 transition-colors ${
                  leftTab === 'pages'
                    ? 'border-[#FF6A00] text-[#FFB36B] bg-[#211811]'
                    : 'border-transparent text-[#948277] hover:text-[#FFF7F0]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Halaman</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* TAB 1: LAYERS (ELEMENT TREE) */}
              {leftTab === 'layers' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-[#948277]">
                    <span>STRUKTUR SECTION ({activePage?.elements.length})</span>
                    <button
                      onClick={() => handleAddComponent('section')}
                      className="text-[#FFB36B] hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Plus className="w-3 h-3" /> Tambah Section
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {activePage?.elements.map((el, idx) => {
                      const isSelected = selectedElementId === el.id;
                      const def = COMPONENT_DEFINITIONS[el.type] || {};

                      return (
                        <div
                          key={el.id}
                          className={`rounded-xl border transition-all overflow-hidden ${
                            isSelected
                              ? 'bg-[#211811] border-[#FF6A00]'
                              : 'bg-[#1C1410] border-[rgba(255,179,107,0.12)] hover:border-[rgba(255,179,107,0.3)]'
                          }`}
                        >
                          <div
                            onClick={() => setSelectedElementId(el.id)}
                            className="p-2.5 flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-mono text-[#948277]">{idx + 1}.</span>
                              <span className="text-xs font-bold text-[#FFF7F0] truncate">
                                {el.props?.name || def.label || el.type}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {/* Reorder Buttons */}
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveElement(el.id, 'up');
                                  }}
                                  className="p-1 text-[#948277] hover:text-white"
                                  title="Naik"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                              )}
                              {idx < activePage.elements.length - 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveElement(el.id, 'down');
                                  }}
                                  className="p-1 text-[#948277] hover:text-white"
                                  title="Turun"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteElement(el.id);
                                }}
                                className="p-1 text-[#948277] hover:text-red-400"
                                title="Hapus"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Children inside Section */}
                          {el.children && el.children.length > 0 && (
                            <div className="pl-6 pr-2 pb-2 space-y-1 bg-[#17110D]/50 border-t border-[rgba(255,179,107,0.06)]">
                              {el.children.map((child, cIdx) => {
                                const isChildSelected = selectedElementId === child.id;
                                const childDef = COMPONENT_DEFINITIONS[child.type] || {};

                                return (
                                  <div
                                    key={child.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedElementId(child.id);
                                    }}
                                    className={`p-1.5 rounded-lg flex items-center justify-between text-[11px] cursor-pointer ${
                                      isChildSelected
                                        ? 'bg-[#FF6A00]/20 text-[#FFB36B] border border-[#FF6A00]/40'
                                        : 'text-[#C4B3A7] hover:bg-white/5'
                                    }`}
                                  >
                                    <span className="truncate">
                                      └ {childDef.label || child.type}
                                    </span>
                                    <div className="flex items-center gap-1 opacity-0 hover:opacity-100">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteElement(child.id);
                                        }}
                                        className="text-[#948277] hover:text-red-400"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: COMPONENTS (CATALOG) */}
              {leftTab === 'components' && (
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#948277]" />
                    <input
                      type="text"
                      placeholder="Cari komponen..."
                      value={componentSearch}
                      onChange={(e) => setComponentSearch(e.target.value)}
                      className="w-full bg-[#211811] border border-[rgba(255,179,107,0.2)] rounded-xl pl-9 pr-3 py-2 text-xs text-[#FFF7F0] placeholder-[#948277] focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
                    />
                  </div>

                  {/* Categories */}
                  {COMPONENT_CATEGORIES.map((cat) => {
                    const comps = Object.values(COMPONENT_DEFINITIONS).filter(
                      (c) =>
                        c.category === cat.id &&
                        (!componentSearch ||
                          c.label.toLowerCase().includes(componentSearch.toLowerCase()) ||
                          c.description.toLowerCase().includes(componentSearch.toLowerCase()))
                    );

                    if (comps.length === 0) return null;

                    return (
                      <div key={cat.id} className="space-y-2">
                        <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#948277]">
                          {cat.label}
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {comps.map((comp) => {
                            const Icon = comp.icon;
                            return (
                              <button
                                key={comp.type}
                                onClick={() => handleAddComponent(comp.type)}
                                className="p-3 bg-[#1C1410] hover:bg-[#211811] border border-[rgba(255,179,107,0.15)] hover:border-[#FF7A1A] rounded-xl text-left flex items-start gap-3 transition-all group"
                              >
                                <div className="p-2 rounded-lg bg-[#211811] group-hover:bg-[#FF6A00]/20 text-[#FFB36B] transition-colors flex-shrink-0">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-[#FFF7F0] group-hover:text-[#FFB36B] transition-colors leading-tight">
                                    {comp.label}
                                  </div>
                                  <div className="text-[11px] text-[#948277] line-clamp-1 mt-0.5 font-sans">
                                    {comp.description}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 3: PAGES (LIST & ADD) */}
              {leftTab === 'pages' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-[#948277]">
                    <span>HALAMAN TERSEDIA ({pages.length})</span>
                    <button
                      onClick={() => setIsNewPageModalOpen(true)}
                      className="text-[#FFB36B] hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Plus className="w-3 h-3" /> Halaman Baru
                    </button>
                  </div>

                  <div className="space-y-2">
                    {pages.map((p) => (
                      <div
                        key={p.id}
                        className={`p-3 rounded-xl border transition-all ${
                          activePageId === p.id
                            ? 'bg-[#211811] border-[#FF6A00]'
                            : 'bg-[#1C1410] border-[rgba(255,179,107,0.12)] hover:border-[rgba(255,179,107,0.3)]'
                        }`}
                      >
                        <div
                          onClick={() => setActivePageId(p.id)}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <div className="text-xs font-bold text-[#FFF7F0] leading-tight">
                              {p.title}
                            </div>
                            <div className="text-[10px] font-mono text-[#948277] mt-0.5">
                              Slug: {p.slug}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                              p.status === 'published'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-amber-500/15 text-amber-400'
                            }`}
                          >
                            {p.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Action buttons for custom page */}
                        {!['home', 'about', 'competitions', 'timeline', 'faq', 'contact'].includes(p.id) && (
                          <div className="pt-2 mt-2 border-t border-[rgba(255,179,107,0.1)] flex justify-end">
                            <button
                              onClick={() => handleDeletePage(p.id)}
                              className="text-[10px] font-mono text-red-400 hover:text-red-300 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Hapus Halaman
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </aside>
        )}

        {/* --------------------------------------------------------- */}
        {/* B. CENTER CANVAS WORKSPACE                               */}
        {/* --------------------------------------------------------- */}
        <main
          onClick={() => setSelectedElementId(null)}
          className="flex-1 bg-[#0D0907] overflow-y-auto p-4 sm:p-8 flex flex-col items-center relative"
        >
          {/* Top Breadcrumb indicator */}
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C1410] border border-[rgba(255,179,107,0.18)] text-xs font-mono text-[#948277]">
            <span>CANVAS: {viewport.toUpperCase()}</span>
            <span>•</span>
            <span className="text-[#FFB36B]">{activePage?.title}</span>
            <span>({activePage?.slug})</span>
          </div>

          {/* Device Frame Viewport Container */}
          <div className={`${viewportClasses[viewport]} bg-[#100B08] transition-all duration-300 relative min-h-screen`}>
            {activePage && (
              <DynamicPageRenderer
                page={activePage}
                isEditMode={!isPreviewMode}
                selectedId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onDeleteElement={handleDeleteElement}
                onDuplicateElement={handleDuplicateElement}
                onMoveElement={handleMoveElement}
                onInlineTextChange={(id, prop, val) => updateElementProps(id, { [prop]: val })}
              />
            )}

            {/* Bottom Add Section Dropzone */}
            {!isPreviewMode && (
              <div className="p-8 border-2 border-dashed border-[rgba(255,179,107,0.2)] hover:border-[#FF6A00] rounded-2xl m-4 text-center transition-colors">
                <button
                  type="button"
                  onClick={() => handleAddComponent('section')}
                  className="px-4 py-2 rounded-xl bg-[#211811] hover:bg-[#FF6A00] hover:text-white border border-[rgba(255,179,107,0.3)] text-xs font-mono font-bold text-[#FFB36B] transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Section Baru ke Halaman Ini</span>
                </button>
              </div>
            )}
          </div>
        </main>

        {/* --------------------------------------------------------- */}
        {/* C. RIGHT PROPERTY INSPECTOR PANEL                        */}
        {/* --------------------------------------------------------- */}
        {!isPreviewMode && (
          <aside className="w-80 border-l border-[rgba(255,179,107,0.18)] bg-[#17110D] flex flex-col z-20 flex-shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-[rgba(255,179,107,0.15)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#FFB36B]" />
                <h3 className="text-xs font-mono font-bold text-[#FFF7F0] uppercase tracking-wider">
                  Inspector Properti
                </h3>
              </div>
              {selectedElement && (
                <button
                  onClick={() => setSelectedElementId(null)}
                  className="p-1 text-[#948277] hover:text-white"
                  title="Deselect"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Inspector Form Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {selectedElement ? (
                <>
                  {/* Element Meta info */}
                  <div className="p-3 bg-[#1C1410] border border-[rgba(255,179,107,0.15)] rounded-xl space-y-1">
                    <div className="text-[10px] font-mono text-[#948277]">TIPE KOMPONEN:</div>
                    <div className="text-sm font-black font-display text-[#FFB36B]">
                      {COMPONENT_DEFINITIONS[selectedElement.type]?.label || selectedElement.type}
                    </div>
                    <div className="text-[10px] font-mono text-[#948277] truncate">
                      ID: {selectedElement.id}
                    </div>
                  </div>

                  {/* Render Fields from Registry */}
                  <div className="space-y-4">
                    {COMPONENT_DEFINITIONS[selectedElement.type]?.fields?.map((field) => {
                      const val = selectedElement.props?.[field.name] ?? '';

                      return (
                        <div key={field.name} className="space-y-1.5">
                          <label className="text-xs font-mono text-[#C4B3A7] flex items-center justify-between">
                            <span>{field.label}</span>
                          </label>

                          {/* Field: Text Input */}
                          {field.type === 'text' && (
                            <input
                              type="text"
                              value={val}
                              placeholder={field.placeholder || ''}
                              onChange={(e) =>
                                updateElementProps(selectedElement.id, { [field.name]: e.target.value })
                              }
                              className="w-full bg-[#211811] border border-[rgba(255,179,107,0.2)] rounded-lg px-3 py-2 text-xs text-[#FFF7F0] focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
                            />
                          )}

                          {/* Field: Textarea */}
                          {field.type === 'textarea' && (
                            <textarea
                              rows={3}
                              value={val}
                              onChange={(e) =>
                                updateElementProps(selectedElement.id, { [field.name]: e.target.value })
                              }
                              className="w-full bg-[#211811] border border-[rgba(255,179,107,0.2)] rounded-lg px-3 py-2 text-xs text-[#FFF7F0] focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
                            />
                          )}

                          {/* Field: Select Dropdown */}
                          {field.type === 'select' && (
                            <select
                              value={val}
                              onChange={(e) =>
                                updateElementProps(selectedElement.id, { [field.name]: e.target.value })
                              }
                              className="w-full bg-[#211811] border border-[rgba(255,179,107,0.2)] rounded-lg px-3 py-2 text-xs text-[#FFF7F0] focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
                            >
                              {field.options?.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Field: Switch */}
                          {field.type === 'switch' && (
                            <label className="flex items-center gap-2 cursor-pointer pt-1">
                              <input
                                type="checkbox"
                                checked={Boolean(val)}
                                onChange={(e) =>
                                  updateElementProps(selectedElement.id, { [field.name]: e.target.checked })
                                }
                                className="w-4 h-4 rounded text-[#FF6A00] focus:ring-[#FF6A00]"
                              />
                              <span className="text-xs text-[#C4B3A7]">
                                {val ? 'Aktif' : 'Non-aktif'}
                              </span>
                            </label>
                          )}

                          {/* Field: Image Picker */}
                          {field.type === 'image_picker' && (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={val}
                                onChange={(e) =>
                                  updateElementProps(selectedElement.id, { [field.name]: e.target.value })
                                }
                                className="w-full bg-[#211811] border border-[rgba(255,179,107,0.2)] rounded-lg px-3 py-2 text-xs text-[#FFF7F0]"
                              />
                              <button
                                type="button"
                                onClick={() => setIsAssetModalOpen(true)}
                                className="w-full py-1.5 rounded-lg bg-[#211811] hover:bg-[#FF6A00]/20 text-[#FFB36B] border border-[rgba(255,179,107,0.2)] text-xs font-mono"
                              >
                                Pilih dari Asset Library
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions for selected element */}
                  <div className="pt-4 border-t border-[rgba(255,179,107,0.15)] space-y-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDuplicateElement(selectedElement.id)}
                      className="w-full justify-center gap-1.5 text-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplikasi Elemen</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteElement(selectedElement.id)}
                      className="w-full justify-center gap-1.5 text-xs text-red-400 hover:border-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Elemen Ini</span>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#211811] border border-[rgba(255,179,107,0.2)] flex items-center justify-center mx-auto text-[#FFB36B]">
                    <Settings className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-[#FFF7F0]">Tidak Ada Elemen Terpilih</h4>
                  <p className="text-xs text-[#948277] max-w-xs leading-relaxed">
                    Klik elemen mana saja pada canvas atau pilih dari panel Layers untuk mengedit properti visual dan kontennya.
                  </p>
                </div>
              )}
            </div>
          </aside>
        )}

      </div>

      {/* ========================================================= */}
      {/* 3. MODALS                                                 */}
      {/* ========================================================= */}

      {/* MODAL: ASSET MANAGER */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#17110D] border border-[rgba(255,179,107,0.25)] rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-[rgba(255,179,107,0.15)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#FF6A00]" />
                <h3 className="text-base font-bold font-display text-[#FFF7F0]">
                  Asset Library Manager
                </h3>
              </div>
              <button onClick={() => setIsAssetModalOpen(false)} className="text-[#948277] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-5">
              {/* Upload trigger */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#C4B3A7]">
                  Pilih gambar terkurasi atau unggah aset visual baru (Maks. 5MB).
                </p>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleAssetUpload} className="hidden" />
                  <span className="px-3 py-1.5 rounded-xl bg-[#FF6A00] hover:bg-[#FF7A1A] text-white text-xs font-bold font-mono inline-flex items-center gap-1.5 transition-colors shadow-orange-glow">
                    <Upload className="w-3.5 h-3.5" /> Unggah Gambar
                  </span>
                </label>
              </div>

              {/* Grid of Assets */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {assets.map((ast) => (
                  <div
                    key={ast.id}
                    onClick={() => {
                      if (selectedElement) {
                        updateElementProps(selectedElement.id, { url: ast.url });
                        showToast(`Gambar "${ast.name}" berhasil diterapkan!`);
                        setIsAssetModalOpen(false);
                      }
                    }}
                    className="group bg-[#1C1410] border border-[rgba(255,179,107,0.15)] hover:border-[#FF6A00] rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-amber-subtle"
                  >
                    <div className="aspect-video bg-[#100B08] overflow-hidden relative">
                      <img src={ast.url} alt={ast.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="p-3">
                      <div className="text-xs font-bold text-[#FFF7F0] truncate">{ast.name}</div>
                      <div className="text-[10px] font-mono text-[#948277] flex items-center justify-between mt-1">
                        <span>{ast.size}</span>
                        <span className="uppercase text-[#FFB36B]">{ast.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-[rgba(255,179,107,0.15)] bg-[#100B08] flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setIsAssetModalOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VERSION HISTORY */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#17110D] border border-[rgba(255,179,107,0.25)] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-[rgba(255,179,107,0.15)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#FF6A00]" />
                <h3 className="text-base font-bold font-display text-[#FFF7F0]">
                  Riwayat Versi Publikasi ({activePage?.title})
                </h3>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-[#948277] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              {mockService.getBuilderSnapshots(activePage?.id).length > 0 ? (
                mockService.getBuilderSnapshots(activePage?.id).map((snp) => (
                  <div
                    key={snp.id}
                    className="p-4 bg-[#1C1410] border border-[rgba(255,179,107,0.15)] rounded-2xl flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#FFB36B]">{snp.version}</span>
                        <span className="text-xs text-[#FFF7F0] font-semibold">{snp.note}</span>
                      </div>
                      <div className="text-[11px] text-[#948277] font-mono mt-1">
                        Diterbitkan oleh {snp.publishedBy} • {new Date(snp.publishedAt).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRestoreSnapshot(snp.id)}
                      className="text-xs font-mono"
                    >
                      Pulihkan
                    </Button>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-[#948277] font-mono">
                  Belum ada snapshot publikasi untuk halaman ini. Snapshot otomatis dibuat saat Anda menekan tombol Publikasikan.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[rgba(255,179,107,0.15)] bg-[#100B08] flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setIsHistoryModalOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PUBLISH CONFIRMATION */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#17110D] border border-[#FF6A00]/40 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6A00]/15 text-[#FFB36B] flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold font-display text-[#FFF7F0]">
                Publikasikan Perubahan ke Website Publik?
              </h3>
              <p className="text-xs text-[#C4B3A7] leading-relaxed">
                Seluruh perubahan draft pada halaman <strong>{activePage?.title}</strong> ({activePage?.slug}) akan segera disiarkan ke pengunjung website publik.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setIsPublishModalOpen(false)}
                className="w-1/2 justify-center"
              >
                Batal
              </Button>
              <Button
                variant="glow"
                size="md"
                onClick={handlePublishPage}
                className="w-1/2 justify-center font-bold"
              >
                Ya, Publikasikan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET CONFIRMATION */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#17110D] border border-red-500/40 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold font-display text-[#FFF7F0]">
                Reset Halaman ke Template Asli?
              </h3>
              <p className="text-xs text-[#C4B3A7] leading-relaxed">
                Tindakan ini akan mengembalikan seluruh section halaman <strong>{activePage?.title}</strong> ke susunan baku pabrikan. Seluruh editan kustom yang belum disimpan akan hilang.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setIsResetConfirmOpen(false)}
                className="w-1/2 justify-center"
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleResetToDefault}
                className="w-1/2 justify-center font-bold"
              >
                Reset Sekarang
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW PAGE */}
      {isNewPageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePage}
            className="bg-[#17110D] border border-[rgba(255,179,107,0.25)] rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-display text-[#FFF7F0]">
                Buat Halaman Kustom Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsNewPageModalOpen(false)}
                className="text-[#948277] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#C4B3A7]">Judul Halaman</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Ketentuan Lomba Khusus"
                  value={newPageForm.title}
                  onChange={(e) => setNewPageForm({ ...newPageForm, title: e.target.value })}
                  className="w-full bg-[#211811] border border-[rgba(255,179,107,0.2)] rounded-xl px-3 py-2 text-xs text-[#FFF7F0]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#C4B3A7]">Slug URL (misal: /ketentuan)</label>
                <input
                  type="text"
                  required
                  placeholder="/ketentuan-khusus"
                  value={newPageForm.slug}
                  onChange={(e) => setNewPageForm({ ...newPageForm, slug: e.target.value })}
                  className="w-full bg-[#211811] border border-[rgba(255,179,107,0.2)] rounded-xl px-3 py-2 text-xs text-[#FFF7F0]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#C4B3A7]">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi tujuan halaman..."
                  value={newPageForm.description}
                  onChange={(e) => setNewPageForm({ ...newPageForm, description: e.target.value })}
                  className="w-full bg-[#211811] border border-[rgba(255,179,107,0.2)] rounded-xl px-3 py-2 text-xs text-[#FFF7F0]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setIsNewPageModalOpen(false)}
              >
                Batal
              </Button>
              <Button variant="glow" size="sm" type="submit" className="font-bold">
                Buat Halaman
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* FLOATING NOTIFICATION TOAST */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm">
          <div
            className={`p-3.5 rounded-2xl border shadow-2xl flex items-center gap-3 text-xs font-mono backdrop-blur-md ${
              notification.type === 'error'
                ? 'bg-red-950/90 border-red-500/50 text-red-200'
                : 'bg-[#1C1410]/95 border-[#FF6A00] text-[#FFF7F0]'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default WebsiteEditorPage;
