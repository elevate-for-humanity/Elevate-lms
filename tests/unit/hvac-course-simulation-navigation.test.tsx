import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CanonicalHvacCourseHome from '@/apps/lms/app/programs/hvac-technician/course/CanonicalHvacCourseHome';
import workbook from '@/lib/lms/hvac-workbook-content.json';
import { HVAC_COURSE_ID, HVAC_PRACTICE_LESSONS } from '@/lib/lms/hvac-workbook-contract';

vi.mock('next/image', () => ({ default: () => null }));
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const practicalLessons = workbook.chapters.map((chapter, index) => ({
  id: chapter.lesson_id,
  title: chapter.title,
  lessonType: 'lesson',
  durationMinutes: 30,
  orderIndex: index + 1,
  simulation: {
    id: `hvac-sim:chapter-${String(index + 1).padStart(2, '0')}:v1`,
    title: `Virtual lab ${index + 1}`,
    mastered: index === 0,
    started: index < 2,
  },
}));
const exams = HVAC_PRACTICE_LESSONS.map((exam, index) => ({
  id: exam.id,
  title: `${exam.title} required practice test`,
  lessonType: 'quiz',
  durationMinutes: 25,
  orderIndex: index + 18,
}));
const props = {
  courseId: HVAC_COURSE_ID,
  title: 'HVAC / EPA 608',
  description: 'Existing authored course',
  modules: [
    {
      id: 'instruction',
      title: 'Instruction and simulation',
      description: null,
      orderIndex: 1,
      lessons: practicalLessons,
    },
    {
      id: 'practice',
      title: 'EPA practice tests',
      description: null,
      orderIndex: 2,
      lessons: exams,
    },
  ],
  completedLessonIds: [practicalLessons[0].id, 'retired-unrelated-id'],
  totalTimeSeconds: 3600,
};

describe('full HVAC course simulation navigation', () => {
  it('resumes a later saved lab before an earlier untouched lab', () => {
    const lessons = practicalLessons.map((lesson, index) => ({
      ...lesson,
      simulation: {
        ...lesson.simulation,
        mastered: false,
        started: index === 4,
      },
    }));
    render(<CanonicalHvacCourseHome {...props} modules={[{ ...props.modules[0], lessons }]} />);
    expect(screen.getByRole('link', { name: 'Continue simulation practice' })).toHaveAttribute(
      'href',
      `/lms/courses/${HVAC_COURSE_ID}/lessons/${lessons[4].id}#hvac-simulation`,
    );
  });
  it('retains all 21 lesson links and exposes 17 mapped simulation labs', () => {
    render(<CanonicalHvacCourseHome {...props} />);
    expect(screen.getByText('17 interactive simulation labs')).toBeTruthy();
    expect(screen.getByText('21 lessons')).toBeTruthy();
    expect(screen.getByText('1 of 17 simulations mastered')).toBeTruthy();
    for (const lesson of [...practicalLessons, ...exams]) {
      expect(
        screen
          .getByRole('link', {
            name: new RegExp(lesson.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
          })
          .getAttribute('href'),
      ).toBe(`/lms/courses/${HVAC_COURSE_ID}/lessons/${lesson.id}`);
    }
    expect(
      screen.getByRole('link', { name: 'Continue simulation practice' }).getAttribute('href'),
    ).toBe(`/lms/courses/${HVAC_COURSE_ID}/lessons/${practicalLessons[1].id}#hvac-simulation`);
  });

  it('keeps course completion separate from simulation mastery and excludes stale lesson IDs', () => {
    render(<CanonicalHvacCourseHome {...props} />);
    expect(screen.getByText('1 of 21 lessons complete')).toBeTruthy();
    expect(screen.getByText('5%')).toBeTruthy();
    expect(screen.getByText(/Virtual lab 1 · Mastered/)).toBeTruthy();
    expect(screen.getByText(/Virtual lab 2 · In progress/)).toBeTruthy();
  });

  it('keeps required tests searchable without presenting them as equipment simulators', () => {
    render(<CanonicalHvacCourseHome {...props} />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search this course' }), {
      target: { value: 'Type III' },
    });
    expect(screen.getByRole('link', { name: /Type III required practice test/ })).toBeTruthy();
    expect(screen.queryByText('Orientation, Training Expectations and Careers')).toBeNull();
  });

  it('chooses the next lesson by the global course sequence even when modules group a later assessment first', () => {
    render(
      <CanonicalHvacCourseHome
        {...props}
        modules={[
          { ...props.modules[0], lessons: [practicalLessons[0], exams[0]] },
          { ...props.modules[1], lessons: [...practicalLessons.slice(1), ...exams.slice(1)] },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Continue course' }).getAttribute('href')).toBe(
      `/lms/courses/${HVAC_COURSE_ID}/lessons/${practicalLessons[1].id}`,
    );
  });
});
