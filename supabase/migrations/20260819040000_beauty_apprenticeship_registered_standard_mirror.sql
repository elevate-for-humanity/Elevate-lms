-- Registered apprenticeship standards mirror for the approved beauty occupations.
-- Source authority: lib/compliance/appendix-a-standards.ts, derived from the
-- U.S. Department of Labor Office of Apprenticeship approved Appendix A.
--
-- This migration does NOT create a Cosmetology/Hair Stylist registered standard.
-- That occupation must remain fail-closed until an active approved standard is
-- represented in the authoritative Appendix A source and RAPIDS registration.

create unique index if not exists uq_apprenticeship_standard_active_occupation
  on public.apprenticeship_standard_versions (registration_number, rapids_code)
  where is_active = true;

insert into public.apprenticeship_standard_versions (
  standard_key,
  program_slug,
  occupation_title,
  onet_soc_code,
  rapids_code,
  sponsor_name,
  registration_number,
  registration_date,
  revision_date,
  approach,
  competency_count,
  related_instruction_hours,
  apprentice_to_mentor_ratio,
  probationary_hours,
  source_authority,
  is_active
) values
  (
    'esthetician-2089cb-2025-07-10',
    'esthetician-apprenticeship',
    'Esthetician',
    '39-5094.00',
    '2089CB',
    '2 Exclusive LLC-S',
    '2025-IN-132301',
    '2025-01-14',
    '2025-07-10',
    'competency_based',
    20,
    300,
    '1:1',
    500,
    'U.S. Department of Labor Office of Apprenticeship approved Appendix A Work Process Schedule and Related Instruction Outline',
    true
  ),
  (
    'manicurist-2090cb-2025-07-10',
    'nail-technician-apprenticeship',
    'Manicurist',
    '39-5092.00',
    '2090CB',
    '2 Exclusive LLC-S',
    '2025-IN-132301',
    '2025-01-14',
    '2025-07-10',
    'competency_based',
    19,
    210,
    '1:1',
    500,
    'U.S. Department of Labor Office of Apprenticeship approved Appendix A Work Process Schedule and Related Instruction Outline',
    true
  )
on conflict (standard_key) do update set
  program_slug = excluded.program_slug,
  occupation_title = excluded.occupation_title,
  onet_soc_code = excluded.onet_soc_code,
  rapids_code = excluded.rapids_code,
  sponsor_name = excluded.sponsor_name,
  registration_number = excluded.registration_number,
  registration_date = excluded.registration_date,
  revision_date = excluded.revision_date,
  approach = excluded.approach,
  competency_count = excluded.competency_count,
  related_instruction_hours = excluded.related_instruction_hours,
  apprentice_to_mentor_ratio = excluded.apprentice_to_mentor_ratio,
  probationary_hours = excluded.probationary_hours,
  source_authority = excluded.source_authority,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.apprenticeship_standard_competencies
  (standard_key, competency_key, source_label, category, description, display_order, is_required)
