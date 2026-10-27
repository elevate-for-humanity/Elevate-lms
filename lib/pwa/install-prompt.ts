'use client';

export type DeferredPwaInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>;
};

type Listener = (event: DeferredPwaInstallPrompt | null) => void;

let deferredPrompt: DeferredPwaInstallPrompt | null = null;
const listeners = new Set<Listener>();

function publish() {
  listeners.forEach((listener) => listener(deferredPrompt));
}

export function capturePwaInstallPrompt(event: Event) {
  event.preventDefault();
  deferredPrompt = event as DeferredPwaInstallPrompt;
  publish();
}

export function clearPwaInstallPrompt() {
  deferredPrompt = null;
  publish();
}

export function subscribeToPwaInstallPrompt(listener: Listener) {
  listeners.add(listener);
  listener(deferredPrompt);
  return () => listeners.delete(listener);
}
