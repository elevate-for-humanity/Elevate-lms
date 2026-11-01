/** A read-only preview observes the owner's device; it never registers one. */
export function phonePresenceDisplay(readOnly: boolean, connected: boolean, presenceStatus: string) {
  if (!readOnly) return { online: connected, label: connected ? 'Online for calls' : 'Phone offline' };
  if (presenceStatus === 'available') return { online: true, label: "Online on owner's device" };
  if (presenceStatus === 'busy') return { online: true, label: 'Owner is on a call' };
  if (presenceStatus === 'do_not_disturb') return { online: false, label: 'Owner set Do Not Disturb' };
  return { online: false, label: 'Owner phone offline — no active device' };
}
