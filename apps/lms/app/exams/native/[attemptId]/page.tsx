import NativeExam from './NativeExam';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Certification Exam | Elevate',
  robots: { index: false, follow: false },
};
export default async function Page({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">EPA 608 certification exam</h1>
      <NativeExam attemptId={attemptId} />
    </main>
  );
}
