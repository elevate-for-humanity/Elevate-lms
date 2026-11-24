import { describe, expect, it } from 'vitest';
import { websiteLifecycleIntent } from '@/lib/website-builder/lifecycle-intent';

describe('explicit website lifecycle commands', () => {
  it.each(['publish', 'Publish the website.', 'please go live', 'publish updates now', 'make it live please'])('recognizes %s', command => {
    expect(websiteLifecycleIntent(command)).toBe('publish');
  });
  it.each(['unpublish', 'take the site offline', 'please make it private', 'unpublish the website now'])('recognizes %s', command => {
    expect(websiteLifecycleIntent(command)).toBe('unpublish');
  });
  it.each(["don't publish", 'do not publish it', 'how do I publish?', 'can you explain unpublish?', 'add a publish button', 'publish after I review it', 'unpublish and delete it'])('does not change publication for %s', command => {
    expect(websiteLifecycleIntent(command)).toBeNull();
  });
});
