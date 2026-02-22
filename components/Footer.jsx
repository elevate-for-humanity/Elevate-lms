import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Elevate for Humanity</h3>
          <p>Empowering communities through technology and innovation</p>
        </div>
        <div className="footer-section">
          <h4>Programs</h4>
          <Link href="/programs/barber-apprenticeship">Barber Apprenticeship</Link>
          <Link href="/funding">Funding Options</Link>
          <Link href="/apply">Apply Now</Link>
        </div>
        <div className="footer-section">
          <h4>About</h4>
          <Link href="/team">Team & Leadership</Link>
          <Link href="/accreditation">Accreditation</Link>
          <Link href="/advising">Talk to an Advisor</Link>
          <Link href="/support">Support Services</Link>
        </div>
        <div className="footer-section">
          <h4>Connect</h4>
          <a
            href="https://www.facebook.com/elevateforhumanity"
            target="_blank"
            rel="noopener noreferrer"
          >
            Facebook
          </a>
          <a
            href="https://www.linkedin.com/company/elevate-for-humanity"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
          <a
            href="https://www.youtube.com/@elevateforhumanity"
            target="_blank"
            rel="noopener noreferrer"
          >
            YouTube
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>
          &copy; {new Date().getFullYear()} Elevate for Humanity. All rights
          reserved.
        </p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
          Elevate for Humanity is an equal opportunity provider. We do not discriminate on the basis of race, color, national origin, sex, disability, or age in our programs, activities, or employment.
        </p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
          Contact: <a href="/support" style={{ color: 'inherit', textDecoration: 'underline' }}>support center</a> | <a href="mailto:info@elevateforhumanity.org" style={{ color: 'inherit', textDecoration: 'underline' }}>info@elevateforhumanity.org</a> | <a href="tel:317-314-3757" style={{ color: 'inherit', textDecoration: 'underline' }}>(317) 314-3757</a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
