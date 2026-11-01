'use client';
import { HOME_INTRODUCTIONS } from '@/content/home-introductions';
import recordings from '@/content/home-introduction-recordings.json';
import { ProgramNarration } from '@/components/programs/NarratedProgramIntro';
export default function HomeSectionNarration({
  section,
}: {
  section: keyof typeof HOME_INTRODUCTIONS;
}) {
  const text = HOME_INTRODUCTIONS[section];
  const recording = (recordings as Record<string, { text: string; src: string }>)[section];
  return (
    <ProgramNarration text={text} source={recording?.text === text ? recording.src : undefined} />
  );
}
