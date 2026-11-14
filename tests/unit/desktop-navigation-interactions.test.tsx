import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import HeaderDesktopNav from '@/components/site/HeaderDesktopNav';
import { NAV_ITEMS } from '@/lib/navigation';
vi.mock('next/link', () => ({ default: ({ children, prefetch, ...props }: any) => <a {...props} onClick={event => { event.preventDefault(); props.onClick?.(event); }}>{children}</a> }));
afterEach(cleanup);

describe('desktop navigation actions', () => {
  it('opens each submenu by click and closes it by Escape', () => {
    render(<HeaderDesktopNav items={NAV_ITEMS} />);
    for (const item of NAV_ITEMS.filter(item => item.subItems?.length)) {
      const trigger = screen.getByRole('button', { name: `${item.name} menu` });
      fireEvent.click(trigger);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      const panel = document.getElementById(trigger.getAttribute('aria-controls')!)!;
      expect(panel.hidden).toBe(false);
      for (const sub of item.subItems!.filter(sub => sub.href)) expect(panel.querySelector(`a[href="${sub.href}"]`)).not.toBeNull();
      fireEvent.keyDown(trigger, { key: 'Escape' });
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(panel.hidden).toBe(true);
      expect(document.activeElement).toBe(trigger);
    }
  });
  it('closes after selecting a destination and after focus leaves the group', () => {
    render(<HeaderDesktopNav items={NAV_ITEMS} />);
    const trigger = screen.getByRole('button', { name: 'About menu' });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('link', { name: 'Our Team & Staff' }));
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(trigger);
    fireEvent.blur(trigger, { relatedTarget: document.body });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
  it('opens on hover and closes when the pointer leaves the group', () => {
    render(<HeaderDesktopNav items={NAV_ITEMS} />);
    const trigger = screen.getByRole('button', { name: 'About menu' });
    const group = trigger.parentElement!.parentElement!;
    fireEvent.mouseEnter(group);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.mouseEnter(group);
    fireEvent.mouseLeave(group);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});
