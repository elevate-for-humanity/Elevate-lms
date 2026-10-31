// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { HomeProgramShowcase } from '@/components/home/HomeProgramShowcase';

afterEach(cleanup);

describe('program showcase interaction readiness', () => {
  it('does not advertise working selection controls before hydration', () => {
    const html = renderToString(<HomeProgramShowcase />);
    const document = new DOMParser().parseFromString(html, 'text/html');
    const controls = document.querySelectorAll('[aria-label="Featured programs"] button');
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) expect(control.hasAttribute('disabled')).toBe(true);
  });

  it('updates the heading and destination on the first ready activation', () => {
    render(<HomeProgramShowcase />);
    const control = screen.getByRole('button', { name: 'Show Certified Nursing Assistant', exact: true });
    expect(control.hasAttribute('disabled')).toBe(false);
    fireEvent.click(control);
    expect(screen.getByRole('heading', { name: 'Certified Nursing Assistant', exact: true })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Program details →' }).getAttribute('href')).toBe('/programs/cna');
    expect(control.getAttribute('aria-current')).toBe('true');
  });
});
