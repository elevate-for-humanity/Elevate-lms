/**
 * SectionIntro — locked section heading block.
 *
 * Eyebrow → H2 → optional body copy.
 * Use at the top of every major section instead of writing one-off headings.
 */
interface SectionIntroProps {
  eyebrow?: string;
  heading: string;
  body?: string;
  align?: 'left' | 'center';
}

export default function SectionIntro({
  eyebrow,
  heading,
  body,
  align = 'left',
}: SectionIntroProps) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : '';
  return (
    <div className={`mb-8 sm:mb-10 max-w-2xl ${alignClass}`}>
      {eyebrow && (
        <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{heading}</h2>
      {body && (
        <p className="text-slate-600 text-base leading-relaxed mt-2">{body}</p>
      )}
    </div>
  );
}
