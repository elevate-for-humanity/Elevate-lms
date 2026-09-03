/**
 * Studio control-plane adapter for the canonical Course Builder.
 *
 * Studio owns intent and workflow control. This adapter intentionally exposes
 * the Course Builder orchestration contract instead of the private Course
 * Factory execution engine.
 */
export {
  courseFactory,
  courseFactory as courseBuilderController,
  auditCourseGovernance,
  publishGovernedCourse,
  repairCanonicalCourse,
  queueCourseMedia,
  normalizeGeneratedCourseForGovernance,
} from '../course-builder/orchestrator';
