import { HOME_INTRODUCTIONS } from '@/content/home-introductions';
import recordings from '@/content/home-introduction-recordings.json';

export default function HomeSectionNarration({
  section,
}: {
  section: keyof typeof HOME_INTRODUCTIONS;
}) {
  const text = HOME_INTRODUCTIONS[section];
  const recording = (recordings as Record<string, { text: string; src: string }>)[section];
  return (
    <div
      data-scroll-narration
      data-narration={text}
      data-narration-src={recording?.text === text ? recording.src : undefined}
      data-narration-style="commercial"
      className="sr-only"
    >
      {text}
    </div>
  );
}
