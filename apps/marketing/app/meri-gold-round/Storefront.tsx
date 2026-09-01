'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import styles from './storefront.module.css';

const PRICE = 24.99;

const benefits = [
  ['Hair & scalp', 'Nourishes and conditions'],
  ['Skin & body', 'Hydrates and softens'],
  ['Massage & comfort', 'A smooth, warming self-care ritual'],
  ['Daily wellness', 'One easy roller, wherever you go'],
];

export default function Storefront() {
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function checkout() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/meri-gold-round/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ quantity, email: email.trim() || undefined }),
      });
      const data = await response.json();
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'Unable to start checkout.');
      }
      window.location.assign(data.checkoutUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Unable to start checkout.');
      setLoading(false);
    }
  }

  return (
    <main className={styles.store}>
      <div className={styles.announcement}>Free U.S. shipping on orders of 3 or more rollers</div>
      <header className={styles.header}>
        <Link href="/meri-gold-round" className={styles.brand}>
          <span>MERI-GOLD-ROUND</span>
          <small>CURVATURE BODY SCULPTING</small>
        </Link>
        <nav aria-label="Store navigation">
          <a href="#shop">Shop</a>
          <a href="#benefits">Benefits</a>
          <a href="#ingredients">Ingredients</a>
          <a href="#care">Customer care</a>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>ONE OIL. WHOLE BODY. TOTAL CARE.</p>
          <h1>Your daily ritual, from head to toe.</h1>
          <p className={styles.lede}>
            A portable botanical oil roller made for hair, scalp, skin, body, massage,
            and everyday moments of care.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primary} href="#shop">Shop Multi-Zone Oil</a>
            <a className={styles.secondary} href="#ingredients">See what is inside</a>
          </div>
          <div className={styles.trustRow} aria-label="Product qualities">
            <span>Cruelty free</span><span>Paraben free</span><span>Made in USA</span>
          </div>
        </div>
        <div className={styles.heroMedia}>
          <Image
            src="/images/meri-gold-round/product-lineup.webp"
            alt="Meri-Gold-Round Multi-Zone Oil roller bottles and product packaging"
            fill
            priority
            sizes="(max-width: 800px) 100vw, 54vw"
          />
        </div>
      </section>

      <section id="benefits" className={styles.benefitStrip}>
        {benefits.map(([title, description]) => (
          <div key={title}><strong>{title}</strong><span>{description}</span></div>
        ))}
      </section>

      <section id="shop" className={styles.productSection}>
        <div className={styles.productMedia}>
          <Image
            src="/images/meri-gold-round/product-detail.webp"
            alt="Meri-Gold-Round Multi-Zone Oil in black and gold packaging"
            fill
            sizes="(max-width: 800px) 100vw, 50vw"
          />
        </div>
        <div className={styles.buyBox}>
          <p className={styles.eyebrow}>10 ML / 0.34 FL OZ</p>
          <h2>Meri-Gold-Round Multi-Zone Oil</h2>
          <p className={styles.rating}>★★★★★ <span>Everyday head-to-toe care</span></p>
          <p className={styles.price}>${PRICE.toFixed(2)}</p>
          <p>
            Roll onto desired areas and massage gently. The compact roller is easy to
            keep at your vanity, desk, gym bag, or bedside.
          </p>
          <label className={styles.field}>
            Quantity
            <select value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            Email for receipt <span>(optional now)</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <button className={styles.checkout} onClick={checkout} disabled={loading}>
            {loading ? 'Opening secure checkout…' : `Buy now — $${(PRICE * quantity).toFixed(2)}`}
          </button>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <p className={styles.secure}>Secure payment powered by Stripe · Shipping address collected at checkout</p>
          <ul className={styles.buyReasons}>
            <li>One portable formula replaces multiple single-purpose oils.</li>
            <li>Roller application helps keep daily care simple and mess-free.</li>
            <li>Buy 3 and U.S. standard shipping is included.</li>
          </ul>
        </div>
      </section>

      <section className={styles.story}>
        <div>
          <p className={styles.eyebrow}>THE MERI-GOLD-ROUND DIFFERENCE</p>
          <h2>Made for real life, not another crowded shelf.</h2>
          <p>
            A thoughtful blend of jojoba, argan, coconut, castor, sunflower, lavender,
            and tea tree oils in a travel-ready roller. Use only as directed on the label.
          </p>
        </div>
        <div className={styles.storyMedia}>
          <Image src="/images/meri-gold-round/campaign.webp" alt="Meri-Gold-Round botanical oil campaign" fill sizes="(max-width: 800px) 100vw, 48vw" />
        </div>
      </section>

      <section id="ingredients" className={styles.ingredients}>
        <div className={styles.labelMedia}>
          <Image src="/images/meri-gold-round/label.webp" alt="Meri-Gold-Round product label with ingredients and directions" fill sizes="(max-width: 800px) 100vw, 52vw" />
        </div>
        <div>
          <p className={styles.eyebrow}>KNOW WHAT YOU USE</p>
          <h2>Botanical oils, clearly labeled.</h2>
          <p>
            Caprylic/capric triglyceride, jojoba seed oil, argan kernel oil, coconut oil,
            castor seed oil, sunflower seed oil, fragrance, vitamin E, lavender oil,
            and tea tree leaf oil.
          </p>
          <h3>How to use</h3>
          <p>Apply to desired areas and massage gently. Use daily for best results.</p>
          <p className={styles.caution}>
            For external use only. Avoid eye contact. Discontinue use if irritation occurs.
            Keep out of reach of children. Consult a physician if pregnant or under medical care.
          </p>
        </div>
      </section>

      <section className={styles.finalCta}>
        <p className={styles.eyebrow}>NOURISH · REVIVE · RADIATE</p>
        <h2>Make total care one simple roll away.</h2>
        <a className={styles.primary} href="#shop">Shop now</a>
      </section>

      <footer id="care" className={styles.footer}>
        <div><strong>MERI-GOLD-ROUND</strong><span>Curvature Body Sculpting Wellness Company</span></div>
        <div><strong>Customer care</strong><a href="mailto:curvaturebodysculpting@gmail.com">curvaturebodysculpting@gmail.com</a></div>
        <div><strong>Location</strong><span>Indianapolis, Indiana 46220</span></div>
        <p>© {new Date().getFullYear()} Curvature Body Sculpting. Product information is not medical advice.</p>
      </footer>
    </main>
  );
}
