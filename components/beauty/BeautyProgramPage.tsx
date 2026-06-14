'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProgramSchema } from '@/lib/programs/program-schema';
import { motion } from 'framer-motion';

interface BeautyProgramPageProps {
  program: ProgramSchema;
  enrollmentCount?: number;
  campuses?: Campus[];
}

interface Campus {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

interface FAQ {
  question: string;
  answer: string;
}

const DEFAULT_CAMPUSES: Campus[] = [
  { name: 'West Campus', address: '8888 Keystone Crossing', city: 'Indianapolis', state: 'IN', zip: '46240', phone: '(317) 314-3757' },
  { name: 'North Campus', address: '8900 North Meridian', city: 'Carmel', state: 'IN', zip: '46260', phone: '(317) 555-0100' },
  { name: 'East Campus', address: '7500 East Washington', city: 'Indianapolis', state: 'IN', zip: '46219', phone: '(317) 555-0200' },
  { name: 'South Campus', address: '6200 South Meridian', city: 'Greenwood', state: 'IN', zip: '46143', phone: '(317) 555-0300' },
];

export default function BeautyProgramPage({ program, campuses = DEFAULT_CAMPUSES }: BeautyProgramPageProps) {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length), 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const programType = program.slug.includes('barber') ? 'barber' : program.slug.includes('cosmetology') ? 'cosmetology' : program.slug.includes('esthetician') ? 'esthetician' : 'nail';

  const typeLabels: Record<string, string> = { barber: 'Barbering', cosmetology: 'Cosmetology', esthetician: 'Esthetics', nail: 'Nail Technology' };
  const typePlural: Record<string, string> = { barber: 'Barbers', cosmetology: 'Cosmetologists', esthetician: 'Estheticians', nail: 'Nail Technicians' };

  const heroVideoSrc = `/videos/beauty-${programType}.mp4`;

  const testimonials = [
    { name: 'Stefanie Fulford', role: 'Employer Training Partner', location: 'AME Salon & Spa, Wayne PA', quote: "One of the Best Apprenticeship Programs I've seen around, and they make it really easy to onboard new apprentices." },
    { name: 'Marie Weiss', role: 'Employer Training Partner', location: 'Shear Perfection, Everett WA', quote: 'Atarashii is a fantastic comprehensive thorough program ensuring success for all who participate. Highly recommend!' },
    { name: 'Lorinda Cook', role: 'Owner', location: 'Lorindas Salon | Spa | Store, Mill Creek WA', quote: "The team has helped me, my education director, and my salon grow tremendously. Best investment we've made." },
  ];

  const faqs: FAQ[] = [
    { question: 'How long does the apprenticeship take?', answer: 'Our apprenticeship programs typically run 12-18 months depending on the program and your pace. You\'ll complete 2,000 hours of training including on-the-job training and related technical instruction.' },
    { question: 'Do I get paid during the apprenticeship?', answer: 'Yes! One of the biggest advantages of registered apprenticeship is that you earn while you learn. Most apprentices start at entry-level wages and receive increases as they progress through the program.' },
    { question: 'What are the requirements to apply?', answer: 'You\'ll need a high school diploma or GED, be at least 16 years old, and have a genuine interest in the beauty industry. Some programs may have additional requirements.' },
    { question: 'Can I get financial assistance?', answer: 'Yes! We accept WIOA, Workforce Ready Grant, JRI, VA Benefits, and other workforce funding. Our Financial Assistance Navigators will help you explore all available options during onboarding.' },
    { question: 'What happens after I complete the program?', answer: 'After completing your hours and passing the state licensing exam, you\'ll receive your professional license. We also provide career placement support to help you find employment after graduation.' },
  ];

