import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import saved from '../fixtures/legacy83-saved-config.json';
import { restoreLegacy83ApprovedReference } from '../../scripts/restore-legacy83-approved-reference.mjs';
import { refineLegacy83ClientReview } from '../../scripts/refine-legacy83-client-review.mjs';
import { PublicTenantComposableSite } from '@/components/tenant/PublicTenantComposableSite';
import { TenantIntroduction } from '@/components/tenant/TenantIntroduction';
import { legacy83ReviewSlides } from '@/lib/tenant/legacy83-review-slides';

const { play, stop } = vi.hoisted(() => ({ play: vi.fn(), stop: vi.fn() }));
vi.mock('@/components/voice/useNaturalVoice', () => ({ useNaturalVoice: () => ({play,stop,isLoading:false,isPlaying:false,error:null}) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const original = restoreLegacy83ApprovedReference(saved);

it('preserves the project, backend and protected interactions while giving all nine heroes distinct images', () => {
  const config=refineLegacy83ClientReview(original);
  expect(config.pages.map(p=>[p.id,p.slug])).toEqual(original.pages.map(p=>[p.id,p.slug]));
  expect(config.meta.externalBackend).toEqual(original.meta.externalBackend);
  expect(config.meta.billingState).toEqual(original.meta.billingState);
  const heroes=config.pages.map(p=>p.sections.find(s=>s.type==='hero'));
  expect(new Set(heroes.map(s=>s.content.image)).size).toBe(9);
  expect(heroes.every(s=>s.content.imageAlt)).toBe(true);
  for (const p of original.pages) for (const s of p.sections.filter(s=>['assessment','contact_form','events'].includes(s.type))) expect(config.pages.find(next=>next.slug===p.slug).sections.find(next=>next.id===s.id)).toEqual(s);
  expect(refineLegacy83ClientReview(config)).toEqual(config);
  expect(original).toEqual(restoreLegacy83ApprovedReference(saved));
  expect(config.meta.clientReview.calendarStatus).toBe('awaiting_client_google_calendar');
  expect(config.pages.find(p=>p.slug==='/contact').sections.find(s=>s.type==='booking').content.url).toBe('tel:+15133351978');
});

it('restores the full founder photograph, honors veterans, and puts photographs behind the lower call-to-action panels', () => {
  const config=refineLegacy83ClientReview(original);
  const {container}=render(<PublicTenantComposableSite site={{id:'existing',subdomain:'legacy83-preview',siteName:'Legacy 83',organizationId:null,config}} />);
  const founder=screen.getByAltText('Icy Williams, founder of Legacy 83 Business');
  expect(founder).toHaveAttribute('src','/images/legacy83/icy-williams-full-portrait.webp');
  expect(founder).not.toHaveStyle({maskImage:'url("/images/legacy83/founder-mask.webp")'});
  expect(screen.getByText('Honoring veterans and the legacies they build.')).toBeVisible();
  expect(container.querySelectorAll('.tenant-cta-background')).toHaveLength(2);
  expect(play).not.toHaveBeenCalled();
  expect(container.querySelector('audio')).toBeNull();
});

it('plays the approved spoken introduction only on request and leaves music off without a selected track', () => {
  const {container}=render(<TenantIntroduction narration="Legacy is lasting value." musicUrl="https://unapproved.example/song.mp3" />);
  expect(play).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Listen to the introduction'}));
  expect(play).toHaveBeenCalledWith('Legacy is lasting value.',{style:'assistant',voice:'coral'});
  expect(container.querySelector('audio')).toBeNull();
  expect(screen.getByText('Read the introduction')).toBeVisible();
});

it('explains the actual nine pages in the PARIS review, including calendar and course limitations', () => {
  expect(new Set(legacy83ReviewSlides.map(s=>s.slug))).toEqual(new Set(original.pages.map(p=>p.slug)));
  expect(legacy83ReviewSlides.every(s=>s.narration.length>150)).toBe(true);
  expect(legacy83ReviewSlides.find(s=>s.slug==='/academy').narration).toContain('remain drafts');
  expect(legacy83ReviewSlides.find(s=>s.slug==='/contact').narration).toContain('awaiting');
});
