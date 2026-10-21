/** October 21 client feedback. Pure, repeatable update of the existing project. */
export function refineLegacy83ClientReview(input) {
  const config = structuredClone(input);
  const slugs = ['/', '/about', '/services', '/resources', '/academy', '/growth-iq', '/journal', '/events', '/contact'];
  if (config.template?.id !== 'legacy83-premium' || config.pages?.length !== 9 || slugs.some(slug => !config.pages.some(page => page.slug === slug))) throw new Error('Expected the existing Legacy 83 premium nine-page project');
  const page = slug => config.pages.find(p => p.slug === slug);
  const section = (slug, id) => page(slug).sections.find(s => s?.id === id);
  const asset = name => `/images/legacy83/review-${name}.webp`;
  const heroImages = { '/about': ['about', 'Illustrative gold flag honoring veterans'], '/services': ['services', 'Ivory chess knight representing a considered strategic move'], '/resources': ['resources', 'Illustrative business planning folio and tools'], '/academy': ['academy', 'Illustrative executive learning space'], '/growth-iq': ['growth-iq', 'Brass compass representing business direction and assessment'], '/journal': ['journal', 'Illustrative journal for business reflection'], '/events': ['events', 'Illustrative executive roundtable; no scheduled event is depicted'], '/contact': ['contact', 'Illustrative executive telephone inviting a consultation'] };
  for (const [slug, [name, alt]] of Object.entries(heroImages)) {
    const hero = page(slug).sections.find(s => s?.type === 'hero');
    hero.content = { ...hero.content, image: asset(name), imageAlt: alt };
    delete hero.content.imageSegment;
    delete hero.content.imageMask;
    hero.settings = { ...hero.settings, variant: 'editorial' };
  }
  const home = section('/', 'hero');
  home.content.image = '/images/legacy83/icy-williams-full-portrait.webp';
  delete home.content.imageMask;
  delete home.content.imageSegment;
  home.settings = { ...home.settings, variant: 'portrait', imageFit: 'contain' };
  home.content.veteranAcknowledgement = 'Honoring veterans and the legacies they build.';
  home.content.narration = 'Welcome to Legacy 83 Business. A legacy is the lasting value you create through your business, your people, and the decisions you make today. With Icy Williams, explore a practical approach to strategy, leadership, operations, and continuity. The G.R.O.W.S. framework brings those priorities into focus. Your next step is a conversation about where you are, where you want to go, and what your business needs to thrive beyond you.';
  config.homepage.heroImage = home.content.image;
  for (const [id, image] of [['academy', 'learning'], ['final-cta', 'continuity']]) {
    const card = section('/', id);
    card.type = 'cta';
    card.content.image = asset(image);
    card.content.imageAlt = image === 'learning' ? 'Illustrative business books in an executive study' : 'Stone bridge representing continuity and the next chapter';
    delete card.content.imageSegment;
    card.settings = { ...card.settings, variant: 'final' };
  }
  const copy = [
    ['/about','about-copy','A Legacy Is More Than a Business You Own','A legacy is the enduring value your business creates for people, families, customers, and the community. It lives in the leaders you develop, the standards you establish, and the opportunities your work makes possible. Building that legacy starts with intentional decisions today.'],
    ['/about','about-story','Build Beyond Your Own Involvement','A strong business needs more than an owner who works harder. It needs clear direction, capable people, and systems that others can carry forward. Legacy 83 brings those priorities into one practical conversation about growth, leadership, and continuity.'],
    ['/services','service-process','From Vision to a Practical Next Step',null],
    ['/academy','academy-how','Learning That Leads to Better Decisions','A lasting business grows when its leaders keep learning. Explore the thinking behind clearer goals, stronger teams, repeatable operations, and continuity. Contact Icy to discuss current learning opportunities and the topics that fit your business.'],
  ];
  for (const [slug,id,title,text] of copy) { const s=section(slug,id); if(s) s.content={...s.content,title,...(text ? {text} : {})}; }
  const introductions = {
    '/services': ['Strategy With a Legacy in Mind','A plan should connect what you want to achieve with the people and systems that will make it possible. Legacy 83 helps you focus the conversation on your business’s next stage: stronger direction, confident leadership, consistent operations, or continuity beyond the founder.'],
    '/resources': ['Make Space for Better Questions','The right resource helps you see your business more clearly. Start by asking where growth depends too heavily on you, where priorities are unclear, and what would need to keep working if you stepped away. Use these insights to begin a focused conversation with Icy.'],
    '/growth-iq': ['Understand Your Starting Point','Legacy Growth IQ is a reflection tool organized around Goals, Revenue, Operations, Workforce, and Succession. It helps you identify a useful starting point for discussion. Your result is a conversation starter, followed by a personal review of your priorities and context.'],
    '/journal': ['A Legacy Is Built in Everyday Decisions','What you document, who you develop, and how you make decisions shape what your business can become. These short perspectives introduce ideas worth exploring. Bring the questions that connect with your business to a conversation with Legacy 83.'],
    '/events': ['Conversations That Move Business Forward','Meaningful learning brings together practical questions, shared experience, and a clear next step. Ask Legacy 83 about opportunities that fit your interests. Confirmed offerings will appear here when they are approved; no events are currently scheduled.'],
    '/contact': ['Start With the Business You Want to Build','Whether you are planning growth, developing leaders, improving operations, or thinking about your next chapter, begin with your goals. A conversation helps identify the questions to explore and whether Legacy 83 is the right fit.'],
  };
  for (const [slug,[title,text]] of Object.entries(introductions)) {
    const id = `${page(slug).id}-legacy-context`;
    const existing=section(slug,id);
    if(existing) existing.content={title,text};
    else page(slug).sections.splice(1,0,{id,type:'rich_text',visible:true,content:{title,text},settings:{}});
  }
  const contact=section('/contact','contact-info');
  if(contact) contact.content={...contact.content,...(config.contact?.email ? {email:config.contact.email} : {}),...(config.contact?.phone ? {phone:config.contact.phone} : {})};
  const bookingId='consultation-booking';
  const bookingContent={title:'Find a Time to Talk',text:'Call (513) 335-1978 to arrange a consultation and discuss a time that works for you.',url:config.contact?.bookingUrl || 'tel:+15133351978',buttonText:config.contact?.bookingUrl ? 'View Available Consultation Times' : 'Call to Arrange a Time'};
  const booking=section('/contact',bookingId);
  if(booking) booking.content={...booking.content,...bookingContent};
  else page('/contact').sections.push({id:bookingId,type:'booking',visible:true,content:bookingContent,settings:{}});
  config.meta={...config.meta,clientReview:{date:'2026-10-21',status:'draft_for_client_review',calendarStatus:config.contact?.bookingUrl ? 'booking_link_requires_availability_test' : 'awaiting_client_google_calendar',musicStatus:'awaiting_client_track_selection',reviewCadence:'Wednesday afternoon',feedbackCategories:['Keep as is','Change','Questions']}};
  return config;
}
