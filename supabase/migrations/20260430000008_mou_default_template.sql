-- Insert the default active MOU template so the PDF download route
-- returns correct metadata. Content is intentionally minimal here —
-- the full MOU text is rendered inline on the program-holder/mou page.
INSERT INTO public.mou_templates (name, title, version, is_active, content)
VALUES (
  'mou',
  'Memorandum of Understanding — Program Holder Agreement',
  2,
  true,
  'This Memorandum of Understanding ("MOU") is entered into between Elevate for Humanity Career & Technical Institute ("Elevate") and the Program Holder organization named herein. By signing this MOU, both parties agree to the terms and conditions governing the delivery of workforce training programs, including program delivery standards, reporting requirements, compliance obligations, intellectual property protections, and revenue sharing arrangements as described in the full agreement presented at the time of signing.'
)
ON CONFLICT DO NOTHING;
