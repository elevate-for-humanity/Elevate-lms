'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

interface Candidate {
  id: string;
  name: string;
  program: string;
  skills: string[];
  stage: 'sourced' | 'screening' | 'interview' | 'offer' | 'hired';
  matchScore: number;
  graduationDate: string;
}

export function EmployerTalentPipeline() {
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('job_placements')
        .select(
          'id, status, match_score, start_date, profiles!job_placements_student_id_fkey(full_name), programs!job_placements_program_id_fkey(title)',
        )
        .in('status', ['sourced', 'screening', 'interview', 'offer', 'hired', 'placed'])
        .order('created_at', { ascending: false })
        .limit(50);

      setCandidates(
        (data || []).map((r: any) => ({
          id: r.id,
          name: r.profiles?.full_name || 'Unknown',
          program: r.programs?.title || 'Unknown Program',
          skills: [],
          stage: r.status === 'placed' ? 'hired' : r.status,
          matchScore: r.match_score ?? 0,
          graduationDate: r.start_date
            ? new Date(r.start_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
              })
            : '—',
        })),
      );
      setLoading(false);
    }
    load();
  }, []);

  const stages = ['all', 'sourced', 'screening', 'interview', 'offer', 'hired'];
  const filteredCandidates =
    selectedStage === 'all' ? candidates : candidates.filter((c) => c.stage === selectedStage);

  if (loading) return <div className="p-8 text-center text-slate-700">Loading pipeline…</div>;
  if (candidates.length === 0)
    return <div className="p-8 text-center text-slate-700">No candidates in pipeline yet.</div>;

  const stageColors: Record<string, string> = {
    sourced: 'bg-slate-100 text-black',
    screening: 'bg-brand-blue-100 text-brand-blue-700',
    interview: 'bg-purple-100 text-purple-700',
    offer: 'bg-brand-orange-100 text-brand-orange-700',
    hired: 'bg-brand-green-100 text-brand-green-700',
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">
            Talent Pipeline
          </h1>
          <p className="text-white">Manage your candidate pipeline</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {stages.slice(1).map((stage) => (
            <Card key={stage} className="p-4 text-center">
              <p className="text-2xl font-bold text-brand-orange-600">
                {candidates.filter((c) => c.stage === stage).length}
              </p>
              <p className="text-sm text-black capitalize">{stage}</p>
            </Card>
          ))}
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {stages.map((stage) => (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                selectedStage === stage
                  ? 'bg-brand-orange-600 text-white'
                  : 'bg-white text-black border hover:bg-slate-50'
              }`}
            >
              {stage}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredCandidates.map((candidate) => (
            <Card key={candidate.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{candidate.name}</h3>
                    <span
                      className={`px-3 py-2 rounded text-xs font-medium ${stageColors[candidate.stage]}`}
                    >
                      {candidate.stage}
                    </span>
                  </div>
                  <p className="text-black">{candidate.program}</p>
                  <p className="text-sm text-slate-700">Graduates: {candidate.graduationDate}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-brand-orange-600">
                    {candidate.matchScore}%
                  </div>
                  <p className="text-sm text-black">Match Score</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold text-black mb-2">Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-2 bg-brand-orange-100 text-brand-orange-700 text-sm rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm">View Profile</Button>
                <Button size="sm" variant="secondary">
                  Schedule Interview
                </Button>
                <Button size="sm" variant="secondary">
                  Send Message
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
