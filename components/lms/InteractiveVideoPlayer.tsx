
"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  MessageSquare,
  FileText,
  Bookmark,
  SkipBack,
  SkipForward,
} from 'lucide-react';

/* Checkpoint types — exported for callers like /preview/video-quiz */
export type CheckpointType = 'quiz' | 'hotspot' | 'scenario' | 'reflection' | 'key-concept';
interface CheckpointBase { type: CheckpointType; timestamp: number; }
export interface CheckpointQuiz extends CheckpointBase { type: 'quiz'; question: string; options: string[]; answer: number; explanation?: string; }
export interface CheckpointHotspot extends CheckpointBase { type: 'hotspot'; prompt: string; areas: { label: string; correct: boolean; info: string }[]; }
export interface CheckpointScenario extends CheckpointBase { type: 'scenario'; situation: string; choices: { text: string; feedback: string; correct: boolean }[]; }
export interface CheckpointReflection extends CheckpointBase { type: 'reflection'; prompt: string; minChars?: number; }
export interface CheckpointKeyConcept extends CheckpointBase { type: 'key-concept'; concept: string; bullets?: string[]; }
export type Checkpoint = CheckpointQuiz | CheckpointHotspot | CheckpointScenario | CheckpointReflection | CheckpointKeyConcept;

interface VideoQuiz {
  id: string;
  timestamp: number; // seconds
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface VideoNote {
  id: string;
  timestamp: number;
  content: string;
  createdAt: Date;
}

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

interface InteractiveVideoPlayerProps {
  videoUrl: string;
  title: string;
  checkpoints?: Checkpoint[];
  quizzes?: VideoQuiz[];
  transcript?: TranscriptSegment[];
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export default function InteractiveVideoPlayer({
  videoUrl,
  title,
  checkpoints: _checkpoints,
  quizzes = [],
  transcript = [],
  onProgress,
  onComplete,
}: InteractiveVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<VideoQuiz | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState<
    'transcript' | 'notes' | 'resources'
  >('transcript');
  const [showCaptions, setShowCaptions] = useState(false);
  const [currentCaption, setCurrentCaption] = useState('');
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Detect media type from URL
  const isAudioOnly = /\.(mp3|wav|ogg|aac|m4a)(\?|$)/i.test(videoUrl);

  // Load saved notes from database
  useEffect(() => {
    const loadNotes = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Extract lesson ID from video URL or use title
      const id = videoUrl.split('/').pop()?.split('.')[0] || title;
      setLessonId(id);

      const { data } = await supabase
        .from('video_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('video_id', id)
        .order('timestamp', { ascending: true });

      if (data) {
        setNotes(data.map(n => ({
          id: n.id,
          timestamp: n.timestamp,
          content: n.content,
          createdAt: new Date(n.created_at),
        })));
      }
    };
    loadNotes();
  }, [videoUrl, title]);

  // Save note to database
  const saveNote = async () => {
    if (!newNote.trim()) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const note: VideoNote = {
      id: Date.now().toString(),
      timestamp: currentTime,
      content: newNote,
      createdAt: new Date(),
    };

    setNotes([...notes, note]);
    setNewNote('');

    if (user && lessonId) {
      await supabase.from('video_notes').insert({
        user_id: user.id,
        video_id: lessonId,
        timestamp: currentTime,
        content: newNote,
      }).catch(() => {});
    }
  };

  // Save progress to database
  const saveProgress = async (progress: number) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user && lessonId) {
      await supabase.from('video_progress').upsert({
        user_id: user.id,
        video_id: lessonId,
        progress_percent: progress,
        last_position: currentTime,
        updated_at: new Date().toISOString(),
      }).catch(() => {});
    }
  };

