import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import WorkOnePartnerPacketPage from '@/apps/marketing/app/workone-partner-packet/page';

describe('WorkOnePartnerPacketPage', () => {
  it('renders the canonical workforce partner heading and disclosure', () => {
    render(<WorkOnePartnerPacketPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('WorkOne Partner Packet');
    expect(screen.getByText(/provider approval does not mean that every Elevate program/i)).toBeInTheDocument();
  });

  it('explains the evidence and authorization controls', () => {
    render(<WorkOnePartnerPacketPage />);
    expect(screen.getByText('Provider and program are separate records')).toBeInTheDocument();
    expect(screen.getByText('Written authorization controls funded enrollment')).toBeInTheDocument();
    expect(screen.getByText('Claims are registry-controlled')).toBeInTheDocument();
  });

  it('renders only verified workforce-funded program records', () => {
    render(<WorkOnePartnerPacketPage />);
    expect(screen.getByRole('heading', { name: 'Verified workforce-funded program records' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'CDL Training' })).toBeInTheDocument();
    expect(screen.getByText('Indiana ETPL')).toBeInTheDocument();
    expect(screen.getByText('Workforce Ready Grant')).toBeInTheDocument();
    expect(screen.queryByText('WIOA Title I (Adult)')).not.toBeInTheDocument();
  });

  it('keeps participant authorization explicit', () => {
    render(<WorkOnePartnerPacketPage />);
    expect(screen.getByRole('heading', { name: 'Referral control' })).toBeInTheDocument();
    expect(screen.getByText(/written funding authorization can be verified before enrollment/i)).toBeInTheDocument();
  });

  it('links to participant application and contact', () => {
    render(<WorkOnePartnerPacketPage />);
    expect(screen.getByRole('link', { name: 'Participant Application' })).toHaveAttribute('href', '/apply');
    expect(screen.getByRole('link', { name: 'Contact Elevate' })).toHaveAttribute('href', '/contact');
  });

  it('does not regress to unapproved all-program funding claims', () => {
    render(<WorkOnePartnerPacketPage />);
    expect(screen.queryByText('ETPL-Approved Programs')).not.toBeInTheDocument();
    expect(screen.queryByText('Funding & Billing')).not.toBeInTheDocument();
    expect(screen.queryByText('WIOA | WRG Eligible')).not.toBeInTheDocument();
  });
});
