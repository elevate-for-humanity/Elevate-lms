'use client';

import { useState } from 'react';
import { Download, Check, Trash2, Loader2 } from 'lucide-react';
import { useOfflineCourse } from '@/hooks/useOfflineCourse';
import { useI18n } from '@/lib/i18n/context';

interface DownloadOfflineButtonProps {
  courseId: string;
  lessonUrls?: string[];
}

export function DownloadOfflineButton({ courseId, lessonUrls = [] }: DownloadOfflineButtonProps) {
  const { t } = useI18n();
  const {
    isAvailableOffline,
    isCaching,
    cacheProgress,
    error,
    downloadForOffline,
    removeOfflineData,
  } = useOfflineCourse(courseId);

  const [showConfirm, setShowConfirm] = useState(false);

  const handleDownload = async () => {
    const assets = lessonUrls.map(url => ({ url, type: 'page' as const }));
    await downloadForOffline(assets);
  };

  const handleRemove = async () => {
    await removeOfflineData();
    setShowConfirm(false);
  };

  if (isCaching) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{t('offline.downloading')} {cacheProgress}%</span>
      </button>
    );
  }

  if (isAvailableOffline) {
    return (
      <div className="relative">
        {showConfirm ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRemove}
              className="flex items-center gap-2 px-4 py-2 bg-brand-red-100 text-brand-red-700 rounded-lg text-sm hover:bg-brand-red-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Confirm Remove</span>
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-green-100 text-brand-green-700 rounded-lg text-sm hover:bg-brand-green-200 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>{t('offline.availableOffline')}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 px-4 py-2 bg-brand-blue-100 text-brand-blue-700 rounded-lg text-sm hover:bg-brand-blue-200 transition-colors"
      >
        <Download className="w-4 h-4" />
        <span>{t('offline.downloadForOffline')}</span>
      </button>
      {error && (
        <p className="mt-1 text-xs text-brand-red-600">{error}</p>
      )}
    </div>
  );
}
