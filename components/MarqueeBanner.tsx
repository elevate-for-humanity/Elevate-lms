'use client';

/**
 * MarqueeBanner - Placeholder component
 * TODO: Replace with actual marquee implementation when design is ready
 */
export default function MarqueeBanner() {
  return (
    <div className="w-full bg-primary/5 py-3 overflow-hidden">
      <div className="flex animate-marquee">
        <span className="mx-8 text-sm font-medium text-muted-foreground">
          Enrolling Now — Indianapolis Healthcare & Trades Training
        </span>
        <span className="mx-8 text-sm font-medium text-muted-foreground">
          WIOA Funding Available — Apply Today
        </span>
        <span className="mx-8 text-sm font-medium text-muted-foreground">
          Indiana&apos;s Premier Career & Technical Institute
        </span>
      </div>
    </div>
  );
}
