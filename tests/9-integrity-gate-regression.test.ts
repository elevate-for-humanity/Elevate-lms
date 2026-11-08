import { IntegrityGateTest } from './integrity_test.js'; describe('Integrity Gate Regression Test', () => {
  it('should pass the integrity check', async () => {
    await IntegrityGateTest();
  });
});