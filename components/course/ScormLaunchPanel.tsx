"use client";

import React from 'react';

import { useState } from "react";
import { getScormPackageById } from "@/lms-data/scorm/packages";

interface Props {
  scormPackageId?: string;
}

export function ScormLaunchPanel({ scormPackageId }: Props) {
  const [launched, setLaunched] = useState(false);

  if (!scormPackageId) {
    return null;
  }

  const pkg = getScormPackageById(scormPackageId);
  if (!pkg) {
    return (
      <p className="text-[10px] text-brand-red-400">
        SCORM package not found. Update lms-data/scorm/packages.ts with the
        correct id and launchUrl.
      </p>
    );
  }

  const handleLaunch = () => {
    if (pkg.launchUrl.startsWith("http")) {
      window.open(pkg.launchUrl, "_blank", "noopener,noreferrer");
    } else {
      window.open(pkg.launchUrl, "_blank");
    }
    setLaunched(true);
  };

  return (
    <div className="mt-3 rounded-md border border-slate-800 bg-slate-950 p-3 text-[10px] text-slate-200">
      <p className="font-semibold text-slate-100">
        SCORM Package: {pkg.title}
      </p>
      <p className="mt-1 text-slate-300">
        This button launches the official SCORM content hosted for this course.
        When fully wired with a SCORM runtime or external LMS, it will track
        completions and scores.
      </p>
      {pkg.notes && (
        <p className="mt-1 text-slate-400">
          Setup note: <span className="italic">{pkg.notes}</span>
        </p>
      )}
      <button
        type="button"
        onClick={handleLaunch}
        className="mt-2 rounded-md bg-brand-orange-400 px-4 py-2 text-[10px] font-semibold text-white hover:bg-brand-orange-500"
      >
        Launch SCORM Content
      </button>
      {launched && (
        <p className="mt-1 text-[10px] text-brand-green-400">
          SCORM content opened in a new tab/window.
        </p>
      )}
    </div>
  );
}
