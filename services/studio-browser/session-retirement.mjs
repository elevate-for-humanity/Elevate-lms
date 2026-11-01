// Ordinary disconnect/expiry must not discard the only live authenticated state
// when external persistence fails. Forced process shutdown cannot retain it.
export async function retireBrowserSession(session, {saveState, retire, force=false, onForcedFailure=()=>{}, canRetire=()=>true}) {
  try {
    await session.checkpointProviderState?.();
    // This final awaited write is authoritative; background checkpoint queues
    // may intentionally report their own failures without rejecting input.
    await saveState(session.providerScope, session.context);
  } catch (cause) {
    if(!force)throw new Error('SESSION_CHECKPOINT_FAILED', {cause});
    onForcedFailure();
  }
  if (!canRetire()) return;
  await retire();
}
