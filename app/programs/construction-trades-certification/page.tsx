export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata: Metadata = {
  title: p.metaTitle,
  description: p.metaDescription,
  alternates: { canonical: '/programs/construction-trades-certification' },
};

export default function Page() {
  return (
    <>
      <ProgramStructuredData
        program={{
          id: p.slug,
          name: p.title,
          slug: p.slug,
          description: p.subtitle,
          duration_weeks: p.durationWeeks,
          price: parseInt(p.selfPayCost.replace(/[^0-9]/g, ''), 10),
          image_url: p.heroImage,
          category: p.category,
          outcomes: p.outcomes.map((o) => o.statement),
        }}
      />
      <ProgramDetailPage program={p} />
    </>
  );
}
