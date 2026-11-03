/* eslint-disable @next/next/no-img-element */
'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { ShoppingBag, ArrowRight, ChevronLeft, ChevronRight, Volume2, VolumeX, Play, Pause, Captions } from 'lucide-react';
import type { PublishedTenantSite, TenantSiteProduct } from '@/lib/tenant/site-types';
import { useTenantShoppingBag, TenantBagDrawer, productPrice } from './TenantShoppingBag';
import { readWebsiteDesign } from '@/lib/website-builder/design-choices';
import { StoreMusicSwitch, useStoreMusic } from './MeriStoreMusic';
import styles from './wellness-storefront.module.css';

const ROOT = '/images/meri-gold-round';
const rituals = [
  { image: 'scalp', title: 'Care from the roots.', text: 'Make hair and scalp care a moment of intention. Explore botanical oils for your everyday grooming routine.', match: 'hair-scalp', label: 'Explore hair care' },
  { image: 'body', title: 'A moment, just for you.', text: 'Slow down with a body-care ritual. Discover our signature oil and rich whipped shea butter.', match: 'signature', label: 'Explore body care' },
  { image: 'soak', title: 'Leave the day behind.', text: 'Set out a towel, prepare your foot soak as directed, and make space for a little quiet.', match: 'foot-soak', label: 'Explore bath & foot care' },
  { image: 'cleanse', title: 'Start fresh. Feel cared for.', text: 'Bring a thoughtful touch to your daily cleanse with our collection of cosmetic soaps.', match: 'turmeric-glycerin', label: 'Explore skin care' },
];
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const price = productPrice;

