"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import { Clock, Play, Square, Calendar, TrendingUp, Award } from 'lucide-react';

interface HourTrackerProps {
  programName: string;
  requiredHours: number;
  studentId?: string;
}

export function HourTracker({ programName, requiredHours, studentId }: HourTrackerProps) {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [recentSessions, setRecentSessions] = useState<Array<{
    date: string;
    hours: number;
    activity: string;
  }>>([]);

  // Load saved data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(`hourTracker_${programName}`);
    if (savedData) {
      const data = JSON.parse(savedData);
      setTotalHours(data.totalHours || 0);
      setRecentSessions(data.recentSessions || []);

      // Check if there's an active session
      if (data.currentSessionStart) {
        setIsClockedIn(true);
        setCurrentSessionStart(new Date(data.currentSessionStart));
      }
    }
  }, [programName]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isClockedIn && currentSessionStart) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - currentSessionStart.getTime();
        setElapsedTime(Math.floor(diff / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isClockedIn, currentSessionStart]);

  const handleClockIn = () => {
    const now = new Date();
    setIsClockedIn(true);
    setCurrentSessionStart(now);
    setElapsedTime(0);

    // Save to localStorage
    const data = {
      totalHours,
      recentSessions,
      currentSessionStart: now.toISOString(),
    };
    localStorage.setItem(`hourTracker_${programName}`, JSON.stringify(data));
  };

  const handleClockOut = () => {
    if (!currentSessionStart) return;

    const now = new Date();
    const sessionHours = (now.getTime() - currentSessionStart.getTime()) / (1000 * 60 * 60);
    const newTotalHours = totalHours + sessionHours;

    const newSession = {
      date: now.toLocaleDateString(),
      hours: parseFloat(sessionHours.toFixed(2)),
      activity: 'Training Session',
    };

    const updatedSessions = [newSession, ...recentSessions].slice(0, 10);

    setIsClockedIn(false);
    setCurrentSessionStart(null);
    setElapsedTime(0);
    setTotalHours(newTotalHours);
    setRecentSessions(updatedSessions);

    // Save to localStorage
    const data = {
      totalHours: newTotalHours,
      recentSessions: updatedSessions,
      currentSessionStart: null,
    };
    localStorage.setItem(`hourTracker_${programName}`, JSON.stringify(data));
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = Math.min((totalHours / requiredHours) * 100, 100);
  const hoursRemaining = Math.max(requiredHours - totalHours, 0);

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="   p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Hour Tracker</h3>
            <p className="text-purple-100 text-sm mt-1">{programName}</p>
          </div>
          <Clock className="w-12 h-12 opacity-80" />
        </div>
      </div>

      {/* Clock In/Out Section */}
      <div className="p-6 bg-slate-50 border-b border-slate-200">
        <div className="text-center">
          {isClockedIn ? (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Currently Clocked In
              </div>
              <div className="text-5xl font-bold text-black font-mono text-3xl md:text-4xl lg:text-5xl">
                {formatTime(elapsedTime)}
              </div>
              <button
                onClick={handleClockOut}
                className="inline-flex items-center gap-2 bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:scale-105"
              >
                <Square className="w-5 h-5" />
                Clock Out
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-black text-sm">Ready to log your training hours?</div>
              <button
                onClick={handleClockIn}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:scale-105"
              >
                <Play className="w-5 h-5" />
                Clock In
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Section */}
      <div className="p-6 space-y-6">
        {/* Total Hours */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-black">Total Hours Completed</span>
            <span className="text-2xl font-bold text-purple-600">
              {totalHours.toFixed(1)} / {requiredHours}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
            <div
              className="   h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercentage}%` }}
             />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-black">
            <span>{progressPercentage.toFixed(1)}% Complete</span>
            <span>{hoursRemaining.toFixed(1)} hours remaining</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-brand-blue-50 rounded-xl p-4 text-center">
            <TrendingUp className="w-6 h-6 text-brand-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-brand-blue-600">{recentSessions.length}</div>
            <div className="text-xs text-black">Sessions</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <Calendar className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">
              {recentSessions.length > 0 ? recentSessions[0].date : 'N/A'}
            </div>
            <div className="text-xs text-black">Last Session</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <Award className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">
              {progressPercentage >= 100 ? '✓' : Math.ceil(hoursRemaining)}
            </div>
            <div className="text-xs text-black">To Complete</div>
          </div>
        </div>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-black mb-3">Recent Sessions</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentSessions.map((session, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-slate-50 rounded-lg p-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <div>
                      <div className="font-semibold text-black">{session.activity}</div>
                      <div className="text-xs text-black">{session.date}</div>
                    </div>
                  </div>
                  <div className="font-bold text-purple-600">{session.hours.toFixed(2)}h</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completion Badge */}
        {progressPercentage >= 100 && (
          <div className="   rounded-xl p-6 text-center text-white">
            <Award className="w-12 h-12 mx-auto mb-3" />
            <div className="text-xl font-bold">Congratulations!</div>
            <div className="text-sm text-green-100 mt-1">
              You've completed all required hours for {programName}
            </div>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
        <p className="text-xs text-black text-center">
          💡 <strong>Tip:</strong> Clock in when you start training and clock out when you finish.
          Your hours are automatically saved and synced with your instructor.
        </p>
      </div>
    </div>
  );
}
