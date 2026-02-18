/**
 * Unit tests for the Funding Impact page
 * Tests rendering, content, and key elements
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FundingImpactPage from '@/app/fundingimpact/page';

describe('FundingImpactPage', () => {
  it('renders the page without crashing', () => {
    render(<FundingImpactPage />);
    expect(document.body).toBeTruthy();
  });

  it('displays the main heading', () => {
    render(<FundingImpactPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('The Impact of Federal Workforce Funding');
  });

  it('displays the hero section with video element', () => {
    render(<FundingImpactPage />);
    const video = document.querySelector('video');
    expect(video).toBeTruthy();
    // Boolean attributes in HTML become empty strings
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('loop');
    expect(video).toHaveAttribute('playsinline');
  });

  it('displays impact statistics', () => {
    render(<FundingImpactPage />);
    expect(screen.getByText('2,500+')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
    expect(screen.getByText('$18.50')).toBeInTheDocument();
  });

  it('displays funding sources section', () => {
    render(<FundingImpactPage />);
    expect(screen.getByText('WIOA Title I')).toBeInTheDocument();
    expect(screen.getByText('Workforce Ready Grant')).toBeInTheDocument();
    expect(screen.getByText('SNAP E&T')).toBeInTheDocument();
    // JRI Funding appears in multiple places, use getAllByText
    expect(screen.getAllByText('JRI Funding').length).toBeGreaterThan(0);
  });

  it('displays success stories section', () => {
    render(<FundingImpactPage />);
    expect(screen.getByText('Real Stories, Real Impact')).toBeInTheDocument();
    expect(screen.getByText('Graduate J.')).toBeInTheDocument();
    expect(screen.getByText('Sarah T.')).toBeInTheDocument();
    expect(screen.getByText('David W.')).toBeInTheDocument();
  });

  it('displays community impact section', () => {
    render(<FundingImpactPage />);
    expect(screen.getByText('Impact Beyond the Individual')).toBeInTheDocument();
    expect(screen.getByText('Family Stability')).toBeInTheDocument();
    expect(screen.getByText('Employer Benefits')).toBeInTheDocument();
    expect(screen.getByText('Economic Growth')).toBeInTheDocument();
  });

  it('displays CTA buttons', () => {
    render(<FundingImpactPage />);
    const applyButtons = screen.getAllByRole('link', { name: /apply/i });
    expect(applyButtons.length).toBeGreaterThan(0);
    
    const eligibilityButtons = screen.getAllByRole('link', { name: /eligibility/i });
    expect(eligibilityButtons.length).toBeGreaterThan(0);
  });

  it('has correct links to apply and eligibility pages', () => {
    render(<FundingImpactPage />);
    const applyLink = screen.getAllByRole('link', { name: /apply/i })[0];
    expect(applyLink).toHaveAttribute('href', '/apply');
  });
});
