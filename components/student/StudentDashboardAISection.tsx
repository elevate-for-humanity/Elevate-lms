"use client";

import { createClient } from '@/lib/supabase/client';

import React, { useEffect } from 'react';

import { useState } from "react";
import { AIInstructorCard } from "@/components/student/AIInstructorCard";
import { AIChatPanel } from "@/components/student/AIChatPanel";

export function StudentDashboardAISection(props: {
  programSlug: string;
  programName: string;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [aiInstructor, setAiInstructor] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const supabase = createClient();

  // Load AI instructor config and chat history from DB
  useEffect(() => {
    async function loadAIData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Load AI instructor configuration for this program
      const { data: instructor } = await supabase
        .from('ai_instructors')
        .select('id, name, role_title, avatar_url, personality_config')
        .eq('program_slug', props.programSlug)
        .single();
      
      if (instructor) setAiInstructor(instructor);

      // Load recent chat history
      if (user) {
        const { data: history } = await supabase
          .from('ai_chat_history')
          .select('id, message, response, created_at')
          .eq('user_id', user.id)
          .eq('program_slug', props.programSlug)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (history) setChatHistory(history);
      }
    }
    loadAIData();
  }, [props.programSlug, supabase]);

  // Log chat open event
  const handleOpenChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('ai_chat_sessions')
      .insert({
        user_id: user?.id,
        program_slug: props.programSlug,
        started_at: new Date().toISOString()
      });
    setChatOpen(true);
  };

  return (
    <>
      <AIInstructorCard
        instructorName={aiInstructor?.name || "Elizabeth Greene"}
        roleTitle={aiInstructor?.role_title || "Program Instructor (AI)"}
        programName={props.programName}
        onOpenChat={handleOpenChat}
      />

      {chatOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
          <div className="w-full max-w-2xl">
            <div className="mb-2 flex justify-end">
              <button
                className="rounded-xl bg-white px-4 py-2 font-bold border border-zinc-200 hover:bg-zinc-50 transition"
                onClick={() => setChatOpen(false)}
              >
                Close
              </button>
            </div>
            <AIChatPanel programSlug={props.programSlug} />
          </div>
        </div>
      )}
    </>
  );
}