  // Check for quizzes at current timestamp
  useEffect(() => {
    const quiz = quizzes.find(
      (q) => Math.abs(q.timestamp - currentTime) < 0.5 && !showQuiz
    );

    if (quiz && isPlaying) {
      setCurrentQuiz(quiz);
      setShowQuiz(true);
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [currentTime, quizzes, showQuiz, isPlaying]);

  // Update caption based on current time
  useEffect(() => {
    if (showCaptions && transcript.length > 0) {
      const segment = transcript.find(
        (s) => currentTime >= s.start && currentTime <= s.end
      );
      setCurrentCaption(segment?.text || '');
    }
  }, [currentTime, transcript, showCaptions]);

  // Store callbacks in refs to avoid re-render churn
  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  const lastProgressRef = useRef(-1);
  const completeFiredRef = useRef(false);

  // Reset progress tracking when video changes
  useEffect(() => {
    lastProgressRef.current = -1;
    completeFiredRef.current = false;
  }, [videoUrl]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const { currentTime: ct, duration: dur } = videoRef.current;
    setCurrentTime(ct);

    if (dur > 0) {
      const pct = Math.round((ct / dur) * 100);

      // Only notify when the rounded percentage actually changes
      if (pct !== lastProgressRef.current) {
        lastProgressRef.current = pct;
        onProgressRef.current?.(pct);

        // Save to DB every 10%
        if (pct % 10 === 0) {
          saveProgress(pct);
        }
      }

      // Fire onComplete once when 95%+ reached
      if (pct >= 95 && !completeFiredRef.current) {
        completeFiredRef.current = true;
        onCompleteRef.current?.();
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const addNote = () => {
    if (newNote.trim()) {
      const note: VideoNote = {
        id: `note-${Date.now()}`,
        timestamp: currentTime,
        content: newNote,
        createdAt: new Date(),
      };
      setNotes([...notes, note]);
      setNewNote('');
    }
  };

  const submitQuizAnswer = () => {
    if (quizAnswer !== null && currentQuiz) {
      setShowQuizResult(true);

      // Au after showing result
      setTimeout(() => {
        setShowQuiz(false);
        setShowQuizResult(false);
        setQuizAnswer(null);
        setCurrentQuiz(null);
        setIsPlaying(true);
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }, 3000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-black rounded-lg overflow-hidden shadow-2xl">
      <div className="relative">
        {/* Media Element — video or audio with graceful fallback */}
        {loadError ? (
          <div className="w-full aspect-video flex items-center justify-center bg-gray-900 text-white">
            <div className="text-center p-8">
              <p className="text-lg font-medium mb-2">Unable to load media</p>
              <p className="text-sm text-gray-400 mb-4">The video may be temporarily unavailable.</p>
              <button
                onClick={() => { setLoadError(false); videoRef.current?.load(); }}
                className="px-4 py-2 bg-brand-blue-600 rounded-lg text-sm hover:bg-brand-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        ) : isAudioOnly ? (
          <div className="w-full aspect-video flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900">
            <div className="w-24 h-24 rounded-full bg-brand-blue-600 flex items-center justify-center mb-4">
              <Volume2 className="w-12 h-12 text-white" />
            </div>
            <p className="text-white text-lg font-medium mb-2">{title}</p>
            <p className="text-gray-400 text-sm">Audio Lesson</p>
            {/* Hidden audio element using same ref */}
            <audio
              ref={videoRef as React.RefObject<HTMLAudioElement>}
              src={videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={() => setLoadError(true)}
              onEnded={() => {
                setIsPlaying(false);
                if (onComplete) onComplete();
              }}
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full aspect-video"
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={() => setLoadError(true)}
            onEnded={() => {
              setIsPlaying(false);
              if (onComplete) onComplete();
            }}
          />
        )}

        {/* Captions Overlay */}
        {showCaptions && currentCaption && (
          <div className="absolute bottom-20 left-0 right-0 flex justify-center px-4">
            <div className="bg-black bg-opacity-80 text-white px-4 py-2 rounded text-center max-w-3xl">
              {currentCaption}
            </div>
          </div>
        )}

        {/* Quiz Overlay */}
        {showQuiz && currentQuiz && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center p-8">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
              <h3 className="text-2xl font-bold mb-4">Quick Quiz</h3>
              <p className="text-lg mb-6">{currentQuiz.question}</p>

              <div className="space-y-3 mb-6">
                {currentQuiz.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setQuizAnswer(index)}
                    disabled={showQuizResult}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                      showQuizResult
                        ? index === currentQuiz.correctAnswer
                          ? 'border-brand-green-500 bg-brand-green-50'
                          : index === quizAnswer
                            ? 'border-brand-red-500 bg-brand-red-50'
                            : 'border-gray-200'
                        : quizAnswer === index
                          ? 'border-brand-blue-500 bg-brand-blue-50'
                          : 'border-gray-200 hover:border-brand-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          quizAnswer === index
                            ? 'border-brand-blue-500 bg-brand-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {quizAnswer === index && (
                          <div className="w-3 h-3 bg-white rounded-full" />
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              {showQuizResult && (
                <div
                  className={`p-4 rounded-lg mb-4 ${
                    quizAnswer === currentQuiz.correctAnswer
                      ? 'bg-brand-green-50 text-brand-green-900'
                      : 'bg-brand-red-50 text-brand-red-900'
                  }`}
                >
                  <p className="font-semibold mb-2">
                    {quizAnswer === currentQuiz.correctAnswer
                      ? '• Correct!'
                      : '✗ Incorrect'}
                  </p>
                  {currentQuiz.explanation && (
                    <p className="text-sm">{currentQuiz.explanation}</p>
                  )}
                </div>
              )}

              {!showQuizResult && (
                <button
                  onClick={submitQuizAnswer}
                  disabled={quizAnswer === null}
                  className="w-full py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Submit Answer
                </button>
              )}
            </div>
          </div>
        )}

        {/* Video Controls */}
        <div className="absolute bottom-0 left-0 right-0    p-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleSeek(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`,
              }}
            />
            {/* Quiz markers */}
            <div className="relative h-2">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full -mt-1"
                  style={{ left: `${(quiz.timestamp / duration) * 100}%` }}
                  title={`Quiz at ${formatTime(quiz.timestamp)}`}
                />
              ))}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="hover:text-brand-blue-400">
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>

              <button onClick={() => skip(-10)} className="hover:text-brand-blue-400">
                <SkipBack className="w-5 h-5" />
              </button>

              <button onClick={() => skip(10)} className="hover:text-brand-blue-400">
                <SkipForward className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="hover:text-brand-blue-400">
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) =>
                    handleVolumeChange(parseFloat(e.target.value))
                  }
                  className="w-20 h-1"
                />
              </div>

              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={playbackRate}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => changePlaybackRate(parseFloat(e.target.value))}
                className="bg-transparent border border-gray-600 rounded px-2 py-2 text-sm"
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>

