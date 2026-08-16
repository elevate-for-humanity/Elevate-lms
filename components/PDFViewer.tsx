'use client';

/**
 * PDFViewer
 * 
 * Component for viewing and downloading PDF documents.
 * Supports MOU viewing, certificate viewing, and general document viewing.
 * Connects to Supabase Storage with authentication.
 * 
 * Usage:
 *   <PDFViewer url="/documents/mou.pdf" title="MOU Document" />
 *   <PDFViewer 
 *     storageBucket="documents" 
 *     storagePath="mous/mou-123.pdf" 
 *     title="MOU Document"
 *     requireAuth
 *   />
 */

import { useState, useEffect } from 'react';
import { FileText, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, Lock, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getBrowserPublicStorageUrl } from '@/lib/supabase/public-config';

interface PDFViewerProps {
  // Direct URL mode
  url?: string;
  // Supabase Storage mode
  storageBucket?: string;
  storagePath?: string;
  // Display options
  title?: string;
  showDownload?: boolean;
  showPagination?: boolean;
  className?: string;
  // Auth options
  requireAuth?: boolean;
  onAuthRequired?: () => void;
  onAuthSuccess?: () => void;
  // Fallback
  fallbackMessage?: string;
}

export function PDFViewer({
  url,
  storageBucket,
  storagePath,
  title,
  showDownload = true,
  showPagination = true,
  className = '',
  requireAuth = false,
  onAuthRequired,
  onAuthSuccess,
  fallbackMessage = 'No document specified',
}: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check authentication and get document URL
  useEffect(() => {
    async function loadDocument() {
      setCheckingAuth(true);
      
      try {
        // If direct URL is provided, use it
        if (url) {
          setDocumentUrl(url);
          setLoading(false);
          setCheckingAuth(false);
          return;
        }

        // If Supabase Storage mode
        if (storageBucket && storagePath) {
          const supabase = createClient();
          
          // Check authentication if required
          if (requireAuth) {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
              setError('Authentication required to view this document');
              onAuthRequired?.();
              setCheckingAuth(false);
              return;
            }
            
            setIsAuthenticated(true);
            onAuthSuccess?.();
          }

          // Get signed URL for private documents
          const { data, error: storageError } = await supabase.storage
            .from(storageBucket)
            .createSignedUrl(storagePath, 3600); // 1 hour

          if (storageError) {
            // Try public URL as fallback
            const publicUrl = getBrowserPublicStorageUrl(storageBucket, storagePath);
            setDocumentUrl(publicUrl);
          } else if (data) {
            setDocumentUrl(data.signedUrl);
          }
        } else {
          setError('No document URL or storage path provided');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setLoading(false);
        setCheckingAuth(false);
      }
    }

    loadDocument();
  }, [url, storageBucket, storagePath, requireAuth, onAuthRequired, onAuthSuccess]);

  // Loading state
  if (checkingAuth || loading) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-8 ${className}`}>
        <Loader2 className="w-8 h-8 text-brand-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 text-center">Loading document...</p>
      </div>
    );
  }

  // No document specified
  if (!url && !storageBucket && !storagePath) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-8 ${className}`}>
        <FileText className="w-12 h-12 text-slate-300 mb-4" />
        <p className="text-slate-500 text-center">{fallbackMessage}</p>
      </div>
    );
  }

  // Auth required but not authenticated
  if (requireAuth && !isAuthenticated && error) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-8 ${className}`}>
        <Lock className="w-12 h-12 text-slate-300 mb-4" />
        <p className="text-slate-500 text-center mb-4">{error}</p>
        <button
          onClick={onAuthRequired}
          className="px-4 py-2 bg-brand-blue-600 text-white rounded-md hover:bg-brand-blue-700 transition-colors"
        >
          Sign In to View
        </button>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 ${className}`}>
        <AlertCircle className="w-12 h-12 text-red-300 mb-4" />
        <p className="text-red-600 text-center">{error}</p>
      </div>
    );
  }

  const handleDownload = async () => {
    if (!documentUrl) return;
    
    setLoading(true);
    try {
      const response = await fetch(documentUrl);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          onAuthRequired?.();
          return;
        }
        throw new Error('Failed to download document');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = title || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setLoading(false);
    }
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3.0));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));

  return (
    <div className={`flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden ${className}`}>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 text-slate-500 flex-shrink-0" />
            <h3 className="font-medium text-slate-900 truncate">{title}</h3>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {/* Zoom controls */}
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-600 min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            
            {/* Download button */}
            {showDownload && (
              <button
                onClick={handleDownload}
                disabled={loading}
                className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-blue-600 text-white hover:bg-brand-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">Download</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* PDF Embed */}
      <div className="flex-1 overflow-auto bg-slate-100 p-4">
        <div 
          className="mx-auto bg-white shadow-lg"
          style={{ 
            width: `${612 * scale}px`, 
            minHeight: `${792 * scale}px` 
          }}
        >
          {documentUrl && (
            <iframe
              src={documentUrl}
              className="w-full h-full"
              style={{ height: `${792 * scale}px` }}
              title={title || 'PDF Document'}
            />
          )}
        </div>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 0 && (
        <div className="flex items-center justify-center gap-4 border-t border-slate-200 bg-slate-50 px-4 py-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
