export default function LessonTestPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#0f172a' }}>
      <p style={{ color: '#94a3b8', marginBottom: 12, fontSize: 14 }}>Lesson 5 — How HVAC Systems Work</p>
      <video
        controls
        playsInline
        preload="metadata"
        style={{ width: '100%', maxWidth: 800, borderRadius: 12, background: '#000' }}
      >
        <source src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/media/previews/lesson5-stream-1773206360.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
