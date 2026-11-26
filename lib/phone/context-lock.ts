// Single-context leadership for a phone device identity.
//
// The Asterisk AOR for a device allows exactly one contact
// (max_contacts=1, remove_existing=yes), so two live page contexts driving
// the same device identity — the installed PWA plus a browser tab, or two
// tabs — keep evicting each other's SIP registration and flap offline.
// The first context to claim leadership owns the identity; later contexts
// defer, and take over automatically if the leader goes away. Leadership
// is held with the Web Locks API, which the browser holds for the
// context's lifetime regardless of page timers, and fails open where the
// API is unavailable so the phone keeps working exactly as before.

export interface PhoneContextLeadership {
  /** Resolves true when this context leads, false when another live context already leads. Never rejects. */
  readonly acquired: Promise<boolean>;
  /** Whether this context leads right now, including after a takeover. */
  isLeader(): boolean;
  /** Register a callback fired if this context later takes over leadership. */
  onTakeover(callback: () => void): void;
  /** Give up leadership (or the takeover queue slot) so another context can lead. */
  release(): void;
}

export function claimPhoneContext(scope: string): PhoneContextLeadership {
  const name = `elevate-phone-context:${scope}`;
  let releaseHeld: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    releaseHeld = resolve;
  });
  let takeoverCallback: () => void = () => {};
  let resolveAcquired: (leader: boolean) => void = () => {};
  const acquired = new Promise<boolean>((resolve) => {
    resolveAcquired = resolve;
  });
  let leaderNow = false;
  const leadership: PhoneContextLeadership = {
    acquired,
    isLeader() {
      return leaderNow;
    },
    onTakeover(callback) {
      takeoverCallback = callback;
    },
    release() {
      leaderNow = false;
      releaseHeld();
    },
  };
  const locks = (
    globalThis as { navigator?: { locks?: LockManager } }
  ).navigator?.locks;
  if (!locks || typeof locks.request !== 'function') {
    // No Web Locks support: fail open — this context leads, so the phone
    // behaves exactly as it did before single-context coordination.
    leaderNow = true;
    resolveAcquired(true);
    return leadership;
  }
  void locks
    .request(name, { ifAvailable: true }, async (lock) => {
      if (lock) {
        leaderNow = true;
        resolveAcquired(true);
        // Hold the lock until release() is called.
        await held;
        return;
      }
      // Another live context already leads this identity. Defer, and take
      // over automatically if that context closes or releases.
      resolveAcquired(false);
      await locks
        .request(name, async () => {
          leaderNow = true;
          takeoverCallback();
          await held;
        })
        .catch(() => undefined);
    })
    // A locks failure must never block the phone: fail open as leader.
    .catch(() => {
      leaderNow = true;
      resolveAcquired(true);
    });
  return leadership;
}
