import { siteUrls } from '@/lib/utils/site-urls';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
vi.mock('next/link', () => ({ default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));
import TuitionRefundPolicyNotice, {
  TUITION_REFUND_RULES,
} from '@/components/apprenticeship/TuitionRefundPolicyNotice';

afterEach(cleanup);

function renderedHtml() {
  const { container } = render(<TuitionRefundPolicyNotice />);
  return container.innerHTML;
}

it('states the enrollment-agreement refund tiers exactly, including the after-week-one no-refund rule', () => {
  const html = renderedHtml();
  for (const rule of TUITION_REFUND_RULES) {
    expect(html).toContain(`${rule.label}:`);
    expect(html).toContain(rule.text);
  }
  expect(html).toContain('After week one: No refund.');
  expect(html).toContain(
    'Students who withdraw after week one remain responsible for the full tuition balance.',
  );
  expect(html).toContain(
    'Funding agency refund requirements supersede this policy where applicable.',
  );
});

it('does not state a blanket non-refundable rule that would contradict the agreement', () => {
  const html = renderedHtml();
  // The agreement refunds tuition before program start and 75% within the
  // first week, so the notice must keep those tiers visible alongside the
  // after-week-one no-refund rule.
  expect(html).toContain('Before program start:');
  expect(html).toContain('Full refund of tuition paid, minus a $50 administrative fee');
  expect(html).toContain('Within the first week:');
  expect(html).toContain('75% refund of tuition');
  expect(html).not.toMatch(/Tuition payments are non-refundable\./);
});

it('links to the full refund policy and is labelled as a policy notice', () => {
  render(<TuitionRefundPolicyNotice />);
  expect(screen.getByRole('link', { name: 'Read the full refund policy' })).toHaveAttribute(
    'href',
    `${siteUrls.site}/refund-policy`,
  );
  expect(screen.getByRole('region', { name: 'Tuition refund policy' })).toBeTruthy();
});
