"use client";

import Image from 'next/image';
import { Mail, Linkedin, Award, BookOpen } from 'lucide-react';

interface InstructorBioProps {
  name: string;
  title: string;
  photo: string;
  bio: string;
  credentials: string[];
  specialties: string[];
  email?: string;
  linkedin?: string;
  coursesCount?: number;
  studentsCount?: number;
}

export function InstructorBio({
  name,
  title,
  photo,
  bio,
  credentials,
  specialties,
  email,
  linkedin,
  coursesCount = 0,
  studentsCount = 0,
}: InstructorBioProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Photo */}
        <div className="flex-shrink-0">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-100">
            <Image
              src={photo}
              alt={`${name} - ${title}`}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-black">{name}</h2>
          <p className="text-brand-orange-600 font-semibold mt-1">{title}</p>

          {/* Stats */}
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2 text-sm text-black">
              <BookOpen className="w-4 h-4" />
              <span>{coursesCount} Courses</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-black">
              <Award className="w-4 h-4" />
              <span>{studentsCount} Students</span>
            </div>
          </div>

          {/* Contact */}
          <div className="flex gap-3 mt-4">
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 px-3 py-2.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                <Mail className="w-4 h-4" />
                Email
              </a>
            )}
            {linkedin && (
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 text-sm bg-brand-blue-100 hover:bg-brand-blue-200 text-brand-blue-700 rounded-lg transition"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
            )}
          </div>

          {/* Bio */}
          <p className="mt-4 text-black leading-relaxed">{bio}</p>

          {/* Credentials */}
          {credentials.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-black mb-2">
                Credentials & Certifications
              </h3>
              <ul className="space-y-1">
                {credentials.map((cred, idx) => (
                  <li key={idx} className="text-sm text-black flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">•</span>
                    {cred}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Specialties */}
          {specialties.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-black mb-2">
                Areas of Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {specialties.map((specialty, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-2 bg-brand-red-50 text-brand-red-700 text-xs font-medium rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
