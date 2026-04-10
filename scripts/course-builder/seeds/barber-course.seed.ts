import type { CourseSeed } from '../../../lib/curriculum/course-builder-types';
import { module1 } from './module-1.seed';
import { module2 } from './module-2.seed';
import { module3 } from './module-3.seed';
import { module4 } from './module-4.seed';
import { module5 } from './module-5.seed';
import { module6 } from './module-6.seed';
import { module7 } from './module-7.seed';
import { module8 } from './module-8.seed';

export const barberCourse: CourseSeed = {
  slug: 'barber-apprenticeship',
  title: 'Indiana Registered Barber License — Apprenticeship Program',
  hoursTotal: 14.5, // computed: sum of all lesson + checkpoint hoursCredit
  modules: [module1, module2, module3, module4, module5, module6, module7, module8],
};
