/** PARIS cannot treat a model's summary as evidence of an applied repair. */
export function missingRepairDeliverables(changedFiles, newRegressionTests) {
  const files=[...changedFiles];
  return files.length===0 || newRegressionTests.size===0 ||
    !files.some(path => !path.startsWith('tests/') &&
      !/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(path));
}
