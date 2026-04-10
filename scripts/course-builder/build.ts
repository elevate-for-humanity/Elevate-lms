/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import { barberCourse } from './seeds/barber-course.seed';

function build(course: typeof barberCourse) {
  const lessons = course.modules.flatMap(m => [
    ...m.lessons,
    ...(m.checkpoint ? [m.checkpoint] : []),
  ]);
  const totalHours = course.modules
    .flatMap(m => [...m.lessons, ...(m.checkpoint ? [m.checkpoint] : [])])
    .reduce((sum, l) => sum + l.hoursCredit, 0);

  return {
    ...course,
    meta: {
      lessonCount: course.modules.flatMap(m => m.lessons).length,
      totalSlugs: lessons.length,
      totalHours: Math.round(totalHours * 100) / 100,
      domainCoverage: [...new Set(course.modules.flatMap(m => m.lessons.map(l => l.domain)))],
      ojtBreakdown: course.modules.flatMap(m => m.lessons).reduce((acc, l) => {
        acc[l.ojtCategory] = (acc[l.ojtCategory] ?? 0) + l.hoursCredit;
        return acc;
      }, {} as Record<string, number>),
    },
  };
}

const output = build(barberCourse);
const outPath = path.resolve(process.cwd(), 'scripts/generated/barber-course.generated.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

console.log('COURSE BUILT');
console.log(`Lessons:     ${output.meta.lessonCount}`);
console.log(`Total slugs: ${output.meta.totalSlugs}`);
console.log(`Hours:       ${output.meta.totalHours}h`);
console.log(`Output:      ${outPath}`);