              <button
                onClick={() => setShowCaptions(!showCaptions)}
                className={`hover:text-brand-blue-400 ${showCaptions ? 'text-brand-blue-400' : ''}`}
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="hover:text-brand-blue-400"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-gray-900 text-white">
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('transcript')}
            className={`flex items-center gap-2 px-6 py-3 ${
              activeTab === 'transcript'
                ? 'border-b-2 border-brand-blue-500 text-brand-blue-400'
                : 'text-gray-400'
            }`}
          >
            <FileText className="w-4 h-4" />
            Transcript
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-6 py-3 ${
              activeTab === 'notes'
                ? 'border-b-2 border-brand-blue-500 text-brand-blue-400'
                : 'text-gray-400'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            My Notes ({notes.length})
          </button>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'transcript' && (
            <div className="space-y-2">
              {transcript.length > 0 ? (
                transcript.map((segment, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded cursor-pointer hover:bg-gray-800 ${
                      currentTime >= segment.start && currentTime <= segment.end
                        ? 'bg-gray-800'
                        : ''
                    }`}
                    onClick={() => handleSeek(segment.start)}
                  >
                    <span className="text-brand-blue-400 text-sm mr-3">
                      {formatTime(segment.start)}
                    </span>
                    <span className="text-gray-300">{segment.text}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No transcript available</p>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setNewNote(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNote()}
                  placeholder="Add a note at current timestamp..."
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
                <button
                  onClick={addNote}
                  className="px-4 py-2 bg-brand-blue-600 rounded hover:bg-brand-blue-700"
                >
                  Add Note
                </button>
              </div>

              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="p-4 bg-gray-800 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => handleSeek(note.timestamp)}
                        className="text-brand-blue-400 text-sm hover:underline"
                      >
                        {formatTime(note.timestamp)}
                      </button>
                      <span className="text-gray-500 text-xs">
                        {note.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300">{note.content}</p>
                  </div>
                ))}
                {notes.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No notes yet. Add your first note!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
