import { expect, it } from 'vitest';
import { getNavigationForRole } from '@/lib/navigation/navigation-config';

it.each(['student', 'learner', 'apprentice', 'barber_apprentice', 'cosmetology_apprentice'] as const)(
  'makes Job Ready directly available in the learning menu for %s',
  (role) => {
    const sections = getNavigationForRole(role);
    const links = sections.flatMap(section => section.items).filter(item => item.id === 'job-ready');
    expect(links).toHaveLength(1);
    expect(new URL(links[0].href, 'https://app.elevateforhumanity.org').pathname).toBe('/lms/career/job-ready');
    expect(sections.find(section => section.id === 'learning')?.items).toContainEqual(links[0]);
  },
);
