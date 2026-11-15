/** Shared definition of an application source correction.
 * Assertion suites (.test./.spec.) never qualify. Non-test files always do.
 * Shared test helpers and fixtures are executable application code: a defect
 * there (for example a browser-runtime error guard) cannot be repaired by
 * editing an existing test, so a new helper is a legitimate correction while
 * assertion suites stay immutable. */
const NON_APPLICATION_TEST = /\.(?:test|spec)\.[cm]?[jt]sx?$/;
const SHARED_TEST_SUPPORT = /^tests\/(?:e2e\/)?helpers\//;

export function isApplicationSourceCorrection(path) {
  return typeof path === 'string' && !NON_APPLICATION_TEST.test(path) &&
    (!path.startsWith('tests/') || SHARED_TEST_SUPPORT.test(path));
}

/** PARIS cannot treat a model's summary as evidence of an applied repair. */
export function missingRepairDeliverables(changedFiles, newRegressionTests) {
  const files=[...changedFiles];
  return files.length===0 || newRegressionTests.size===0 ||
    !files.some(isApplicationSourceCorrection);
}
