type CourseYouTubeEmbedProps = {
  videoId: string;
  title: string;
};

export default function CourseYouTubeEmbed({
  videoId,
  title,
}: CourseYouTubeEmbedProps) {
  return (
    <div className="w-full rounded-2xl border bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-slate-900">{title}</h3>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}
