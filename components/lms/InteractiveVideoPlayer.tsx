'use client';

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
interface CheckpointBase {
  type: CheckpointType;
  timestamp: number;
}
export interface CheckpointQuiz extends CheckpointBase {
  type: 'quiz';
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
}
export interface CheckpointHotspot extends CheckpointBase {
  type: 'hotspot';
  prompt: string;
  areas: { label: string; correct: boolean; info: string }[];
}
export interface CheckpointScenario extends CheckpointBase {
  type: 'scenario';
  situation: string;
  choices: { text: string; feedback: string; correct: boolean }[];
}
export interface CheckpointReflection extends CheckpointBase {
  type: 'reflection';
  prompt: string;
  minChars?: number;
}
export interface CheckpointKeyConcept extends CheckpointBase {
  type: 'key-concept';
  concept: string;
  bullets?: string[];
}
export type Checkpoint =
  | CheckpointQuiz
  | CheckpointHotspot
  | CheckpointScenario
  | CheckpointReflection
  | CheckpointKeyConcept;

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
  lessonId?: string;
  courseId?: string;
  checkpoints?: Checkpoint[];
  quizzes?: VideoQuiz[];
  transcript?: TranscriptSegment[];
  validationErrors?: string[];
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export default function InteractiveVideoPlayer({
  videoUrl,
  title,
  lessonId: lessonRecordId,
  courseId,
  checkpoints = [],
  quizzes = [],
  transcript = [],
  validationErrors = [],
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
  const [activeTab, setActiveTab] = useState<'transcript' | 'notes' | 'resources'>('transcript');
  const [showCaptions, setShowCaptions] = useState(false);
  const [currentCaption, setCurrentCaption] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  const [checkpointResponse, setCheckpointResponse] = useState('');
  const [checkpointChoice, setCheckpointChoice] = useState<number | null>(null);
  const [checkpointFeedback, setCheckpointFeedback] = useState('');
  const [completedCheckpointKeys, setCompletedCheckpointKeys] = useState<Set<string>>(new Set());

  const checkpointKey = (checkpoint: Checkpoint) =>
    `${checkpoint.type}:${checkpoint.timestamp}`;
  const checkpointQuizzes: VideoQuiz[] = checkpoints
    .filter((checkpoint): checkpoint is CheckpointQuiz => checkpoint.type === 'quiz')
    .map((checkpoint) => ({
      id: checkpointKey(checkpoint),
      timestamp: checkpoint.timestamp,
      question: checkpoint.question,
      options: checkpoint.options,
      correctAnswer: checkpoint.answer,
      explanation: checkpoint.explanation,
    }));
  const effectiveQuizzes = [...quizzes, ...checkpointQuizzes.filter(
    (checkpoint) => !quizzes.some((quiz) => quiz.id === checkpoint.id),
  )];
  const nonQuizCheckpoints = checkpoints.filter((checkpoint) => checkpoint.type !== 'quiz');

  // Detect media type from URL
  const isAudioOnly = /\.(mp3|wav|ogg|aac|m4a)(\?|$)/i.test(videoUrl);

  // Load saved notes from database
  useEffect(() => {
    const loadNotes = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Extract lesson ID from video URL or use title
      const id = videoUrl.split('/').pop()?.split('.')[0] || title;
      setVideoId(id);

      const { data } = await supabase
        .from('video_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('video_id', id)
        .order('timestamp', { ascending: true });

      if (data) {
        setNotes(
          data.map((n) => ({
            id: n.id,
            timestamp: n.timestamp,
            content: n.content,
            createdAt: new Date(n.created_at),
          })),
        );
      }
    };
    loadNotes();
  }, [videoUrl, title]);

  // Save note to database
  const saveNote = async () => {
    if (!newNote.trim()) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const note: VideoNote = {
      id: Date.now().toString(),
      timestamp: currentTime,
      content: newNote,
      createdAt: new Date(),
    };

    setNotes([...notes, note]);
    setNewNote('');

    if (user && videoId) {
      await supabase
        .from('video_notes')
        .insert({
          user_id: user.id,
          video_id: videoId,
          timestamp: currentTime,
          content: newNote,
        })
        .then(()=>{}, ()=>{});
    }
  };

  // Save progress to database
  const saveProgress = async (progress: number) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && videoId) {
      await supabase
        .from('video_progress')
        .upsert({
          user_id: user.id,
          video_id: videoId,
          progress_percent: progress,
          last_position: currentTime,
          updated_at: new Date().toISOString(),
        })
        .then(()=>{}, ()=>{});
    }
  };

  // Pause once for each required timestamped interaction.
  useEffect(() => {
    if (!isPlaying || showQuiz || activeCheckpoint) return;

    const quiz = effectiveQuizzes.find(
      (item) =>
        Math.abs(item.timestamp - currentTime) < 0.75 &&
        !completedCheckpointKeys.has(`quiz:${item.timestamp}`),
    );
    if (quiz) {
      setCurrentQuiz(quiz);
      setShowQuiz(true);
      setIsPlaying(false);
      videoRef.current?.pause();
      return;
    }

    const checkpoint = nonQuizCheckpoints.find(
      (item) =>
        Math.abs(item.timestamp - currentTime) < 0.75 &&
        !completedCheckpointKeys.has(checkpointKey(item)),
    );
    if (checkpoint) {
      setActiveCheckpoint(checkpoint);
      setCheckpointResponse('');
      setCheckpointChoice(null);
      setCheckpointFeedback('');
      setIsPlaying(false);
      videoRef.current?.pause();
    }
  }, [activeCheckpoint, completedCheckpointKeys, currentTime, effectiveQuizzes, isPlaying, nonQuizCheckpoints, showQuiz]);

  // Update caption based on current time
  useEffect(() => {
    if (showCaptions && transcript.length > 0) {
      const segment = transcript.find((s) => currentTime >= s.start && currentTime <= s.end);
      setCurrentCaption(segment?.text || '');
    }
  }, [currentTime, transcript, showCaptions]);

  // Store callbacks in refs to avoid re-render churn
  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
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
        syncAudioOutput();
        void videoRef.current.play().then(() => {}, () => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    el.volume = volume > 0 ? volume : 1;
    setIsMuted(false);
  }, [videoUrl, volume]);

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
      if (pct >= 95 && allCheckpointsComplete && !completeFiredRef.current) {
        completeFiredRef.current = true;
        onCompleteRef.current?.();
      }
    }
  };

  const syncAudioOutput = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    el.volume = volume > 0 ? volume : 1;
    setIsMuted(false);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      syncAudioOutput();
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
      const isCorrect = quizAnswer === currentQuiz.correctAnswer;
      setShowQuizResult(true);
      void fetch('/api/lms/video-quiz-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lessonRecordId,
          question: currentQuiz.question,
          selectedAnswer: quizAnswer,
          correctAnswer: currentQuiz.correctAnswer,
          isCorrect,
          timestamp: currentQuiz.timestamp,
        }),
      }).catch(() => {});

      if (!isCorrect) return;
      setCompletedCheckpointKeys((current) => new Set(current).add(`quiz:${currentQuiz.timestamp}`));
      setTimeout(() => {
        setShowQuiz(false);
        setShowQuizResult(false);
        setQuizAnswer(null);
        setCurrentQuiz(null);
        setIsPlaying(true);
        videoRef.current?.play().then(()=>{}, ()=>{});
      }, 1500);
    }
  };

  const retryQuiz = () => {
    setShowQuizResult(false);
    setQuizAnswer(null);
  };

  const completeActiveCheckpoint = () => {
    if (!activeCheckpoint) return;
    let valid = false;
    let feedback = '';

    if (activeCheckpoint.type === 'key-concept') valid = true;
    if (activeCheckpoint.type === 'reflection') {
      valid = checkpointResponse.trim().length >= (activeCheckpoint.minChars ?? 1);
      if (!valid) feedback = `Write at least ${activeCheckpoint.minChars ?? 1} characters before continuing.`;
    }
    if (activeCheckpoint.type === 'hotspot' && checkpointChoice !== null) {
      const area = activeCheckpoint.areas[checkpointChoice];
      valid = !!area?.correct;
      feedback = area?.info || (valid ? 'Correct.' : 'Review the demonstration and try again.');
    }
    if (activeCheckpoint.type === 'scenario' && checkpointChoice !== null) {
      const choice = activeCheckpoint.choices[checkpointChoice];
      valid = !!choice?.correct;
      feedback = choice?.feedback || (valid ? 'Correct.' : 'Review the safety decision and try again.');
    }

    setCheckpointFeedback(feedback);
    if (!valid) return;

    const completed = activeCheckpoint;
    setCompletedCheckpointKeys((current) => new Set(current).add(checkpointKey(completed)));
    setTimeout(() => {
      setActiveCheckpoint(null);
      setCheckpointChoice(null);
      setCheckpointResponse('');
      setCheckpointFeedback('');
      setIsPlaying(true);
      videoRef.current?.play().then(()=>{}, ()=>{});
    }, feedback ? 1200 : 0);
  };

  const allCheckpointsComplete =
    checkpoints.length === 0 ||
    checkpoints.every((checkpoint) => completedCheckpointKeys.has(checkpointKey(checkpoint)));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const showPlayerChrome = !loadError;

  return (
    <div className="bg-black rounded-lg overflow-hidden shadow-2xl">
      {validationErrors.length > 0 && (
        <div className="border-b border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
          This lesson has {validationErrors.length} interaction configuration issue{validationErrors.length === 1 ? '' : 's'}. An instructor has been notified.
        </div>
      )}
      <div className="relative">
        {/* Media Element — video or audio with graceful fallback */}
        {loadError ? (
          <div className="w-full aspect-video flex items-center justify-center bg-slate-900 text-white">
            <div className="text-center p-8">
              <p className="text-lg font-medium mb-2">Media file not found</p>
              <p className="text-sm text-slate-300 mb-2">
                This lesson video is not available yet in the current environment.
              </p>
              <p className="text-xs text-slate-400 mb-4">
                You can continue with Reading and Quiz activities while media is being published.
              </p>
              <button
                onClick={() => {
                  setLoadError(false);
                  videoRef.current?.load();
                }}
                className="px-4 py-2 bg-brand-blue-600 rounded-lg text-sm hover:bg-brand-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        ) : isAudioOnly ? (
          <div className="w-full aspect-video flex flex-col items-center justify-center bg-slate-900">
            <div className="w-24 h-24 rounded-full bg-brand-blue-600 flex items-center justify-center mb-4">
              <Volume2 className="w-12 h-12 text-white" />
            </div>
            <p className="text-white text-lg font-medium mb-2">{title}</p>
            <p className="text-slate-700 text-sm">Audio Lesson</p>
            {/* Hidden audio element using same ref */}
            <audio
              ref={videoRef as React.RefObject<HTMLAudioElement>}
              src={videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={() => setLoadError(true)}
              onEnded={() => {
                setIsPlaying(false);
                if (allCheckpointsComplete && onComplete) onComplete();
              }}
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full aspect-video"
            controls
            preload="metadata"
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={() => setLoadError(true)}
            onEnded={() => {
              setIsPlaying(false);
              if (allCheckpointsComplete && onComplete) onComplete();
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

        {/* Structured checkpoint overlay */}
        {activeCheckpoint && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label="Required video checkpoint">
            <div className="w-full max-w-2xl rounded-xl bg-white p-6 text-slate-900">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-blue-700">
                Required {activeCheckpoint.type.replace('-', ' ')}
              </p>
              {activeCheckpoint.type === 'key-concept' && (
                <>
                  <h3 className="text-xl font-bold">{activeCheckpoint.concept}</h3>
                  {activeCheckpoint.bullets?.length ? (
                    <ul className="mt-4 list-disc space-y-2 pl-6">
                      {activeCheckpoint.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                    </ul>
                  ) : null}
                </>
              )}
              {activeCheckpoint.type === 'reflection' && (
                <>
                  <h3 className="text-xl font-bold">{activeCheckpoint.prompt}</h3>
                  <textarea
                    autoFocus
                    value={checkpointResponse}
                    onChange={(event) => setCheckpointResponse(event.target.value)}
                    className="mt-4 min-h-32 w-full rounded-lg border border-slate-300 p-3"
                    aria-label="Reflection response"
                  />
                </>
              )}
              {activeCheckpoint.type === 'hotspot' && (
                <>
                  <h3 className="text-xl font-bold">{activeCheckpoint.prompt}</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {activeCheckpoint.areas.map((area, index) => (
                      <button key={area.label} type="button" onClick={() => setCheckpointChoice(index)}
                        className={`rounded-lg border-2 p-4 text-left ${checkpointChoice === index ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200'}`}>
                        {area.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {activeCheckpoint.type === 'scenario' && (
                <>
                  <h3 className="text-xl font-bold">{activeCheckpoint.situation}</h3>
                  <div className="mt-4 space-y-3">
                    {activeCheckpoint.choices.map((choice, index) => (
                      <button key={choice.text} type="button" onClick={() => setCheckpointChoice(index)}
                        className={`w-full rounded-lg border-2 p-4 text-left ${checkpointChoice === index ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-slate-200'}`}>
                        {choice.text}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {checkpointFeedback ? <p className="mt-4 rounded-lg bg-slate-100 p-3" role="status">{checkpointFeedback}</p> : null}
              <button type="button" onClick={completeActiveCheckpoint}
                className="mt-5 w-full rounded-lg bg-brand-blue-600 px-4 py-3 font-semibold text-white">
                {activeCheckpoint.type === 'key-concept' ? 'I understand — continue' : 'Submit and continue'}
              </button>
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
                            : 'border-slate-200'
                        : quizAnswer === index
                          ? 'border-brand-blue-500 bg-brand-blue-50'
                          : 'border-slate-200 hover:border-brand-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          quizAnswer === index
                            ? 'border-brand-blue-500 bg-brand-blue-500'
                            : 'border-slate-300'
                        }`}
                      >
                        {quizAnswer === index && <div className="w-3 h-3 bg-white rounded-full" />}
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
                    {quizAnswer === currentQuiz.correctAnswer ? '• Correct!' : '✗ Incorrect'}
                  </p>
                  {currentQuiz.explanation && <p className="text-sm">{currentQuiz.explanation}</p>}
                  {quizAnswer !== currentQuiz.correctAnswer && (
                    <button type="button" onClick={retryQuiz} className="mt-3 rounded-lg bg-brand-blue-600 px-4 py-2 font-semibold text-white">
                      Review and try again
                    </button>
                  )}
                </div>
              )}

              {!showQuizResult && (
                <button
                  onClick={submitQuizAnswer}
                  disabled={quizAnswer === null}
                  className="w-full py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Submit Answer
                </button>
              )}
            </div>
          </div>
        )}

        {/* Video Controls */}
        {showPlayerChrome && <div className="absolute bottom-0 left-0 right-0    p-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={(
                e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
              ) => handleSeek(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`,
              }}
            />
            {/* Interaction markers */}
            <div className="relative h-2">
              {effectiveQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full -mt-1"
                  style={{ left: `${(quiz.timestamp / duration) * 100}%` }}
                  title={`Quiz at ${formatTime(quiz.timestamp)}`}
                />
              ))}
              {nonQuizCheckpoints.map((checkpoint) => (
                <div
                  key={checkpointKey(checkpoint)}
                  className="absolute h-2 w-2 rounded-full bg-cyan-400 -mt-3"
                  style={{ left: `${(checkpoint.timestamp / duration) * 100}%` }}
                  title={`${checkpoint.type} at ${formatTime(checkpoint.timestamp)}`}
                />
              ))}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="hover:text-brand-blue-400">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>

              <button onClick={() => skip(-10)} className="hover:text-brand-blue-400">
                <SkipBack className="w-5 h-5" />
              </button>

              <button onClick={() => skip(10)} className="hover:text-brand-blue-400">
                <SkipForward className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="hover:text-brand-blue-400">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
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
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
                ) => changePlaybackRate(parseFloat(e.target.value))}
                className="bg-transparent border border-slate-600 rounded px-2 py-2 text-sm"
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

              <button onClick={toggleFullscreen} className="hover:text-brand-blue-400">
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>}
      </div>

      {/* Tabs Section */}
      {showPlayerChrome && <div className="bg-slate-900 text-white">
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('transcript')}
            className={`flex items-center gap-2 px-6 py-3 ${
              activeTab === 'transcript'
                ? 'border-b-2 border-brand-blue-500 text-brand-blue-400'
                : 'text-slate-700'
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
                : 'text-slate-700'
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
                    className={`p-3 rounded cursor-pointer hover:bg-slate-800 ${
                      currentTime >= segment.start && currentTime <= segment.end
                        ? 'bg-slate-800'
                        : ''
                    }`}
                    onClick={() => handleSeek(segment.start)}
                  >
                    <span className="text-brand-blue-400 text-sm mr-3">
                      {formatTime(segment.start)}
                    </span>
                    <span className="text-slate-700">{segment.text}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-700">No transcript available</p>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(
                    e: React.ChangeEvent<
                      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                    >,
                  ) => setNewNote(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNote()}
                  placeholder="Add a note at current timestamp..."
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white"
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
                  <div key={note.id} className="p-4 bg-slate-800 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => handleSeek(note.timestamp)}
                        className="text-brand-blue-400 text-sm hover:underline"
                      >
                        {formatTime(note.timestamp)}
                      </button>
                      <span className="text-slate-700 text-xs">
                        {note.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-700">{note.content}</p>
                  </div>
                ))}
                {notes.length === 0 && (
                  <p className="text-slate-700 text-center py-8">
                    No notes yet. Add your first note!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>}
    </div>
  );
}
