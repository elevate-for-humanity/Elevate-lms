import Image from 'next/image';
import { Button } from '@/components/locked/Button';
import {
  Clock,
  DollarSign,
  Award,
  Shield,
  Users,
  ArrowRight,
CheckCircle, } from 'lucide-react';

/**
 * LOCKED Program Page Template
 *
 * Answers ONE question: "Is this for me, and what do I do next?"
 *
 * Structure (NEVER DEVIATE):
 * 1. Who this is for (5 seconds to self-identify)
 * 2. What you get (outcomes)
 * 3. How long it takes (timeline)
 * 4. What it costs (or who pays)
 * 5. What happens next (apply)
 *
 * NO systems, NO funding details, NO philosophy
 */

interface ProgramPageProps {
  // Required
  name: string;

  // 1. WHO THIS IS FOR (max 3 bullets)
  forWho: string[];

  // 2. WHAT YOU GET (max 3 outcomes)
  outcomes: string[];

  // 3. HOW LONG
  duration: string;
  schedule: string; // e.g., "Full-time" or "Evenings"

  // 4. WHAT IT COSTS
  cost: string; // e.g., "100% Free" or "$0"
  fundedBy: string; // e.g., "WIOA" or "Workforce Ready Grant"

  // 5. PROOF (optional but recommended)
  rapidsId?: string;
  avgSalary?: string;

  // Assets
  heroImage: string;
}

export function ProgramPageLocked({
  name,
  forWho,
  outcomes,
  duration,
  schedule,
  cost,
  fundedBy,
  rapidsId,
  avgSalary,
  heroImage,
}: ProgramPageProps) {
  return (
    <main className="bg-white">
      {/* Hero - Name Only */}
      <section className="relative h-[400px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src={heroImage}
          alt={name}
          fill
          className="object-cover"
          priority
        />
        

        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold">{name}</h1>
        </div>
      </section>

      {/* 1. WHO THIS IS FOR */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-black mb-8 text-center">
            Is This For You?
          </h2>

          <div className="space-y-4">
            {forWho.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 bg-slate-50 p-6 rounded-lg"
              >
                <Users className="h-10 w-10 text-brand-blue-600 flex-shrink-0 mt-1" />
                <p className="text-lg text-black">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. WHAT YOU GET */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-black mb-8 text-center">
            What You Get
          </h2>

          <div className="space-y-4">
            {outcomes.map((outcome, index) => (
              <div
                key={index}
                className="flex items-start gap-4 bg-white p-6 rounded-lg border border-slate-200"
              >
                <span className="text-slate-400 flex-shrink-0">•</span>
                <p className="text-lg text-black font-semibold">
                  {outcome}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. HOW LONG IT TAKES */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-black mb-8 text-center">
            Time Commitment
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-8 rounded-lg text-center">
              <Clock className="h-12 w-12 text-brand-blue-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-black mb-2">
                {duration}
              </div>
              <div className="text-black">Total Duration</div>
            </div>

            <div className="bg-slate-50 p-8 rounded-lg text-center">
              <Clock className="h-12 w-12 text-brand-blue-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-black mb-2">
                {schedule}
              </div>
              <div className="text-black">Schedule</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHAT IT COSTS */}
      <section className="py-16 bg-green-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-8">
            What It Costs
          </h2>

          <div className="bg-white border-2 border-green-600 rounded-lg p-12 mb-6">
            <div className="text-5xl font-bold text-green-600 mb-4">{cost}</div>
            <div className="text-xl text-black">Funded by {fundedBy}</div>
          </div>

          <p className="text-black">
            No tuition. No student debt. No hidden fees.
          </p>
        </div>
      </section>

      {/* Proof (if available) */}
      {(rapidsId || avgSalary) && (
        <section className="py-16 bg-white">
          <div className="max-w-3xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-6">
              {rapidsId && (
                <div className="bg-slate-50 p-6 rounded-lg text-center">
                  <Shield className="h-11 w-11 text-brand-blue-600 mx-auto mb-4" />
                  <div className="text-sm text-black mb-2">
                    DOL Registered
                  </div>
                  <div className="font-mono text-sm font-semibold text-black">
                    {rapidsId}
                  </div>
                </div>
              )}

              {avgSalary && (
                <div className="bg-slate-50 p-6 rounded-lg text-center">
                  <DollarSign className="h-11 w-11 text-green-600 mx-auto mb-4" />
                  <div className="text-sm text-black mb-2">
                    Average Salary
                  </div>
                  <div className="text-2xl font-bold text-black">
                    {avgSalary}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 5. WHAT HAPPENS NEXT */}
      <section className="py-16 bg-brand-blue-600 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">What Happens Next</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-12 text-left">
            <div>
              <div className="text-4xl font-bold mb-2">1</div>
              <div className="text-lg font-semibold mb-2">Apply</div>
              <div className="text-brand-blue-100">Fill out simple application</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2</div>
              <div className="text-lg font-semibold mb-2">Get Approved</div>
              <div className="text-brand-blue-100">We handle funding paperwork</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">3</div>
              <div className="text-lg font-semibold mb-2">Start Training</div>
              <div className="text-brand-blue-100">Begin your program</div>
            </div>
          </div>

          <Button variant="secondary" href="/apply" arrow>
            Apply Now
          </Button>
        </div>
      </section>
    </main>
  );
}
