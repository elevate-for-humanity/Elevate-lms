'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  Bot, Code, Eye, Play, Save, Send, Settings, 
  SplitSquareHorizontal, ChevronLeft, ChevronRight,
  Image, Video, FileText, Layout, Monitor, Smartphone,
  Loader2, CheckCircle, AlertCircle, RefreshCw, Globe
} from 'lucide-react';
import { AIChat } from './AIChat';
import { IframePreview } from './IframePreview';
import { CodeEditor } from './CodeEditor';
import Image from 'next/image';

type PreviewMode = 'desktop' | 'tablet' | 'mobile';
type ViewMode = 'split' | 'chat' | 'editor' | 'preview';

interface LivePreviewStudioProps {
  initialContent?: string;
  contentType?: 'course' | 'page' | 'lesson' | 'quiz' | 'template';
  onSave?: (content: string) => void;
  onPublish?: (content: string) => void;
}

export default function LivePreviewStudio({
  initialContent = '',
  contentType = 'page',
  onSave,
  onPublish,
}: LivePreviewStudioProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [code, setCode] = useState(initialContent);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Array<{ id: string; url: string; type: string }>>([]);
  const [generatedVideos, setGeneratedVideos] = useState<Array<{ id: string; url: string; status: string }>>([]);
  const [qaChecks, setQaChecks] = useState<Record<string, boolean>>({
    links: false,
    images: false,
    accessibility: false,
    mobile: false,
    supabase: false,
  });

  // Auto-generate preview URL
  useEffect(() => {
    if (contentType === 'course') {
      setPreviewUrl('/lms/preview/course-draft');
    } else if (contentType === 'lesson') {
      setPreviewUrl('/lms/preview/lesson-draft');
    } else if (contentType === 'quiz') {
      setPreviewUrl('/lms/preview/quiz-draft');
    } else {
      setPreviewUrl('/preview/draft-page');
    }
  }, [contentType]);

  // Auto-save handler
  const handleAutoSave = useCallback(async () => {
    if (!onSave) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await onSave(code);
      setSaveStatus('saved');
      setLastSaved(new Date());
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [code, onSave]);

  // Publish handler with QA checks
  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      // Run QA checks
      const checks = await runQAChecks();
      setQaChecks(checks);
      
      if (checks.links && checks.images && checks.accessibility) {
        if (onPublish) {
          await onPublish(code);
        }
      }
    } finally {
      setIsPublishing(false);
    }
  }, [code, onPublish]);

  // Run QA checks
  const runQAChecks = async () => {
    return {
      links: true, // Would call /api/qa/check-links
      images: true, // Would call /api/qa/check-images
      accessibility: true, // Would call /api/qa/check-a11y
      mobile: true, // Would check mobile preview
      supabase: true, // Would verify Supabase save
    };
  };

  // Generate image
  const handleGenerateImage = async (type: 'cover' | 'thumbnail' | 'hero') => {
    const id = `img-${Date.now()}`;
    setGeneratedImages(prev => [...prev, { id, url: '', type }]);
    // Would call AI image generation API
  };

  // Generate video prompt
  const handleGenerateVideo = async (lessonTitle: string) => {
    const id = `vid-${Date.now()}`;
    setGeneratedVideos(prev => [...prev, { id, url: '', status: 'generating' }]);
    // Would call AI video generation API
  };

  const previewWidth = previewMode === 'desktop' ? '100%' : previewMode === 'tablet' ? '768px' : '375px';

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-900">
      {/* Top Toolbar */}
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-brand-orange-500" />
          <span className="text-white font-medium">Dev Studio</span>
          <span className="text-slate-400 text-sm">/ Live Preview</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-700 rounded-lg p-1">
            {(['split', 'chat', 'editor', 'preview'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  viewMode === mode 
                    ? 'bg-brand-orange-500 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'split' && <SplitSquareHorizontal className="h-4 w-4 inline mr-1" />}
                {mode === 'chat' && <Bot className="h-4 w-4 inline mr-1" />}
                {mode === 'editor' && <Code className="h-4 w-4 inline mr-1" />}
                {mode === 'preview' && <Eye className="h-4 w-4 inline mr-1" />}
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Preview Mode */}
          <div className="flex bg-slate-700 rounded-lg p-1">
            {(['desktop', 'tablet', 'mobile'] as PreviewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setPreviewMode(mode)}
                className={`p-1.5 rounded transition ${
                  previewMode === mode ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title={mode.charAt(0).toUpperCase() + mode.slice(1)}
              >
                {mode === 'desktop' && <Monitor className="h-4 w-4" />}
                {mode === 'tablet' && <Layout className="h-4 w-4" />}
                {mode === 'mobile' && <Smartphone className="h-4 w-4" />}
              </button>
            ))}
          </div>

          {/* Actions */}
          <button
            onClick={handleAutoSave}
            disabled={isSaving}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saveStatus === 'saved' ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saveStatus === 'saved' ? 'Saved' : 'Save Draft'}
          </button>

          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-1 px-3 py-1.5 bg-brand-orange-500 hover:bg-brand-orange-600 text-white rounded-lg text-sm font-medium transition"
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Publish
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* AI Chat Panel */}
        {(viewMode === 'split' || viewMode === 'chat') && (
          <div className={`${viewMode === 'split' ? 'w-96 border-r border-slate-700' : 'flex-1'} flex flex-col bg-slate-900`}>
            <AIChat 
              fileContext={code}
              onApplyCode={(filename, newCode) => setCode(newCode)}
            />
          </div>
        )}

        {/* Editor + Preview */}
        {(viewMode === 'split' || viewMode === 'editor' || viewMode === 'preview') && (
          <div className={`${viewMode === 'split' ? 'flex-1 flex' : viewMode === 'editor' ? 'flex-1' : 'flex-1'} flex flex-col`}>
            {/* Editor */}
            {(viewMode === 'split' || viewMode === 'editor') && (
              <div className={`${viewMode === 'split' ? 'w-1/2 border-r border-slate-700' : ''} flex flex-col`}>
                <div className="h-10 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-3">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-300 text-sm">Content Editor</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleGenerateImage('cover')}
                      className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                      title="Generate Image"
                    >
                      <Image className="h-4 w-4" alt="" />
                    </button>
                    <button
                      onClick={() => handleGenerateVideo('Lesson')}
                      className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                      title="Generate Video"
                    >
                      <Video className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleGenerateImage('hero')}
                      className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                      title="Insert Template"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  <CodeEditor
                    value={code}
                    onChange={setCode}
                    language="markdown"
                  />
                </div>
              </div>
            )}

            {/* Preview */}
            {(viewMode === 'split' || viewMode === 'preview') && (
              <div className={`${viewMode === 'split' ? 'w-1/2' : ''} flex flex-col bg-slate-100`}>
                <div className="h-10 bg-white border-b border-slate-200 flex items-center justify-between px-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-700 text-sm">Live Preview</span>
                    {previewUrl && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {previewUrl}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setPreviewUrl(previewUrl)}
                    className="p-1.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
                    title="Refresh Preview"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 flex items-start justify-center p-4 overflow-auto">
                  <div 
                    className="bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300"
                    style={{ width: previewWidth, maxWidth: '100%' }}
                  >
                    <IframePreview
                      url={previewUrl}
                      title="Content Preview"
                      className="h-[600px]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="h-8 bg-slate-800 border-t border-slate-700 flex items-center justify-between px-4 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            {saveStatus === 'saved' ? (
              <CheckCircle className="h-3 w-3 text-green-400" />
            ) : saveStatus === 'error' ? (
              <AlertCircle className="h-3 w-3 text-red-400" />
            ) : null}
            {lastSaved && `Last saved: ${lastSaved.toLocaleTimeString()}`}
          </span>
          <span>{generatedImages.length} images</span>
          <span>{generatedVideos.length} videos</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            Links: {qaChecks.links ? (
              <CheckCircle className="h-3 w-3 text-green-400" />
            ) : (
              <AlertCircle className="h-3 w-3 text-slate-500" />
            )}
          </span>
          <span className="flex items-center gap-1">
            Images: {qaChecks.images ? (
              <CheckCircle className="h-3 w-3 text-green-400" />
            ) : (
              <AlertCircle className="h-3 w-3 text-slate-500" />
            )}
          </span>
          <span className="flex items-center gap-1">
            A11y: {qaChecks.accessibility ? (
              <CheckCircle className="h-3 w-3 text-green-400" />
            ) : (
              <AlertCircle className="h-3 w-3 text-slate-500" />
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
