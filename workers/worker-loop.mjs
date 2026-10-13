/** Continuous Northflank polling or one bounded Cloud Run Job task. */
export async function runWorkerLoop({ processJob, delay, isStopping, once = false, onResult = () => {} }) {
  while (!isStopping()) {
    let result;
    try {
      result = await processJob();
    } catch (error) {
      // A finite job must fail visibly; continuous workers retain their retry loop.
      if (once) throw error;
      await delay();
      continue;
    }
    onResult(result);
    if (once) {
      // A durable cursor can advance after a failed lesson. That continuation
      // must not turn a failed instructional run into a successful Cloud task.
      if (result.result?.findings?.some(finding => finding.severity === 'error')) {
        throw new Error('ULTIMATE_TASK_REPAIR_REQUIRED');
      }
      // An explicitly persisted external dependency is a terminal task outcome,
      // not a render success. The database remains blocked until its wake-up RPC.
      if (result.claimed && !result.completed && !result.continuing && !result.awaitingDependency) {
        throw new Error('ULTIMATE_TASK_INCOMPLETE');
      }
      return result;
    }
    if (!result.claimed) await delay();
  }
}