values
  ('esthetician-2089cb-2025-07-10','esthetician-a','A','Clean facilities or work areas','Sterilize equipment and clean work areas.',1,true),
  ('esthetician-2089cb-2025-07-10','esthetician-b','B','Clean tools or equipment','Sterilize equipment and clean work areas.',2,true),
  ('esthetician-2089cb-2025-07-10','esthetician-c','C','Apply cleansing or conditioning agents','Cleanse client’s skin with water, creams, or lotions.',3,true),
  ('esthetician-2089cb-2025-07-10','esthetician-d','D','Apply cleansing or conditioning agents','Select and apply cosmetic products, such as creams, lotions, and tonics.',4,true),
  ('esthetician-2089cb-2025-07-10','esthetician-e','E','Apply cleansing or conditioning agents','Perform simple extractions to remove blackheads.',5,true),
  ('esthetician-2089cb-2025-07-10','esthetician-f','F','Apply cleansing or conditioning agents','Treat the facial skin to maintain and improve its appearance, using specialized techniques and products, such as peels and masks.',6,true),
  ('esthetician-2089cb-2025-07-10','esthetician-g','G','Apply cleansing or conditioning agents','Remove body and facial hair by applying wax.',7,true),
  ('esthetician-2089cb-2025-07-10','esthetician-h','H','Apply cleansing or conditioning agents','Apply chemical peels to reduce fine lines and age spots.',8,true),
  ('esthetician-2089cb-2025-07-10','esthetician-i','I','Assess skin or hair conditions','Examine clients skin, using magnifying lamps or visors when necessary, to evaluate skin condition and appearance.',9,true),
  ('esthetician-2089cb-2025-07-10','esthetician-j','J','Assess skin or hair conditions','Determine which products or colors will improve clients'' skin quality and appearance.',10,true),
  ('esthetician-2089cb-2025-07-10','esthetician-k','K','Provide medical or cosmetic advice for clients','Demonstrate how to clean and care for skin properly and recommend skin-care regimens.',11,true),
  ('esthetician-2089cb-2025-07-10','esthetician-l','L','Provide medical or cosmetic advice for clients','Refer clients to medical personnel for treatment of serious skin problems.',12,true),
  ('esthetician-2089cb-2025-07-10','esthetician-m','M','Provide medical or cosmetic advice for clients','Advise clients about colors and types of makeup and instruct them in makeup application techniques.',13,true),
  ('esthetician-2089cb-2025-07-10','esthetician-n','N','Demonstrate activity techniques or equipment use','Demonstrate how to clean and care for skin properly and recommend skin-care regimens.',14,true),
  ('esthetician-2089cb-2025-07-10','esthetician-o','O','Teach health or hygiene practices','Demonstrate how to clean and care for skin properly and recommend skin-care regimens.',15,true),
  ('esthetician-2089cb-2025-07-10','esthetician-p','P','Maintain professional knowledge or certifications','Stay abreast of latest industry trends, products, research, and treatments.',16,true),
  ('esthetician-2089cb-2025-07-10','esthetician-q','Q','Administer therapeutic massages','Provide facial and body massages.',17,true),
  ('esthetician-2089cb-2025-07-10','esthetician-r','R','Maintain client information or service records','Keep records of client needs and preferences and the services provided.',18,true),
  ('esthetician-2089cb-2025-07-10','esthetician-s','S','Sell products or services','Sell makeup to clients.',19,true),
  ('esthetician-2089cb-2025-07-10','esthetician-t','T','Apply solutions to hair for therapeutic or cosmetic purposes','Tint eyelashes and eyebrows.',20,true),
  ('manicurist-2090cb-2025-07-10','manicurist-a','A','Clean tools or equipment','Clean and sanitize tools and work environment.',1,true),
  ('manicurist-2090cb-2025-07-10','manicurist-b','B','Treat nails by shaping, decorating, or augmenting','Prepare nail cuticles with water and oil, using cuticle knives to push back cuticles and scissors or nippers to trim cuticles.',2,true),
  ('manicurist-2090cb-2025-07-10','manicurist-c','C','Treat nails by shaping, decorating, or augmenting','Prepare customers nails in soapy water, using swabs, files, and orange sticks.',3,true),
  ('manicurist-2090cb-2025-07-10','manicurist-d','D','Treat nails by shaping, decorating, or augmenting','Use rotary abrasive wheels to shape and smooth nails or artificial extensions.',4,true),
  ('manicurist-2090cb-2025-07-10','manicurist-e','E','Treat nails by shaping, decorating, or augmenting','Treat nails to repair or improve strength and resilience by wrapping.',5,true),
  ('manicurist-2090cb-2025-07-10','manicurist-f','F','Treat nails by shaping, decorating, or augmenting','Extend nails using powder, solvent, and paper forms attached to tips of customers fingers to support and shape artificial nails.',6,true),
  ('manicurist-2090cb-2025-07-10','manicurist-g','G','Treat nails by shaping, decorating, or augmenting','Remove previously applied nail polish, using liquid remover and swabs.',7,true),
  ('manicurist-2090cb-2025-07-10','manicurist-h','H','Treat nails by shaping, decorating, or augmenting','Shape and smooth ends of nails, using scissors, files, or emery boards.',8,true),
  ('manicurist-2090cb-2025-07-10','manicurist-i','I','Treat nails by shaping, decorating, or augmenting','Apply undercoat and clear or colored polish onto nails with brush.',9,true),
  ('manicurist-2090cb-2025-07-10','manicurist-j','J','Treat nails by shaping, decorating, or augmenting','Roughen surfaces of fingernails, using abrasive wheel.',10,true),
  ('manicurist-2090cb-2025-07-10','manicurist-k','K','Treat nails by shaping, decorating, or augmenting','Polish nails, using powdered polish and buffer.',11,true),
  ('manicurist-2090cb-2025-07-10','manicurist-l','L','Maintain client information or service records','Maintain supply inventories and records of client services.',12,true),
  ('manicurist-2090cb-2025-07-10','manicurist-m','M','Maintain supply or equipment inventories','Maintain supply inventories and records of client services.',13,true),
  ('manicurist-2090cb-2025-07-10','manicurist-n','N','Schedule appointments','Schedule client appointments and accept payments.',14,true),
  ('manicurist-2090cb-2025-07-10','manicurist-o','O','Administer therapeutic massages','Assess the condition of clients hands, remove dead skin, and massage hands.',15,true),
  ('manicurist-2090cb-2025-07-10','manicurist-p','P','Assess skin or hair conditions','Assess the condition of clients hands, remove dead skin, and massage hands.',16,true),
  ('manicurist-2090cb-2025-07-10','manicurist-q','Q','Provide medical or cosmetic advice for clients','Advise clients on nail care and use of products and colors.',17,true),
  ('manicurist-2090cb-2025-07-10','manicurist-r','R','Promote products, services, or programs','Promote and sell nail care products.',18,true),
  ('manicurist-2090cb-2025-07-10','manicurist-s','S','Sell products or services','Promote and sell nail care products.',19,true)
