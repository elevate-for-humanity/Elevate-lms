"use client";

import { createClient } from '@/lib/supabase/client';

import React, { useEffect, useState } from 'react';

import Image from "next/image";

export function AIInstructorCard(props: {
  instructorName: string;
  roleTitle: string;
  programName: string;
  onOpenChat: () => void;
}) {
  const [instructorData, setInstructorData] = useState<any>(null);
  const supabase = createClient();

  // Load instructor data from DB
  useEffect(() => {
    async function loadInstructor() {
      const { data } = await supabase
        .from('ai_instructors')
        .select('name, role_title, avatar_url, bio, availability_status')
        .eq('program_name', props.programName)
        .single();
      
      if (data) setInstructorData(data);
    }
    loadInstructor();
  }, [props.programName, supabase]);

  // Log card view for analytics
  useEffect(() => {
    async function logView() {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('ai_instructor_interactions')
        .insert({
          user_id: user?.id,
          instructor_name: props.instructorName,
          interaction_type: 'card_view',
          timestamp: new Date().toISOString()
        });
    }
    logView();
  }, [props.instructorName, supabase]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-2 border-zinc-200">
          <Image loading="lazy"
            src="/images/team/elizabeth-greene.jpg"
            alt="Elizabeth Greene"
            fill
          sizes="100vw"
            className="object-cover"
          />
        </div>

        <div className="flex-1">
          <div className="text-sm text-zinc-500">Your Instructor</div>
          <div className="mt-1 text-xl font-bold text-zinc-900">{props.instructorName}</div>
          <div className="mt-1 text-sm text-zinc-700">{props.roleTitle}</div>
          <div className="mt-2 text-sm text-zinc-600">
            Program: <span className="font-semibold text-zinc-800">{props.programName}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          onClick={() => props.onOpenChat()}
          className="flex-1 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-800"
        >
          Ask Instructor
        </button>
        <button
          onClick={() => props.onOpenChat()}
          className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-900 transition hover:bg-zinc-50"
        >
          Milady Help
        </button>
      </div>

      <div className="mt-3 text-xs text-zinc-500">
        Available 24/7 for guidance. If you need a human, use "Contact Support."
      </div>
    </div>
  );
}
