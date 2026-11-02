/* eslint-disable @next/next/no-img-element */
'use client';
import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ShoppingBag, ArrowRight, X } from 'lucide-react';
import type { PublishedTenantSite, TenantSiteProduct } from '@/lib/tenant/site-types';
import { tenantSiteHref } from '@/lib/tenant/site-links';
import { useTenantRequestHeaders } from './TenantPreviewContext';
import styles from './wellness-storefront.module.css';
import { websiteCatalog } from '@/lib/website-builder/design-choices';
export const productPrice = (p: TenantSiteProduct) => { const raw = p.price?.trim() || ''; return /^\$?\d+(?:,\d{3})*(?:\.\d{1,2})?(?:\s*USD)?$/i.test(raw) ? Number(raw.replace(/[$,]|USD/gi, '').trim()) : NaN; };
const price = productPrice;
const money = (value: number) => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'}).format(value);
type Counts = Record<string, number>;
export function useTenantShoppingBag(site: PublishedTenantSite, basePath: string) {
  const products = websiteCatalog(site.config);
  const [counts, setCounts] = useState<Counts>({});
  const [restored, setRestored] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const headers = useTenantRequestHeaders();
  const storageKey = `wellness-cart:${site.id}`;
  const href = (path: string) => tenantSiteHref(path === '/shop' && site.config.pages && !site.config.pages.some(p => p.slug === '/shop') ? site.config.pages.find(p => p.sections.some(s => s.type === 'products'))?.slug || '/' : path, basePath);
  const rows = products.filter(p => p.href && counts[p.href] > 0 && Number.isFinite(price(p)) && price(p) > 0);
  const totalCount = rows.reduce((sum, p) => sum + counts[p.href!], 0);
  const subtotal = rows.reduce((sum, p) => sum + Math.round(price(p) * 100) * counts[p.href!], 0) / 100;

  useEffect(() => {
    try {
      const raw: unknown = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const safe: Counts = {};
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        for (const [key, value] of Object.entries(raw)) {
          if (Number.isInteger(value) && value > 0 && value <= 20) safe[key] = value;
        }
      }
      setCounts(safe);
    } catch { /* A blocked browser store still allows shopping in this tab. */ }
    setRestored(true);
  }, [storageKey]);
  useEffect(() => {
    if (!restored) return;
    try { localStorage.setItem(storageKey, JSON.stringify(counts)); } catch { /* Keep the in-memory cart usable. */ }
  }, [counts, restored, storageKey]);

  function change(product: TenantSiteProduct, amount: number) {
    if (!product.href) return;
    const key = product.href;
    setCounts(previous => {
      const next = { ...previous };
      const value = Math.min(20, Math.max(0, (previous[key] || 0) + amount));
      if (value) next[key] = value; else delete next[key];
      return next;
    });
    setSent(false);
  }
  function add(product: TenantSiteProduct) {
    change(product, 1);
    setNotice(`${product.name} added to your bag.`);
  }
  function openBag() { setNotice(''); dialog.current?.showModal(); }
  async function requestInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !rows.length) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setNotice('');
    try {
      const message = ['Shopping bag — invoice request (not a payment)', ...rows.map(p => `${counts[p.href!]} × ${p.name} (${p.href}) — displayed unit price ${money(price(p))}`), `Displayed merchandise subtotal: ${money(subtotal)}. Please confirm availability, shipping, tax and final invoice.`].join('\n');
      const response = await fetch('/api/tenant-sites/lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ name: form.get('name'), email: form.get('email'), message, path: window.location.pathname }),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error(result.error || 'Your request could not be saved. Please try again.');
      setSent(true);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Your request could not be saved. Please try again.'); }
    finally { setBusy(false); }
  }

  return { productsAvailable: products.some(p => p.href && price(p)>0), counts, setCounts, notice, setNotice, busy, sent, setSent, rows, totalCount, subtotal, dialog, add, change, openBag, requestInvoice, href };
}
export function TenantBagDrawer({bag}: {bag: ReturnType<typeof useTenantShoppingBag>}) {
 const {dialog,totalCount,rows,counts,change,setCounts,setSent,subtotal,sent,requestInvoice,busy,notice,href}=bag;
 return (    <dialog ref={dialog} className={styles.dialog} aria-labelledby="bag-title"><div className={styles.dialogHeading}><h2 id="bag-title">Your shopping bag ({totalCount})</h2><button type="button" aria-label="Close shopping bag" onClick={() => dialog.current?.close()}><X /></button></div>{rows.length ? <><div className={styles.bagRows}>{rows.map(p => <article key={p.href}><img src={p.image} alt={p.name} /><div><h3>{p.name}</h3><p>{money(price(p))} each</p><div className={styles.quantity}><button type="button" aria-label={`Decrease ${p.name}`} onClick={() => change(p, -1)}>−</button><span aria-label="Quantity">{counts[p.href!]}</span><button type="button" disabled={counts[p.href!] >= 20} aria-label={`Increase ${p.name}`} onClick={() => change(p, 1)}>+</button><button type="button" onClick={() => { setCounts(prev => { const next = { ...prev }; delete next[p.href!]; return next; }); setSent(false); }}>Remove</button></div></div></article>)}</div><div className={styles.subtotal}><strong>Merchandise subtotal</strong><strong>{money(subtotal)}</strong></div><p className={styles.invoiceNote}>Request an invoice to confirm availability, shipping, tax and your final total. No payment is collected on this page.</p>{sent ? <p role="status" className={styles.success}>Your invoice request was saved. Our team will review your bag and contact you. Your bag is kept here for reference; this is not a paid order.</p> : <form onSubmit={requestInvoice}><label>Your name<input name="name" required maxLength={160} autoComplete="name" /></label><label>Email for your invoice<input name="email" type="email" required maxLength={240} autoComplete="email" /></label><button className={styles.primary} type="submit" disabled={busy}>{busy ? 'Saving request…' : 'Request invoice'} <ArrowRight size={18} /></button></form>}{notice ? <p role="alert">{notice}</p> : null}</> : <div className={styles.empty}><ShoppingBag size={40} /><h3>Your next ritual is waiting.</h3><p>Your bag is empty. Explore the collection and add your favorites.</p><a className={styles.primary} href={href('/shop')}>Explore the collection</a></div>}</dialog>
 );
}

const BagContext=createContext<ReturnType<typeof useTenantShoppingBag>|null>(null);
export function TenantCommerce({site,basePath,children}:{site:PublishedTenantSite;basePath:string;children:ReactNode}) {
 const bag=useTenantShoppingBag(site,basePath);
 return <BagContext.Provider value={bag}><div className={styles.commerce}>{children}<TenantBagDrawer bag={bag}/>{bag.notice&&!bag.dialog.current?.open?<div role="status" className={styles.toast}>{bag.notice}<button type="button" onClick={bag.openBag}>View bag →</button></div>:null}</div></BagContext.Provider>;
}
export function TenantBagButton(){const bag=useContext(BagContext);if(!bag||!bag.productsAvailable)return null;return <button type="button" className={styles.bagButton} onClick={bag.openBag} aria-label={`Shopping bag, ${bag.totalCount} items`}><ShoppingBag size={19}/> Bag ({bag.totalCount})</button>;}
export function TenantAddToBag({product}:{product:TenantSiteProduct}){const bag=useContext(BagContext);if(!bag||!product.href||!Number.isFinite(price(product))||price(product)<=0)return null;return <button type="button" className="mt-3 min-h-11 w-full rounded-xl border border-current px-4 py-2 font-bold" onClick={()=>bag.add(product)}>Add to bag</button>;}