on conflict (standard_key, competency_key) do update set
  source_label = excluded.source_label,
  category = excluded.category,
  description = excluded.description,
  display_order = excluded.display_order,
  is_required = excluded.is_required;

insert into public.apprenticeship_rti_requirements
  (standard_key, title, required_hours, display_order)
values
  ('esthetician-2089cb-2025-07-10','Esthetics History & Professional Ethics',10,1),
  ('esthetician-2089cb-2025-07-10','Anatomy, Physiology & Skin Disorders',60,2),
  ('esthetician-2089cb-2025-07-10','Skin Types, Conditions & Product Selection',60,3),
  ('esthetician-2089cb-2025-07-10','Facial Techniques & Equipment Usage',40,4),
  ('esthetician-2089cb-2025-07-10','Methods & Safety',40,5),
  ('esthetician-2089cb-2025-07-10','Makeup Fundamentals',60,6),
  ('esthetician-2089cb-2025-07-10','State Laws & Licensing Requirements',10,7),
  ('esthetician-2089cb-2025-07-10','Retailing, Client Care & Business Practices',10,8),
  ('esthetician-2089cb-2025-07-10','State Licensing Exam Preparation',10,9),
  ('manicurist-2090cb-2025-07-10','Introduction & Sanitation',5,1),
  ('manicurist-2090cb-2025-07-10','History & Overview of Nail Technology',10,2),
  ('manicurist-2090cb-2025-07-10','Sanitation, Disinfection, & State Board Regulations',40,3),
  ('manicurist-2090cb-2025-07-10','Nail Anatomy & Disorders',25,4),
  ('manicurist-2090cb-2025-07-10','Proper use of tools: Clippers, Buffers, & Cuticle Pushers',5,5),
  ('manicurist-2090cb-2025-07-10','Manicure & Pedicure Techniques',20,6),
  ('manicurist-2090cb-2025-07-10','Nail Art & Specialty Services',30,7),
  ('manicurist-2090cb-2025-07-10','Business & Career Preparation',10,8),
  ('manicurist-2090cb-2025-07-10','Salon Business Management & Retailing',5,9),
  ('manicurist-2090cb-2025-07-10','Client Relations & Customer Retention',5,10),
  ('manicurist-2090cb-2025-07-10','Resume Building & Portfolio Development',10,11),
  ('manicurist-2090cb-2025-07-10','Final Review & Virtual Practical Demonstration',45,12)
on conflict (standard_key, display_order) do update set
  title = excluded.title,
  required_hours = excluded.required_hours;

insert into public.apprenticeship_wage_milestones
  (standard_key, completed_competencies, appendix_hourly_rate, display_order, note)
values
  ('esthetician-2089cb-2025-07-10',0,7.50,1,'Appendix A starting baseline'),
  ('esthetician-2089cb-2025-07-10',10,8.50,2,'Appendix A competency milestone'),
  ('esthetician-2089cb-2025-07-10',20,9.25,3,'Appendix A final competency baseline'),
  ('manicurist-2090cb-2025-07-10',0,7.50,1,'Appendix A starting baseline'),
  ('manicurist-2090cb-2025-07-10',4,8.00,2,'Appendix A competency milestone'),
  ('manicurist-2090cb-2025-07-10',8,8.50,3,'Appendix A competency milestone'),
  ('manicurist-2090cb-2025-07-10',12,9.00,4,'Appendix A competency milestone'),
  ('manicurist-2090cb-2025-07-10',16,10.00,5,'Appendix A competency milestone'),
  ('manicurist-2090cb-2025-07-10',19,15.00,6,'Appendix A final competency baseline')
on conflict (standard_key, completed_competencies) do update set
  appendix_hourly_rate = excluded.appendix_hourly_rate,
  display_order = excluded.display_order,
  note = excluded.note;

-- Fail migration if the database mirror does not exactly match the approved
-- required RTI totals or competency counts.
do $$
declare
  esthetics_rti integer;
  nails_rti integer;
  esthetics_comp integer;
  nails_comp integer;
begin
  select coalesce(sum(required_hours),0) into esthetics_rti
    from public.apprenticeship_rti_requirements
    where standard_key='esthetician-2089cb-2025-07-10';
  select coalesce(sum(required_hours),0) into nails_rti
    from public.apprenticeship_rti_requirements
    where standard_key='manicurist-2090cb-2025-07-10';
  select count(*) into esthetics_comp
    from public.apprenticeship_standard_competencies
    where standard_key='esthetician-2089cb-2025-07-10' and is_required=true;
  select count(*) into nails_comp
    from public.apprenticeship_standard_competencies
    where standard_key='manicurist-2090cb-2025-07-10' and is_required=true;

  if esthetics_rti <> 300 then raise exception 'Esthetician RTI total mismatch: %', esthetics_rti; end if;
  if nails_rti <> 210 then raise exception 'Manicurist RTI total mismatch: %', nails_rti; end if;
  if esthetics_comp <> 20 then raise exception 'Esthetician competency count mismatch: %', esthetics_comp; end if;
  if nails_comp <> 19 then raise exception 'Manicurist competency count mismatch: %', nails_comp; end if;
end $$;
