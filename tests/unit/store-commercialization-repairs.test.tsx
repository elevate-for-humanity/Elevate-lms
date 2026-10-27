import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import CapabilitySubscriptionDemo from '@/components/store/CapabilitySubscriptionDemo';
import { capabilityWalkthrough } from '@/lib/store/capability-walkthroughs';
import { CAPABILITY_CATALOG } from '@/lib/platform/capability-catalog';
afterEach(cleanup);
describe('commercial product walkthroughs', () => {
  it('provides navigable workflow examples, pauses on selection and labels sample states', () => {
    render(<CapabilitySubscriptionDemo capabilityKey="sam_gov_manager" name="SAM.gov Manager" description="Entity preparation" categoryLabel="Business Apps" priceLabel="$49/mo" subscriptionDetails={[]} actionHref="/store/apps/sam-gov" trialText="Try a workspace" />);
    expect(screen.getByRole('button', { name: 'Play demo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Create an entity record' })).toBeInTheDocument();
    expect(screen.getByLabelText('Illustrative workflow record')).toHaveTextContent('not a live transaction');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'Organize documents' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/Complete official registration/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByRole('heading', { name: 'Organize documents' })).toBeInTheDocument();
  });
  for (const capability of CAPABILITY_CATALOG.filter((row) => row.status !== 'internal')) {
    it(`explains inputs and results for ${capability.key}`, () => {
      const slides = capabilityWalkthrough(capability.key, capability.name);
      expect(slides).toHaveLength(3);
      for (const slide of slides) {
        expect(slide.title.length).toBeGreaterThan(5);
        expect(slide.action.length).toBeGreaterThan(20);
        expect(slide.result.length).toBeGreaterThan(8);
      }
    });
  }
});
