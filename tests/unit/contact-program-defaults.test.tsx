import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ContactPage from '@/apps/marketing/app/contact/page';
import { getStaticProgram } from '@/data/programs/index';
import { COURSE_BUILDER_REQUESTS } from '@/lib/course-builder/offer';

type ContactParams = Record<string, string | string[] | undefined>;

afterEach(cleanup);

async function renderContact(params: ContactParams = {}) {
  render(await ContactPage({ searchParams: Promise.resolve(params) }));
  const subject = screen.getByRole('combobox', { name: 'How Can We Help?' });
  const message = screen.getByRole('textbox', { name: 'Your Message' });
  const form = message.closest('form')!;
  expect(form).toHaveAttribute('action', '/api/contact');
  expect(form).toHaveAttribute('method', 'post');
  return { subject, message, formData: new FormData(form) };
}

describe('contact destination defaults', () => {
  it.each(['forklift', 'cna'])('uses the canonical program title and enrollment subject for %s inquiries', async (slug) => {
    const { subject, message, formData } = await renderContact({ program: slug });

    expect(subject).toHaveValue('enrollment');
    expect(message).toHaveValue(
      `I would like current availability, delivery details, access terms, and final pricing for ${getStaticProgram(slug)!.title}.`,
    );
    expect(formData.get('program')).toBe(getStaticProgram(slug)!.slug);
    expect(formData.get('interest')).toBeNull();
  });

  it('retains the program and employer training context in the actual submitted form', async () => {
    const { subject, message, formData } = await renderContact({ program: 'forklift', interest: 'employer-training' });

    expect(subject).toHaveValue('employer-partnership');
    expect(message).toHaveValue(
      'I am interested in employer training. I would like current availability, delivery details, access terms, and final pricing for Forklift and Manufacturing Operations.',
    );
    expect(formData.get('program')).toBe('forklift');
    expect(formData.get('interest')).toBe('employer-training');
    expect(formData.get('subject')).toBe('employer-partnership');
  });

  it.each([
    {},
    { program: 'unknown-program', interest: 'employer-training' },
    { program: ['forklift'], interest: 'employer-training' },
    { program: '<script>alert(1)</script>' },
  ])('leaves defaults empty for an absent or invalid program: %j', async (params) => {
    const { subject, message, formData } = await renderContact(params);

    expect(subject).toHaveValue('');
    expect(message).toHaveValue('');
    expect(formData.get('program')).toBeNull();
    expect(formData.get('interest')).toBeNull();
  });

  it.each([{ interest: 'unknown-interest' }, { interest: ['employer-training'] }])('ignores unrecognized or repeated employer interest: %j', async ({ interest }) => {
    const { subject, message, formData } = await renderContact({ program: 'forklift', interest });

    expect(subject).toHaveValue('enrollment');
    expect(message).toHaveValue(
      'I would like current availability, delivery details, access terms, and final pricing for Forklift and Manufacturing Operations.',
    );
    expect(formData.get('interest')).toBeNull();
  });

  it.each([
    { params: { course: 'advanced-welding' }, subject: 'enrollment', title: 'Advanced Welding' },
    { params: { product: 'training-bundle' }, subject: 'other', title: 'Training Bundle' },
    { params: { product: 'training-bundle', course: 'advanced-welding' }, subject: 'enrollment', title: 'Training Bundle' },
  ])('preserves existing product/course precedence for $params', async ({ params, subject: expectedSubject, title }) => {
    const { subject, message, formData } = await renderContact({
      ...params,
      program: 'forklift',
      interest: 'employer-training',
    });

    expect(subject).toHaveValue(expectedSubject);
    expect(message).toHaveValue(
      `I would like current availability, delivery details, access terms, and final pricing for ${title}.`,
    );
    expect(formData.get('program')).toBeNull();
    expect(formData.get('interest')).toBeNull();
  });

  it.each(Object.entries(COURSE_BUILDER_REQUESTS))('preserves the %s request and submission context', async (product, expectedMessage) => {
    const { subject, message, formData } = await renderContact({ product, program: 'forklift', interest: 'employer-training' });

    expect(subject).toHaveValue('course-builder');
    expect(message).toHaveValue(expectedMessage);
    expect(formData.get('interest')).toBe(product);
    expect(formData.get('program')).toBeNull();
  });
});
