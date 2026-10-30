import Link from 'next/link';
import TheoryScheduleEditor from '@/components/apprenticeship/TheoryScheduleEditor';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'My Theory Study Schedule',
  robots: { index: false, follow: false },
};
export default function TheorySchedulePage() {
  return (
    <main className="mx-auto max-w-5xl space-y-5 p-5">
      <Link href="/apprentice" className="font-bold underline">
        Back to my dashboard
      </Link>
      <TheoryScheduleEditor />
    </main>
  );
}