function BrandFilm() {
  const ref = useRef<HTMLVideoElement>(null);
  const setFilmAudible = useStoreMusic()?.setFilmAudible;
  const [captions, setCaptions] = useState(false);
  const pausedByViewer = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const playFilm = useCallback(() => {
    const film = ref.current;
    if (!film) return Promise.resolve();
    // Claim audible playback before play() queues its event and the tap bubbles
    // to the document's soundtrack unlock handler.
    setFilmAudible?.(!film.muted);
    return film.play().catch(error => {
      setFilmAudible?.(false);
      throw error;
    });
  }, [setFilmAudible]);
  useEffect(() => {
    const film = ref.current;
    if (!film || !window.IntersectionObserver) return;
    let attempt = 0;
    const observer = new IntersectionObserver(([entry]) => {
      const current = ++attempt;
      if (entry.intersectionRatio < 0.5) { film.pause(); return; }
      if (pausedByViewer.current || film.ended || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      playFilm().catch(error => {
        if (current !== attempt || error.name !== 'NotAllowedError') return;
        film.muted = true;
        void playFilm().catch(() => {});
      });
    }, { threshold: [0, 0.5] });
    observer.observe(film);
    return () => { ++attempt; observer.disconnect(); film.pause(); };
  }, [playFilm]);
  useEffect(() => () => setFilmAudible?.(false), [setFilmAudible]);
  useEffect(() => {
    const track = ref.current?.textTracks?.[0];
    if (track) track.mode = captions ? 'showing' : 'disabled';
  }, [captions]);
  function togglePlay() {
    const film = ref.current;
    if (!film) return;
    pausedByViewer.current = !film.paused;
    if (film.paused) void playFilm().catch(() => {});
    else film.pause();
  }
  function toggleSound() {
    const film = ref.current;
    if (!film) return;
    setFilmAudible?.(film.muted);
    film.muted = !film.muted;
    if (!film.muted && film.paused) {
      pausedByViewer.current = false;
      void playFilm().catch(() => {});
    }
  }
  return <div className={styles.brandFilm}>
    <video ref={ref} playsInline preload="metadata" poster={`${ROOT}/rituals/body.webp`}
      aria-label="The Meri-Gold-Round brand film" onPlay={e => { setFilmAudible?.(!e.currentTarget.muted); setPlaying(true); }}
      onPause={() => { setPlaying(false); setFilmAudible?.(false); }}
      onEnded={() => { setPlaying(false); setFilmAudible?.(false); }}
      onVolumeChange={e => { setMuted(e.currentTarget.muted); setFilmAudible?.(!e.currentTarget.paused && !e.currentTarget.muted); }}>
      <source src="/videos/meri-gold-round/brand-story.mp4?v=music2" type="video/mp4" />
      <track kind="captions" srcLang="en" label="English" src="/videos/meri-gold-round/brand-story.vtt?v=warm-20261103" />
    </video>
    <div className={styles.filmActions}>
      <button type="button" aria-label="Closed captions" aria-pressed={captions} onClick={() => setCaptions(!captions)}><Captions size={16} /></button>
      <button type="button" onClick={togglePlay} aria-label={playing ? 'Pause film' : 'Play film'}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
      <button type="button" onClick={toggleSound} aria-label={muted ? 'Hear narration and music' : 'Mute film'}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
    </div>
  </div>;
}

/** Isolated presentation for the owner's existing imported Shopify collection.
 * Catalog, prices, product URLs, contacts and secondary pages remain builder-owned.
 */
export function WellnessStorefront({ site, pathname, basePath, children }: { site: PublishedTenantSite; pathname: string; basePath: string; children: ReactNode }) {
  const products = (site.config.products || []).map(p => p.image?.includes('image_aaab83e1-7a70-4bf5-b28a-ec718af12b9f') ? { ...p, image: `${ROOT}/hair-scalp-oil-catalog.webp` } : p);
  const design = site.config.meta?.designPreferences ? readWebsiteDesign(site.config.meta.designPreferences) : null;
  const heroOverride = typeof site.config.meta?.heroImageOverride === 'string' ? site.config.meta.heroImageOverride : '';

  const bag = useTenantShoppingBag({ ...site, config: { ...site.config, products } }, basePath);
  const {totalCount, add, openBag, notice, dialog, href} = bag;
  const [slide, setSlide] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All products');
  const [sort, setSort] = useState('featured');
  const categoryFor = (p: TenantSiteProduct) => p.category || (/hair|scalp|shampoo/i.test(p.name) ? 'Hair & scalp' : /soap|cleans/i.test(p.name) ? 'Skin & cleansing' : /soak|bath/i.test(p.name) ? 'Bath & foot care' : 'Body & massage');
  const categories = ['All products', ...new Set(products.map(categoryFor))];
  const filteredProducts = products.filter(p => (category === 'All products' || categoryFor(p) === category) && `${p.name} ${p.description || ''}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a,b) => sort === 'low' ? price(a)-price(b) : sort === 'high' ? price(b)-price(a) : sort === 'name' ? a.name.localeCompare(b.name) : 0);

  const selectedProduct = products.find(p => p.href?.split('?')[0] === pathname);
  const isHome = pathname === '/';
  const isShop = pathname === '/shop';
  const active = rituals[slide];
  const featured = [5, 4, 6, 10].map(i => products[i]).filter(Boolean);
  function Card({ product }: { product: TenantSiteProduct }) {
    return <article className={styles.product}>
      <a className={styles.productImage} href={href(product.href || '/shop')}><img src={product.image} alt={product.imageAlt || product.name} loading="lazy" /></a>
      <div className={styles.productCopy}><p className={styles.kicker}>MERI-GOLD-ROUND</p><h3><a href={href(product.href || '/shop')}>{product.name}</a></h3><p>{product.description}</p><strong>{money(price(product))}</strong><button type="button" onClick={() => add(product)} disabled={!product.href || !Number.isFinite(price(product)) || price(product) <= 0}>Add to bag <span aria-hidden="true">+</span></button></div>
    </article>;
  }
  return <div className={styles.store} data-template={design?.template} data-layout={design?.layout} data-density={design?.density} style={design ? { '--ink': site.config.branding.primaryColor, backgroundColor: site.config.branding.backgroundColor } as CSSProperties : undefined}>
    <div className={styles.announcement}>CURVATURE BODY SCULPTING · THE MERI-GOLD-ROUND COLLECTION</div>
    <header className={styles.header}>
      <a className={styles.brand} href={href('/')}><span>MERI-GOLD-ROUND</span><small>BOTANICAL BODY, SKIN & HAIR CARE</small></a>
      <nav aria-label="Store navigation"><a href={href('/shop')}>Shop collection</a><a href={href('/about')}>Our story</a><a href={href('/contact')}>Contact</a><StoreMusicSwitch /></nav>
      <button type="button" className={styles.bagButton} onClick={openBag} aria-label={`Shopping bag, ${totalCount} items`}><ShoppingBag size={19} /> Bag <span>{totalCount}</span></button>
    </header>
    <main id="main-content">
      {isHome ? <>
        <section className={styles.hero}>
          <img src={heroOverride || `${ROOT}/spa-stones-hero.webp`} alt="Warm spa setting with stacked massage stones, botanical greenery, oil and mineral bath salts" fetchPriority="high" />
          <div className={styles.heroCopy}><p className={styles.kicker}>A LITTLE CARE. A FULLER RITUAL.</p><h1>Come back<br />to yourself.</h1><p>Botanical oils, nourishing body care, and everyday rituals for skin and hair. Discover your own round of self-care.</p><a className={styles.primary} href={href('/shop')}>Find your ritual <ArrowRight size={18} /></a><a className={styles.textLink} href="#brand-film">Meet Meri-Gold-Round ↓</a></div>
        </section>
        <div className={styles.promise}><span>Body & massage</span><span>Hair & scalp</span><span>Bath & foot care</span><span>Skin & daily cleansing</span></div>
        <div className={styles.purchaseInfo}><div><strong>Shop your ritual</strong><span>Body, skin, hair and bath essentials in one collection.</span></div><div><strong>Your bag stays with you</strong><span>Review quantities and a clear merchandise subtotal.</span></div><div><strong>Personal order support</strong><span>Request an invoice to confirm availability, shipping and tax.</span></div></div>
        <section className={styles.brandNote} aria-label="The Meri-Gold-Round approach"><span className={styles.brandSeal} aria-hidden="true">M<span>the everyday round</span></span><div><p className={styles.kicker}>MORE THAN A SPOT ON YOUR SHELF</p><h2>A little ritual.<br /><em>A whole lot of you.</em></h2></div><p>For the mornings you want to start fresh. The evenings you need to slow down. And the quiet moments when taking care of yourself comes first.</p></section>
        <section className={styles.section} id="brand-film"><div className={styles.sectionHeading}><div><p className={styles.kicker}>WATCH. LISTEN. MAKE IT YOURS.</p><h2>The story of your everyday round.</h2></div></div><div className={styles.filmGrid}><BrandFilm /><div><p className={styles.kicker}>A MOMENT OF INTENTION</p><h3>Care that fits into your life.</h3><p>A gentle cleanse. A warm soak. A thoughtful scalp routine. A moment of body care. Explore the collection one ritual at a time.</p><small>AI-created lifestyle scenes illustrate care routines; they do not show customer results.</small></div></div></section>
        <section className={styles.section}><div className={styles.sectionHeading}><div><p className={styles.kicker}>YOUR EVERYDAY ESSENTIALS</p><h2>Small rituals. Beautiful possibilities.</h2></div><a href={href('/shop')}>Shop all products <ArrowRight size={17} /></a></div><div className={styles.productGrid}>{featured.map(p => <Card key={p.href} product={p} />)}</div></section>
        <section className={styles.storyPanel}><div className={styles.storyPhoto}><img src={`${ROOT}/original-spa-hero.jpg`} alt="A bright spa setting with botanical care, towels and massage tools" loading="lazy" /><span>THE ART OF TAKING A MOMENT</span></div><div className={styles.storyWords}><p className={styles.kicker}>CURVATURE BODY SCULPTING PRESENTS</p><h2>Your body.<br />Your pace.<br /><em>Your round.</em></h2><p>Meri-Gold-Round brings body, skin, hair and bath care into one thoughtful collection. Start with the part of your day that needs a little more care, and build a routine that feels like yours.</p><a className={styles.primary} href={href('/shop')}>Create your own ritual <ArrowRight size={18} /></a></div></section>
        <section className={styles.slideshow} aria-roledescription="carousel" aria-label="Everyday self-care rituals">
          <div className={styles.slideImage}><img src={`${ROOT}/rituals/${active.image}.webp`} alt={`${active.title} Illustrative self-care scene`} /><span>Illustrative lifestyle photography</span></div>
          <div className={styles.slideCopy} aria-live="polite"><p className={styles.kicker}>THE EVERYDAY ROUND · {String(slide + 1).padStart(2, '0')} / 04</p><h2>{active.title}</h2><p>{active.text}</p><a className={styles.primary} href={href(products.find(p => p.href?.includes(active.match))?.href || '/shop')}>{active.label} <ArrowRight size={18} /></a><div className={styles.slideControls}><button type="button" aria-label="Previous ritual" onClick={() => setSlide((slide + 3) % 4)}><ChevronLeft /></button>{rituals.map((r, i) => <button key={r.image} type="button" aria-label={`Show ${r.title}`} aria-pressed={slide === i} onClick={() => setSlide(i)}>{i + 1}</button>)}<button type="button" aria-label="Next ritual" onClick={() => setSlide((slide + 1) % 4)}><ChevronRight /></button></div></div>
        </section>
        <section className={styles.ritualSteps}><div><p className={styles.kicker}>MAKE ROOM FOR YOURSELF</p><h2>Build your everyday round.</h2><p>Choose a moment. Choose your care. Make it a habit.</p></div><div className={styles.stepsGrid}>{[
          ['01', 'Fresh beginnings', 'Discover cosmetic soaps for your cleansing routine.', 'turmeric-glycerin', 'Find your cleanse'],
          ['02', 'Rooted in care', 'Explore botanical oils for your hair and scalp routine.', 'hair-scalp', 'Find your hair care'],
          ['03', 'A softer landing', 'Bring bath soaks and body care into your wind-down time.', 'foot-soak', 'Find your quiet moment'],
        ].map(([number, title, description, match, label]) => <a key={number} href={href(products.find(p => p.href?.includes(match))?.href || '/shop')}><span>{number}</span><h3>{title}</h3><p>{description}</p><strong>{label} <ArrowRight size={16} /></strong></a>)}</div></section>
        <section className={styles.closing}><span className={styles.closingMark} aria-hidden="true">Meri-Gold-Round</span><p className={styles.kicker}>THE MERI-GOLD-ROUND COLLECTION</p><h2>Your next good habit<br />starts with a little care.</h2><a className={styles.primary} href={href('/shop')}>Shop the collection <ArrowRight size={18} /></a></section>
      </> : isShop ? <section className={styles.section}><p className={styles.kicker}>CURVATURE BODY SCULPTING</p><h1>Find your everyday ritual.</h1><p>Explore botanical body care, soaps, hair oils and bath essentials. Add your favorites to your bag.</p><div className={styles.shopTools}><label>Search products<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search oils, soaps, bath care…" /></label><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Sort products<select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="name">Name: A–Z</option></select></label></div><p className={styles.results} role="status">{filteredProducts.length} products found</p><div className={styles.productGrid}>{filteredProducts.map(p => <Card key={p.href} product={p} />)}{!filteredProducts.length?<div className={styles.emptySearch}><h2>No matching products</h2><p>Try another search or category.</p><button type="button" className={styles.primary} onClick={()=>{setQuery('');setCategory('All products');}}>Show all products</button></div>:null}</div></section> : selectedProduct ? <section className={styles.productDetail}><div className={styles.detailImage}><img src={selectedProduct.image} alt={selectedProduct.imageAlt || selectedProduct.name} /></div><div><p className={styles.kicker}>THE MERI-GOLD-ROUND COLLECTION</p><h1>{selectedProduct.name}</h1><p>{selectedProduct.description}</p><strong className={styles.detailPrice}>{money(price(selectedProduct))}</strong><button className={styles.primary} type="button" onClick={() => add(selectedProduct)}>Add to bag <ShoppingBag size={18} /></button><button className={styles.textLink} type="button" onClick={openBag}>View shopping bag ({totalCount})</button><p>Follow the directions on your product label.</p><a href={href('/shop')}>← Continue shopping</a></div></section> : children}
    </main>
    <footer className={styles.footer}><div><strong>MERI-GOLD-ROUND</strong><p>By Curvature Body Sculpting, LLC.<br />Botanical care. Everyday intention.</p></div><div><strong>Explore</strong><a href={href('/shop')}>Shop the collection</a><a href={href('/about')}>Our story</a><button type="button" onClick={openBag}>Shopping bag ({totalCount})</button></div><div><strong>We're here to help</strong><a href={`mailto:${site.config.contact?.email || site.config.footer.contactEmail}`}>{site.config.contact?.email || site.config.footer.contactEmail}</a>{site.config.contact?.phone ? <a href={`tel:${site.config.contact.phone}`}>{site.config.contact.phone}</a> : null}<a href={href('/contact')}>Product & order questions</a></div><small>Product imagery comes from the collection, with selected backgrounds digitally styled. Lifestyle scenes are illustrative. Use each product only as directed on its label.</small></footer>
    <div role="status" className={notice && !dialog.current?.open ? styles.toast : styles.srOnly}>{!dialog.current?.open ? notice : ''}{notice && !dialog.current?.open ? <button type="button" onClick={openBag}>View bag →</button> : null}</div>
    <TenantBagDrawer bag={bag} />
  </div>;
}
