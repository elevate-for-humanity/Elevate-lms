-- Replace heuristic Barber competency mapping with an explicit, reviewable Appendix A crosswalk.

delete from public.barber_competency_mappings
where lesson_id in (
  select l.id from public.course_lessons l
  join public.courses c on c.id=l.course_id
  where c.slug='barber-apprenticeship'
);

insert into public.barber_competency_mappings(lesson_id,competency_id,competency_label)
select l.id,x.competency_id,x.label
from public.course_lessons l
join public.courses c on c.id=l.course_id
join (values
  ('barber-lesson-22','barber-a','A — Cut and trim hair'),
  ('barber-lesson-23','barber-a','A — Cut and trim hair'),
  ('barber-lesson-24','barber-a','A — Cut and trim hair'),
  ('barber-lesson-25','barber-a','A — Cut and trim hair'),
  ('barber-lesson-26','barber-a','A — Cut and trim hair'),
  ('barber-lesson-27','barber-a','A — Cut and trim hair'),
  ('barber-lesson-31','barber-b','B — Shape and trim beards and moustaches'),
  ('barber-lesson-33','barber-b','B — Shape and trim beards and moustaches'),
  ('barber-lesson-17','barber-c','C — Razor shaving and contours'),
  ('barber-lesson-29','barber-c','C — Razor shaving and contours'),
  ('barber-lesson-30','barber-c','C — Razor shaving and contours'),
  ('barber-lesson-20','barber-protective-coverings','Apply protective coverings'),
  ('barber-lesson-3','barber-d','D — Clean and sterilize tools'),
  ('barber-lesson-4','barber-d','D — Clean and sterilize tools'),
  ('barber-lesson-18','barber-d','D — Clean and sterilize tools'),
  ('barber-lesson-6','barber-e','E — Discuss service options and needs'),
  ('barber-lesson-12','barber-e','E — Discuss service options and needs'),
  ('barber-lesson-5','barber-f','F — Clean facilities and work areas'),
  ('barber-lesson-42','barber-g','G — Maintain financial/account records'),
  ('barber-lesson-41','barber-h','H — Administrative and clerical tasks'),
  ('barber-lesson-41','barber-i','I — Supervise service workers'),
  ('barber-lesson-2','barber-j','J — Maintain professional knowledge'),
  ('barber-lesson-43','barber-j','J — Maintain professional knowledge'),
  ('barber-lesson-44','barber-k','K — Order materials, supplies, or equipment'),
  ('barber-lesson-40','barber-l','L — Promote products, services, or programs'),
  ('barber-lesson-44','barber-l','L — Promote products, services, or programs'),
  ('barber-lesson-6','barber-m','M — Maintain client/service records'),
  ('barber-lesson-40','barber-m','M — Maintain client/service records')
) as x(lesson_slug,competency_id,label) on x.lesson_slug=l.slug
where c.slug='barber-apprenticeship';

-- Correct generic generated business lessons so their RTI content actually supports the Appendix A crosswalk.
update public.course_lessons set rendered_html='<h2>Professional barbershop business models</h2><p>Barbers may work under wage, commission, booth-rental, management, or ownership arrangements. The legal classification and payroll treatment depend on the actual employment relationship and applicable law, not merely the label used by the shop.</p><h3>Administrative responsibilities</h3><ul><li>Maintain accurate service, payment, appointment, payroll, and business records.</li><li>Understand scheduling, staffing, cash controls, expenses, taxes, insurance, and shop policies.</li><li>Use written procedures for opening, closing, sanitation, incidents, customer complaints, and inventory.</li></ul><h3>Supervising service workers</h3><p>Supervision means setting expectations, observing work, correcting unsafe or deficient performance, documenting coaching, and escalating serious concerns. In the registered apprenticeship, a Host Shop mentor must verify competencies based on observed performance and maintain the approved apprentice-to-mentor ratio.</p><h3>Commission and ownership</h3><p>Compare gross service revenue with wages or commissions, payroll taxes, supplies, merchant fees, rent, insurance, supervision time, rework, and other overhead. Revenue is not the same as profit.</p>' where course_id=(select id from public.courses where slug='barber-apprenticeship' limit 1) and slug='barber-lesson-41';

update public.course_lessons set rendered_html='<h2>Pricing, payments, and financial records</h2><p>Professional barbers must understand how prices, discounts, tips, product sales, and payment processing affect shop records. Every transaction should be recorded consistently so the shop can reconcile services performed with cash, card, or other payment receipts.</p><h3>Core records</h3><ul><li>Service performed, date, price, discount, tax treatment when applicable, and payment method.</li><li>Tips and commissions according to shop policy and payroll rules.</li><li>Daily sales reconciliation and documented corrections/refunds.</li><li>Business expenses such as supplies, tools, rent, insurance, merchant fees, and payroll.</li></ul><p>Apprentices should learn the shop recordkeeping process without altering employer books or payroll records unless authorized.</p>' where course_id=(select id from public.courses where slug='barber-apprenticeship' limit 1) and slug='barber-lesson-42';

update public.course_lessons set rendered_html='<h2>Professional development and ethical practice</h2><p>A barber is responsible for maintaining professional knowledge, following current safety and sanitation practices, understanding applicable laws and rules, and continuing to improve technical and client-service skills.</p><h3>Professional standards</h3><ul><li>Stay current on tools, techniques, styles, products, infection-control guidance, and licensing requirements.</li><li>Protect client privacy and maintain truthful service records.</li><li>Work within legal scope and refer conditions that require medical evaluation.</li><li>Use respectful, nondiscriminatory client and workplace practices.</li><li>Document training, coaching, and corrective action accurately.</li></ul><p>Competency sign-off is based on demonstrated ability, not attendance or time alone.</p>' where course_id=(select id from public.courses where slug='barber-apprenticeship' limit 1) and slug='barber-lesson-43';

update public.course_lessons set rendered_html='<h2>Products, inventory, supplies, and finishing</h2><p>Finishing products should be selected for the client hair type, desired result, scalp/skin condition, and manufacturer directions. Professional shop operations also require controlled inventory and supply ordering.</p><h3>Inventory control</h3><ul><li>Track product and consumable quantities, reorder points, costs, expiration dates, and storage requirements.</li><li>Separate single-use, disinfectable, and reusable tools and supplies.</li><li>Order only approved products and equipment from appropriate sources.</li><li>Rotate stock and remove expired, contaminated, damaged, or recalled products.</li></ul><h3>Retail recommendations</h3><p>Recommend products based on client needs and actual product function. Explain use, safety, and maintenance without making unsupported medical claims. Record relevant products used or recommended in the client service record when shop policy requires it.</p>' where course_id=(select id from public.courses where slug='barber-apprenticeship' limit 1) and slug='barber-lesson-44';

update public.course_lessons set rendered_html='<h2>Client retention, promotion, and service records</h2><p>Building clientele depends on reliable service, ethical promotion, accurate records, communication, and consistent follow-up—not pressure selling.</p><h3>Client/service records</h3><ul><li>Record services performed, products used, preferences, contraindications, fees, and relevant follow-up notes.</li><li>Protect client information and use it only for legitimate shop operations.</li><li>Document corrections, complaints, or adverse reactions according to shop policy.</li></ul><h3>Promoting services and products</h3><p>Explain services and retail products accurately, use truthful pricing and advertising, and avoid guarantees that cannot be supported. Repeat business should be earned through quality, safety, professionalism, and appropriate recommendations.</p>' where course_id=(select id from public.courses where slug='barber-apprenticeship' limit 1) and slug='barber-lesson-40';
