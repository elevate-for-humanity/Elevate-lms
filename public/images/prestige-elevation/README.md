# Prestige Elevation™ — brand assets

Place exported artwork here (WebP preferred; JPG acceptable).

| File | Use | Recommended size |
|------|-----|------------------|
| `hero-workbook-cover.webp` | Program page hero **poster** (video fallback / reduced motion) | 1920×1080, panel 1 (“Elevate Your Future”) |
| `lms-course-cover.webp` | LMS course landing hero + catalog thumbnails | 1200×800 or 16:9 crop of panel 1 |
| `workbook-spread.webp` | Optional: full 8-panel workbook (PDF download, marketing) | As designed |

After adding files, no code change is required if filenames match — wired in `data/programs/barber-apprenticeship.ts` and `public/data/hero-banners.json`.

To set the live LMS course hero in Supabase (program row):

```sql
UPDATE programs
SET hero_image_url = '/images/prestige-elevation/lms-course-cover.webp',
    image_url = '/images/prestige-elevation/lms-course-cover.webp'
WHERE slug = 'barber-apprenticeship';
```

Institute contact on panel 7 (6331 N Keystone Ave, (317) 314-3757) can live on `/programs/barber-apprenticeship` or a dedicated Prestige landing page when you add one.
