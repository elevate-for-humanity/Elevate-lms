export async function generateSitemap() {
  return {
    ok: true,
    url: '/sitemap.xml',
    generatedAt: new Date().toISOString(),
  };
}
