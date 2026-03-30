"use client";

import React from 'react';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
} from 'lucide-react';

interface VideoNote {
  timestamp: number;
  text: string;
}

interface VideoQuiz {
  timestamp: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface InteractiveVideoPlayerProps {
  videoUrl: string;
  title: string;
  transcript?: string;
  notes?: VideoNote[];
  quizzes?: VideoQuiz[];
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export default function InteractiveVideoPlayer({
  videoUrl,
  title,
  transcript,
  notes = [],
  quizzes = [],
  onProgress,
  onComplete,
}: InteractiveVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<VideoQuiz | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      setCurrentTime(current);

      // Check for quizzes at current timestamp
      const quiz = quizzes.find(
        (q) => Math.abs(q.timestamp - current) < 0.5 && !activeQuiz
      );
      if (quiz) {
        video.pause();
        setIsPlaying(false);
        setActiveQuiz(quiz);
      }

      // Report progress
      if (onProgress && duration > 0) {
        onProgress((current / duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onComplete) {
        onComplete();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [quizzes, activeQuiz, duration, onProgress, onComplete]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = time;
  };

  const handleQuizAnswer = (answerIndex: number) => {
    setQuizAnswer(answerIndex);
  };

  const submitQuizAnswer = async () => {
    if (quizAnswer === null || !activeQuiz) return;

    const isCorrect = quizAnswer === activeQuiz.correctAnswer;

    // Persist quiz result — fire-and-forget, non-blocking
    fetch('/api/lms/video-quiz-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: activeQuiz.question,
        selectedAnswer: quizAnswer,
        correctAnswer: activeQuiz.correctAnswer,
        isCorrect,
        timestamp: activeQuiz.timestamp,
      }),
    }).catch(() => {
      // Non-fatal — progress continues even if persistence fails
    });

    if (isCorrect) {
      setActiveQuiz(null);
      setQuizAnswer(null);
      videoRef.current?.play().catch(() => {});
      setIsPlaying(true);
    } else {
      alert('Incorrect answer. Please try again.');
      setQuizAnswer(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentNotes = notes.filter(
    (note) => Math.abs(note.timestamp - currentTime) < 5
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="relative bg-black">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full aspect-video"
              playsInline
              onClick={togglePlay}
            />
            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0    p-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    value={currentTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => seekTo(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-white mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="text-white hover:bg-white/20"
                >
                  <Settings className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>
            </div>
            {/* Quiz Overlay */}
            {activeQuiz && (
              <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-8">
                <Card className="max-w-2xl w-full">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">
                      {activeQuiz.question}
                    </h3>
                    <div className="space-y-2 mb-4">
                      {activeQuiz.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuizAnswer(index)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                            quizAnswer === index
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-300 hover:border-primary/50'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={submitQuizAnswer}
                      disabled={quizAnswer === null}
                      className="w-full"
                    >
                      Submit Answer
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Notes Panel */}
      {showNotes && currentNotes.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">
              Notes at {formatTime(currentTime)}
            </h3>
            <div className="space-y-2">
              {currentNotes.map((note, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  {note.text}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Transcript Panel */}
      {showTranscript && transcript && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Transcript</h3>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">
              {transcript}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Timeline Notes */}
      {notes.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Timeline Notes</h3>
            <div className="space-y-2">
              {notes.map((note, index) => (
                <button
                  key={index}
                  onClick={() => seekTo(note.timestamp)}
                  className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatTime(note.timestamp)}
                    </span>
                    <span className="text-sm">{note.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