  const programs = [
    { slug: 'barber-apprenticeship', title: 'Barbering Program', desc: 'Launch your career in barbering', image: '/images/beauty/program-barber-training.webp' },
    { slug: 'cosmetology-apprenticeship', title: 'Cosmetology Program', desc: 'Learn professional techniques', image: '/images/beauty/cosmetology.webp' },
    { slug: 'esthetician-apprenticeship', title: 'Esthetics Program', desc: 'Specialize in skin care', image: '/images/beauty/esthetician.webp' },
    { slug: 'nail-technician-apprenticeship', title: 'Nail Technology Program', desc: 'Master nail artistry', image: '/images/beauty/program-beauty-training.webp' },
  ];

  return (
    <div className="beauty-page">
      {/* Sticky Navigation */}
      <nav className={`beauty-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link href="/" className="nav-logo">
            <img src="/images/logo.png" alt="Elevate" />
          </Link>
          <div className="nav-actions">
            <Link href={`/programs/${program.slug}/apply`} className="btn-nav btn-apply">Apply Now</Link>
            <Link href={`/programs/${program.slug}/payment/bnpl`} className="btn-nav btn-pay">Pay Now</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg">
          <video autoPlay muted loop playsInline poster={program.heroImage} className="hero-video">
            <source src={heroVideoSrc} type="video/mp4" />
          </video>
          <div className="hero-gradient" />
        </div>
        <div className="hero-content">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="hero-badge">DOL Registered Apprenticeship</span>
            <h1>{typeLabels[programType]} Program</h1>
            <p className="hero-mission">
              &ldquo;It is the Mission of Elevate to provide our students with a safe, positive learning environment, to successfully prepare them for the state board, and to be professionals in the {typeLabels[programType].toLowerCase()} industry.&rdquo;
            </p>
            <div className="hero-actions">
              <Link href={`/programs/${program.slug}/apply`} className="btn btn-primary btn-lg">Apply Now</Link>
              <Link href={`/programs/${program.slug}/payment/bnpl`} className="btn btn-outline btn-lg">Pay Now</Link>
            </div>
          </motion.div>
        </div>
        <div className="hero-stats-bar">
          <div className="stat-item"><span className="stat-value">{program.durationWeeks}</span><span className="stat-label">Weeks</span></div>
          <div className="stat-item"><span className="stat-value">2,000</span><span className="stat-label">Training Hours</span></div>
          <div className="stat-item"><span className="stat-value">{program.credentials?.length || 3}</span><span className="stat-label">Credentials</span></div>
          <div className="stat-item"><span className="stat-value">{program.selfPayCost || `$${program.tuition || '4,980'}`}</span><span className="stat-label">Total Tuition</span></div>
        </div>
      </section>

      {/* Intro Video Section */}
      <section className="video-section">
        <div className="container">
          <div className="video-header">
            <h2>A successful {typeLabels[programType].toLowerCase()} career starts with a great education!</h2>
            <p>Are you prepared to embark on a quest towards a successful career as a skilled {typePlural[programType].toLowerCase()}? {typeLabels[programType]} services will always be needed, but in order to practice, you&apos;ve got to have a license, and you absolutely have to know how to do a good job.</p>
          </div>
          <div className="video-container">
            <video controls poster={program.heroImage} className="showcase-video">
              <source src={heroVideoSrc} type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      {/* Who We Are */}
      <section className="who-section">
        <div className="container">
          <div className="section-label">Our Vision</div>
          <h2>Who We Are</h2>
          <div className="who-grid">
            <div className="who-text">
              <p>At Elevate, we equip you with the education and hands-on experience to become a talented, professional {typeLabels[programType].toLowerCase()} quickly and in a great environment! Your accomplishments are evidence of the power, fortitude, and magnificence of unleashing your full potential.</p>
              <p>Our faculty is committed to providing you with unwavering support and personalized attention, as they take immense pride in fostering mentoring relationships with students. Within our academic community, each faculty member strives to cultivate the highest levels of professional achievement and excellence.</p>
            </div>
            <div className="who-stats">
              <div className="who-stat"><span className="stat-value">40+</span><span className="stat-label">Years Combined Experience</span></div>
              <div className="who-stat"><span className="stat-value">98%</span><span className="stat-label">License Pass Rate</span></div>
              <div className="who-stat"><span className="stat-value">85%</span><span className="stat-label">Job Placement</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Get Started */}
      <section className="steps-section">
        <div className="container">
          <div className="section-label">Admissions</div>
          <h2>How to Get Started</h2>
          <div className="steps-row">
            <div className="step-item">
              <div className="step-num">01</div>
              <h3>Apply Online</h3>
              <p>Submit your application. Our admissions team will guide you through the process and help you explore funding options.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-num">02</div>
              <h3>Campus Visit</h3>
              <p>Schedule a visit to one of our 4 campus locations. Bring your ID and proof of education (GED or diploma).</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-num">03</div>
              <h3>Get Started</h3>
              <p>Once enrolled, we&apos;ll match you with an approved host salon and begin your apprenticeship journey.</p>
            </div>
          </div>
        </div>
      </section>

      {/* All Programs */}
      <section className="programs-section">
        <div className="container">
          <div className="section-label">Explore Programs</div>
          <h2>Our Beauty Programs</h2>
          <div className="programs-grid">
            {programs.map((p) => (
              <Link key={p.slug} href={`/programs/${p.slug}`} className={`program-card ${p.slug === program.slug ? 'active' : ''}`}>
                <div className="program-img" style={{ backgroundImage: `url(${p.image})` }} />
                <div className="program-info">
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                  {p.slug === program.slug && <span className="current-badge">Current Program</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Earn While You Learn */}
      <section className="earn-section">
        <div className="container">
          <div className="section-label">How It Works</div>
          <h2>Earn While You Learn</h2>
          <div className="phases-grid">
            <div className="phase-card"><div className="phase-num">01</div><h3>Apply & Enroll</h3><p>Submit your application online. Once accepted, we&apos;ll match you with an approved host salon and begin your journey.</p></div>
            <div className="phase-card"><div className="phase-num">02</div><h3>On-the-Job Training</h3><p>Work in a licensed salon under supervision. Perform real services on live clients while earning a competitive wage.</p></div>
            <div className="phase-card"><div className="phase-num">03</div><h3>Classroom Instruction</h3><p>Complete your required Related Technical Instruction (RTI) hours with our structured curriculum.</p></div>
            <div className="phase-card"><div className="phase-num">04</div><h3>Get Licensed</h3><p>Pass your state licensing exam and launch your career with our placement support.</p></div>
          </div>
        </div>
      </section>

      {/* Campuses */}
      <section className="campuses-section">
        <div className="container">
          <div className="section-label">Locations</div>
          <h2>Our Campuses</h2>
          <p className="section-subtitle">Serving Indiana with 4 convenient locations</p>
          <div className="campuses-grid">
            {campuses.map((c, i) => (
              <div key={i} className="campus-card">
                <h4>{c.name}</h4>
                <p className="campus-addr">{c.address}<br />{c.city}, {c.state} {c.zip}</p>
                <a href={`tel:${c.phone.replace(/\D/g, '')}`} className="campus-phone">{c.phone}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Financial Aid */}
      <section className="financial-section">
        <div className="container">
          <div className="section-label">Financial Aid</div>
          <h2>Start Your FAFSA</h2>
          <p className="section-subtitle">Financial aid is distributed on a first-come, first-served basis.</p>
          <div className="financial-grid">
            <div className="financial-info">
              <p>We understand that investing in an apprenticeship program is a significant commitment — and we&apos;re here to help you explore every available option.</p>
              <div className="funding-grid">
                <div className="funding-item"><span className="funding-badge">WIOA</span><span>Workforce Innovation & Opportunity Act</span></div>
                <div className="funding-item"><span className="funding-badge">WRG</span><span>Workforce Ready Grant</span></div>
                <div className="funding-item"><span className="funding-badge">JRI</span><span>Job Ready Indy</span></div>
                <div className="funding-item"><span className="funding-badge">VA</span><span>GI Bill / VA Benefits</span></div>
              </div>
            </div>
            <div className="payment-card">
              <h4>Self-Pay Options</h4>
              <div className="payment-amount">
                <span className="amount-label">Total Tuition</span>
                <span className="amount-value">{program.selfPayCost || `$${program.tuition || '4,980'}`}</span>
              </div>
              <p className="payment-note">BNPL starts with a deposit.<br />No minimum required.</p>
              <p className="payment-note">Pay over 29 weekly installments.</p>
              <Link href={`/programs/${program.slug}/payment/bnpl`} className="btn btn-primary btn-block">View Payment Plan →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="credentials-section">
        <div className="container">
          <div className="section-label">Credentials</div>
          <h2>Licenses & Certifications</h2>
          <div className="credentials-grid">
            {program.credentials?.map((cred, i) => (
              <div key={i} className="credential-card">
                <div className="cred-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                </div>
                <h3>{cred.name}</h3>
                <span className="cred-issuer">{cred.issuer}</span>
                <p className="cred-desc">{cred.description}</p>
                <span className="cred-valid">Valid: {cred.validity}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <div className="container">
          <div className="section-label">FAQ</div>
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.question}</span>
                  <span className="faq-icon">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && <div className="faq-answer"><p>{faq.answer}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-label">Success Stories</div>
          <h2>What Our Partners Say</h2>
          <div className="testimonial-carousel">
            <div className="testimonial-card">
              <blockquote>&ldquo;{testimonials[activeTestimonial].quote}&rdquo;</blockquote>
              <div className="testimonial-author">
                <div className="author-avatar">{testimonials[activeTestimonial].name.charAt(0)}</div>
                <div className="author-info">
                  <span className="author-name">{testimonials[activeTestimonial].name}</span>
                  <span className="author-role">{testimonials[activeTestimonial].role}</span>
                  <span className="author-loc">{testimonials[activeTestimonial].location}</span>
                </div>
              </div>
            </div>
            <div className="testimonial-dots">
              {testimonials.map((_, i) => (
                <button key={i} className={`dot ${i === activeTestimonial ? 'active' : ''}`} onClick={() => setActiveTestimonial(i)} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Start Your {typeLabels[programType]} Career?</h2>
          <p>Join our next cohort and earn while you learn.</p>
          <div className="cta-actions">
            <Link href={`/programs/${program.slug}/apply`} className="btn btn-white btn-lg">Apply Now</Link>
            <Link href={`/programs/${program.slug}/payment/bnpl`} className="btn btn-outline-white btn-lg">Pay Now</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="beauty-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <img src="/images/logo.png" alt="Elevate" className="footer-logo" />
              <p>Elevate for Humanity Career & Technical Institute</p>
            </div>
            <div className="footer-contact">
              <p>8888 Keystone Crossing, Suite 1300<br />Indianapolis, IN 46240<br />(317) 314-3757</p>
            </div>
            <div className="footer-links">
              <Link href="/about">About</Link>
              <Link href="/admissions">Admissions</Link>
              <Link href="/programs">Programs</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>
          <div className="footer-copy">© {new Date().getFullYear()} Elevate for Humanity Career & Technical Institute. All rights reserved.</div>
        </div>
      </footer>

      <style jsx>{`
        .beauty-page { --primary: #0f172a; --accent: #dc2626; --gold: #d4af37; --light: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .section-label { display: inline-block; padding: 6px 16px; background: var(--accent); color: white; border-radius: 50px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
        .section-subtitle { color: #64748b; font-size: 1.1rem; margin-top: -8px; margin-bottom: 40px; }

        /* Navigation */
        .beauty-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 20px 0; transition: all 0.3s; }
        .beauty-nav.scrolled { background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(20px); padding: 12px 0; box-shadow: 0 4px 30px rgba(0,0,0,0.3); }
        .nav-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; }
        .nav-logo img { height: 40px; }
        .nav-actions { display: flex; gap: 12px; }
        .btn-nav { padding: 10px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; transition: all 0.3s; }
        .btn-apply { background: var(--accent); color: white; }
        .btn-apply:hover { background: #b91c1c; transform: translateY(-2px); }
        .btn-pay { border: 2px solid white; color: white; }
        .btn-pay:hover { background: white; color: var(--primary); }

        /* Hero */
        .hero-section { position: relative; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
        .hero-bg { position: absolute; inset: 0; }
        .hero-video { width: 100%; height: 100%; object-fit: cover; }
        .hero-gradient { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(15, 23, 42, 0.97) 0%, rgba(15, 23, 42, 0.85) 100%); }
        .hero-content { position: relative; z-index: 1; padding: 120px 24px 60px; max-width: 900px; margin: 0 auto; text-align: center; }
        .hero-badge { display: inline-block; padding: 8px 20px; background: rgba(220, 38, 38, 0.2); border: 1px solid var(--accent); border-radius: 50px; color: var(--accent); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 24px; }
        .hero-content h1 { font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 800; color: white; margin-bottom: 20px; line-height: 1.1; }
        .hero-mission { font-size: 1.25rem; color: rgba(255,255,255,0.85); font-style: italic; margin-bottom: 40px; max-width: 700px; margin-left: auto; margin-right: auto; line-height: 1.7; }
        .hero-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .hero-stats-bar { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; background: white; max-width: 900px; margin: 0 auto; border-radius: 16px 16px 0 0; overflow: hidden; box-shadow: 0 -20px 60px rgba(0,0,0,0.3); }
        .stat-item { text-align: center; padding: 32px 16px; border-right: 1px solid #e2e8f0; }
        .stat-item:last-child { border-right: none; }
        .stat-value { display: block; font-size: 2rem; font-weight: 700; color: var(--primary); }
        .stat-label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }

        /* Buttons */
        .btn { display: inline-flex; align-items: center; justify-content: center; padding: 14px 32px; border-radius: 10px; font-weight: 600; text-decoration: none; transition: all 0.3s; cursor: pointer; border: none; }
        .btn-primary { background: var(--accent); color: white; }
        .btn-primary:hover { background: #b91c1c; transform: translateY(-2px); box-shadow: 0 10px 30px rgba(220,38,38,0.3); }
        .btn-outline { background: transparent; border: 2px solid var(--accent); color: var(--accent); }
        .btn-outline:hover { background: var(--accent); color: white; }
        .btn-lg { padding: 18px 48px; font-size: 1.1rem; }
        .btn-block { width: 100%; }
        .btn-white { background: white; color: var(--primary); }
        .btn-white:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .btn-outline-white { background: transparent; border: 2px solid white; color: white; }
        .btn-outline-white:hover { background: white; color: var(--primary); }

        /* Sections */
        section { padding: 100px 0; }
        h2 { font-size: 2.5rem; font-weight: 700; color: var(--primary); margin-bottom: 40px; text-align: center; }

        /* Video Section */
        .video-section { background: var(--light); }
        .video-header { text-align: center; max-width: 800px; margin: 0 auto 40px; }
        .video-header h2 { margin-bottom: 16px; }
        .video-header p { font-size: 1.1rem; color: #64748b; line-height: 1.7; }
        .video-container { max-width: 900px; margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
        .showcase-video { width: 100%; display: block; }

        /* Who Section */
        .who-section { background: white; }
        .who-section h2 { text-align: left; margin-bottom: 24px; }
        .who-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 60px; align-items: center; }
        .who-text p { font-size: 1.1rem; line-height: 1.8; color: #334155; margin-bottom: 20px; }
        .who-stats { display: flex; flex-direction: column; gap: 16px; }
        .who-stat { padding: 24px; background: linear-gradient(135deg, var(--primary), #1e3a5f); border-radius: 12px; text-align: center; }
        .who-stat .stat-value { color: var(--gold); font-size: 2.5rem; }
        .who-stat .stat-label { color: rgba(255,255,255,0.8); font-size: 0.85rem; text-transform: uppercase; }

        /* Steps Section */
        .steps-section { background: var(--light); }
        .steps-row { display: flex; align-items: center; justify-content: center; gap: 24px; flex-wrap: wrap; }
        .step-item { background: white; padding: 40px; border-radius: 16px; text-align: center; flex: 1; min-width: 280px; max-width: 350px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .step-num { width: 60px; height: 60px; background: linear-gradient(135deg, var(--accent), #f87171); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; margin: 0 auto 20px; }
        .step-item h3 { font-size: 1.25rem; color: var(--primary); margin-bottom: 12px; }
        .step-item p { font-size: 0.95rem; color: #64748b; line-height: 1.6; }
        .step-arrow { font-size: 2rem; color: var(--accent); font-weight: 300; }

        /* Programs Section */
        .programs-section { background: white; }
        .programs-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .program-card { background: white; border-radius: 16px; overflow: hidden; text-decoration: none; transition: all 0.3s; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .program-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
        .program-card.active { border: 3px solid var(--accent); }
        .program-img { height: 160px; background-size: cover; background-position: center; }
        .program-info { padding: 24px; }
        .program-info h3 { font-size: 1.1rem; color: var(--primary); margin-bottom: 8px; }
        .program-info p { font-size: 0.9rem; color: #64748b; margin-bottom: 12px; }
        .current-badge { display: inline-block; padding: 4px 12px; background: var(--accent); color: white; border-radius: 50px; font-size: 0.75rem; font-weight: 600; }

        /* Earn Section */
        .earn-section { background: linear-gradient(135deg, var(--primary), #1e3a5f); color: white; }
        .earn-section h2 { color: white; }
        .earn-section .section-label { background: var(--gold); }
        .phases-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .phase-card { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 32px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); }
        .phase-num { width: 48px; height: 48px; background: var(--accent); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 700; margin-bottom: 16px; }
        .phase-card h3 { font-size: 1.1rem; margin-bottom: 12px; color: white; }
        .phase-card p { font-size: 0.9rem; color: rgba(255,255,255,0.8); line-height: 1.6; }

        /* Campuses */
        .campuses-section { background: var(--light); }
        .campuses-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .campus-card { background: white; padding: 32px; border-radius: 16px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .campus-card h4 { font-size: 1.1rem; color: var(--primary); margin-bottom: 12px; }
        .campus-addr { font-size: 0.9rem; color: #64748b; line-height: 1.6; margin-bottom: 12px; }
        .campus-phone { color: var(--accent); font-weight: 600; text-decoration: none; }
        .campus-phone:hover { text-decoration: underline; }

        /* Financial */
        .financial-section { background: white; }
        .financial-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 60px; align-items: start; }
        .financial-info p { font-size: 1.05rem; color: #334155; line-height: 1.7; margin-bottom: 24px; }
        .funding-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .funding-item { display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--light); border-radius: 8px; }
        .funding-badge { padding: 6px 12px; background: var(--primary); color: white; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
        .funding-item span:last-child { font-size: 0.9rem; color: #334155; }
        .payment-card { background: var(--light); padding: 32px; border-radius: 16px; }
        .payment-card h4 { font-size: 1.25rem; color: var(--primary); margin-bottom: 24px; }
        .payment-amount { text-align: center; padding: 24px; background: white; border-radius: 12px; margin-bottom: 16px; }
        .amount-label { display: block; font-size: 0.9rem; color: #64748b; margin-bottom: 8px; }
        .amount-value { font-size: 3rem; font-weight: 700; color: var(--accent); }
        .payment-note { font-size: 0.9rem; color: #64748b; text-align: center; margin-bottom: 8px; }

        /* Credentials */
        .credentials-section { background: var(--light); }
        .credentials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .credential-card { background: white; padding: 40px; border-radius: 16px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .cred-icon { width: 64px; height: 64px; background: linear-gradient(135deg, var(--accent), #f87171); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: white; }
        .cred-icon svg { width: 32px; height: 32px; }
        .credential-card h3 { font-size: 1.1rem; color: var(--primary); margin-bottom: 8px; }
        .cred-issuer { display: block; font-size: 0.85rem; color: var(--accent); font-weight: 600; margin-bottom: 12px; }
        .cred-desc { font-size: 0.9rem; color: #64748b; line-height: 1.6; margin-bottom: 16px; }
        .cred-valid { font-size: 0.8rem; color: #94a3b8; }

        /* FAQ */
        .faq-section { background: white; }
        .faq-list { max-width: 800px; margin: 0 auto; }
        .faq-item { border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
        .faq-question { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; background: none; border: none; cursor: pointer; font-size: 1.05rem; font-weight: 600; color: var(--primary); text-align: left; }
        .faq-icon { font-size: 1.5rem; color: var(--accent); transition: transform 0.3s; }
        .faq-item.open .faq-icon { transform: rotate(180deg); }
        .faq-answer { padding: 0 24px 20px; }
        .faq-answer p { font-size: 1rem; color: #64748b; line-height: 1.7; }

        /* Testimonials */
        .testimonials-section { background: linear-gradient(135deg, #f8fafc, #e2e8f0); }
        .testimonial-carousel { max-width: 700px; margin: 0 auto; }
        .testimonial-card { background: white; padding: 48px; border-radius: 16px; text-align: center; box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
        .testimonial-card blockquote { font-size: 1.4rem; font-style: italic; color: var(--primary); line-height: 1.6; margin-bottom: 32px; }
        .testimonial-author { display: flex; align-items: center; justify-content: center; gap: 16px; }
        .author-avatar { width: 56px; height: 56px; background: linear-gradient(135deg, var(--accent), #f87171); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: 700; }
        .author-info { text-align: left; }
        .author-name { display: block; font-weight: 600; color: var(--primary); }
        .author-role { display: block; font-size: 0.9rem; color: #64748b; }
        .author-loc { display: block; font-size: 0.85rem; color: #94a3b8; }
        .testimonial-dots { display: flex; justify-content: center; gap: 8px; margin-top: 24px; }
        .dot { width: 12px; height: 12px; border-radius: 50%; border: none; background: #cbd5e1; cursor: pointer; transition: all 0.3s; }
        .dot.active { background: var(--accent); transform: scale(1.3); }

        /* CTA */
        .cta-section { background: linear-gradient(135deg, var(--accent), #f87171); color: white; text-align: center; }
        .cta-section h2 { color: white; font-size: 2.5rem; }
        .cta-section p { font-size: 1.25rem; opacity: 0.9; margin-bottom: 32px; }
        .cta-actions { display: flex; gap: 16px; justify-content: center; }

        /* Footer */
        .beauty-footer { background: var(--primary); color: white; padding: 60px 0 30px; }
        .footer-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 40px; margin-bottom: 40px; }
        .footer-logo { height: 40px; margin-bottom: 16px; }
        .footer-brand p { color: rgba(255,255,255,0.7); font-size: 0.9rem; }
        .footer-contact p { color: rgba(255,255,255,0.7); font-size: 0.9rem; line-height: 1.6; }
        .footer-links { display: flex; flex-direction: column; gap: 12px; }
        .footer-links a { color: rgba(255,255,255,0.8); text-decoration: none; transition: color 0.3s; }
        .footer-links a:hover { color: var(--gold); }
        .footer-copy { text-align: center; color: rgba(255,255,255,0.5); font-size: 0.85rem; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); }

        /* Responsive */
        @media (max-width: 1024px) {
          .who-grid, .financial-grid { grid-template-columns: 1fr; }
          .programs-grid, .campuses-grid, .phases-grid, .credentials-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .hero-stats-bar { grid-template-columns: repeat(2, 1fr); }
          .programs-grid, .campuses-grid, .phases-grid, .credentials-grid, .steps-row { grid-template-columns: 1fr; }
          .funding-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; text-align: center; }
          .cta-actions, .hero-actions { flex-direction: column; }
          h2 { font-size: 2rem; }
        }
      `}</style>
    </div>
  );
}