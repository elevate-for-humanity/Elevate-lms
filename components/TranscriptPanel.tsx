"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useState, useRef, useEffect } from 'react';
import { Search, Download, ChevronDown, ChevronUp } from 'lucide-react';

interface TranscriptSegment {
  timestamp: number; // in seconds
  text: string;
}

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
  currentTime?: number;
  onSeek?: (time: number) => void;
  className?: string;
  videoId?: string;
}

export function TranscriptPanel({
  segments,
  currentTime = 0,
  onSeek,
  className = '',
  videoId
}: TranscriptPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const activeSegmentRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Log transcript search for analytics
  const logTranscriptSearch = async (query: string) => {
    if (!query.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('transcript_search_log')
      .insert({
        user_id: user?.id,
        video_id: videoId,
        query: query.trim(),
        searched_at: new Date().toISOString()
      });
  };

  // Auto scroll to active segment
  useEffect(() => {
    if (activeSegmentRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadTranscript = () => {
    const text = segments
      .map(seg => `[${formatTime(seg.timestamp)}] ${seg.text}`)
      .join('\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSegments = segments.filter(seg =>
    seg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActiveSegmentIndex = () => {
    return segments.findIndex((seg, i) => {
      const nextSeg = segments[i + 1];
      return currentTime >= seg.timestamp && (!nextSeg || currentTime < nextSeg.timestamp);
    });
  };

  const activeIndex = getActiveSegmentIndex();

  return (
    <div className={`bg-white rounded-lg border border-slate-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 font-semibold text-black hover:text-brand-orange-600 transition"
        >
          <span>Transcript</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={downloadTranscript}
          className="flex items-center gap-2 text-sm text-black hover:text-brand-orange-600 transition"
          title="Download transcript"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Download</span>
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Search */}
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search transcript..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            {searchQuery && (
              <p className="mt-2 text-xs text-black">
                Found {filteredSegments.length} result{filteredSegments.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Transcript Content */}
          <div className="max-h-96 overflow-y-auto p-4 space-y-3">
            {filteredSegments.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                No results found for "{searchQuery}"
              </p>
            ) : (
              filteredSegments.map((segment, index) => {
                const originalIndex = segments.indexOf(segment);
                const isActive = originalIndex === activeIndex;

                return (
                  <div
                    key={index}
                    ref={isActive ? activeSegmentRef : null}
                    className={`group cursor-pointer p-3 rounded-lg transition ${
                      isActive
                        ? 'bg-brand-red-50 border border-brand-red-200'
                        : 'hover:bg-slate-50'
                    }`}
                    onClick={() => onSeek && onSeek(segment.timestamp)}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`text-xs font-mono font-semibold flex-shrink-0 ${
                          isActive ? 'text-brand-orange-600' : 'text-slate-500 group-hover:text-brand-orange-600'
                        }`}
                      >
                        {formatTime(segment.timestamp)}
                      </span>
                      <p
                        className={`text-sm leading-relaxed ${
                          isActive ? 'text-black font-medium' : 'text-black'
                        }`}
                      >
                        {searchQuery ? (
                          <HighlightText text={segment.text} highlight={searchQuery} />
                        ) : (
                          segment.text
                        )}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Helper component to highlight search terms
function HighlightText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) {
    return <>{text}</>;
  }

  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-black">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
