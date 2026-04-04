"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import { Save, Clock, Search } from 'lucide-react';

interface Note {
  id: string;
  content: string;
  timestamp?: number;
  created_at: string;
}

interface NoteTakingProps {
  courseId: string;
  lessonId?: string;
  videoTimestamp?: number;
}

export function NoteTaking({ courseId, lessonId, videoTimestamp }: NoteTakingProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadNotes();
  }, [courseId, lessonId]);

  async function loadNotes() {
    try {
      const params = new URLSearchParams({
        courseId,
        ...(lessonId && { lessonId }),
      });

      const res = await fetch(`/api/notes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    }
  }

  async function saveNote() {
    if (!currentNote.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          lessonId,
          content: currentNote,
          timestamp: videoTimestamp,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotes([data.note, ...notes]);
        setCurrentNote('');
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote(noteId: string) {
    try {
      await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    }
  }

  const filteredNotes = notes.filter(note =>
    searchQuery === '' ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="text-lg font-semibold text-black mb-4">My Notes</h3>

      {/* New Note */}
      <div className="mb-4">
        <textarea
          value={currentNote}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setCurrentNote(e.target.value)}
          placeholder="Take a note..."
          className="w-full h-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
        />
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-slate-500">
            {videoTimestamp && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                At {formatTimestamp(videoTimestamp)}
              </span>
            )}
          </div>
          <button
            onClick={saveNote}
            disabled={saving || !currentNote.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-orange-600 text-white text-sm rounded-lg hover:bg-brand-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Notes List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="p-3 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {note.timestamp && (
                    <div className="flex items-center gap-1 text-xs text-brand-orange-600 font-medium mb-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(note.timestamp)}
                    </div>
                  )}
                  <p className="text-sm text-black whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(note.created_at).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="text-slate-400 hover:text-brand-orange-600 text-xs"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">
            {searchQuery ? 'No notes found' : 'No notes yet. Start taking notes!'}
          </p>
        )}
      </div>
    </div>
  );
}
