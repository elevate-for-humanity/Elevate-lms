"use client";

import { aiNarrator } from "@/content/homepage/aiInstructor";
import LazyVideo from "@/components/ui/LazyVideo";

export function AiNarratorSection() {
  return (
    <section className="mx-auto mt-12 max-w-6xl rounded-3xl border border-slate-200 bg-slate-50 px-4 py-10 sm:px-8 sm:py-12">
      <div className="grid gap-10 md:grid-cols-[3fr,2fr] items-center">
        {/* Left: Text */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-orange-600">
            AI Instructor
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
            Let our AI guide explain Elevate for Humanity
          </h2>
          <p className="text-sm text-black">
            This short AI-narrated overview introduces Elevate for Humanity and
            the Elevate for Humanity. It explains how our programs connect
            to federal and state workforce funding streams like WIOA, Workforce
            Ready Grants, and other local initiatives so that eligible learners
            may attend at little or no cost.
          </p>

          <ul className="mt-3 space-y-2 text-sm text-black list-disc pl-4">
            <li>What Elevate for Humanity is and who we serve</li>
            <li>How programs link to WIOA and state workforce grants</li>
            <li>How to use www.elevateforhumanity.org to explore and apply</li>
          </ul>

          <p className="mt-4 text-xs text-slate-500">
            The full script for this overview is stored at:{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5">
              {aiNarrator.scriptFile}
            </code>
            . Your video generation pipeline can read that file and update the
            video URL below when the AI video is ready.
          </p>
        </div>

        {/* Right: Video slot */}
        <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-black">
          {aiNarrator.videoUrl ? (
            <LazyVideo
              src={aiNarrator.videoUrl}
              className="h-full w-full"
              autoPlay={false}
              controls
              muted={false}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center text-xs text-slate-300">
              <span className="font-medium">
                AI narrator video Available Now
              </span>
              <span className="text-[11px] text-slate-400">
                Once your AI video is generated from the script file, set{" "}
                <code>aiNarrator.videoUrl</code> in{" "}
                <code>content/homepage/aiInstructor.ts</code>.
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default AiNarratorSection;
