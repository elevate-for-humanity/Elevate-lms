-- Original illustrated PDFs remain in private storage; content is not copied
-- into the public source repository. The download handler verifies session RLS.
ALTER TABLE public.digital_workbooks ADD COLUMN IF NOT EXISTS pdf_storage_path text;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='documents' AND NOT public)
 THEN RAISE EXCEPTION 'Workbook PDFs require a private documents bucket'; END IF;
END $$;
UPDATE public.digital_workbooks w SET pdf_storage_path=v.path
FROM (VALUES
 ('prestige-elevation-cosmetology','admin-documents/1793157078005-Prestige_Elevation_Cosmetology_Digital_Workbook.pdf'),
 ('prestige-elevation-barbering','admin-documents/1793157078070-Prestige_Elevation_Barbering_Digital_Workbook.pdf'),
 ('prestige-elevation-esthetics','admin-documents/1793157078143-Prestige_Elevation_Esthetics_Digital_Workbook.pdf'),
 ('prestige-elevation-nail-technology','admin-documents/1793157078121-Prestige_Elevation_Nail_Technology_Digital_Workbook.pdf')
) v(slug,path)
WHERE w.slug=v.slug AND EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='documents' AND o.name=v.path);
