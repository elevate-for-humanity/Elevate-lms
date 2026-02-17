"use client";

import React from 'react';

import { useEffect, useState } from 'react';

interface Resource {
  id: string;
  title: string;
  type: string;
  url: string;
  size?: string;
}

export default function ResourceSection({
  lessonId,
  courseId,
}: {
  lessonId: string;
  courseId: string;
}) {
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    fetch(`/api/courses/${courseId}/lessons/${lessonId}/resources`)
      .then((res) => res.json())
      .then((data) => setResources(data.resources || []));
  }, [lessonId, courseId]);

  if (resources.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-black mb-4">
        Lesson Resources
      </h2>
      <div className="grid gap-3">
        {resources.map((resource) => (
          <a
            key={resource.id}
            href={resource.url}
            download
            className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg hover:border-brand-orange-500 transition"
          >
            <div className="w-10 h-10 bg-brand-orange-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-brand-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-black">{resource.title}</h3>
              <p className="text-sm text-black">
                {resource.type} {resource.size && `• ${resource.size}`}
              </p>
            </div>
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
