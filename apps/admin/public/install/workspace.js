// The install pages are public, static documents. Only explicitly saved, user-written text persists.
const draft = document.getElementById('draft');
const feedback = document.getElementById('feedback');
const readiness = document.getElementById('readiness');
const installButton = document.getElementById('install');
const storageKey = 'elevate.workspace-draft.' + document.body.dataset.workspace;
let savedText = '';
let offlineReady = false;
let installPrompt;

if (draft) {
  try {
    savedText = localStorage.getItem(storageKey) || '';
    draft.value = savedText;
  } catch {
    feedback.textContent = 'Device storage is unavailable. You can still copy your text.';
  }

  document.getElementById('save').onclick = () => {
    try {
      localStorage.setItem(storageKey, draft.value);
      savedText = draft.value;
      feedback.textContent = 'Draft saved on this device.';
    } catch {
      feedback.textContent = 'The draft could not be saved. Copy it before closing.';
    }
  };
  document.getElementById('copy').onclick = async () => {
    try {
      await navigator.clipboard.writeText(draft.value);
      feedback.textContent = 'Copied. Paste your draft into the online workspace.';
    } catch {
      draft.focus();
      draft.select();
      feedback.textContent = 'Your text is selected. Use the Copy command on your phone.';
    }
  };
  document.getElementById('download')?.addEventListener('click', () => {
    if (!draft.value.trim()) {
      feedback.textContent = 'Write an outline before downloading.';
      return;
    }
    const url = URL.createObjectURL(new Blob([draft.value], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'course-outline.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document.getElementById('clear').onclick = () => {
    if ((draft.value || savedText) && !window.confirm('Remove this draft from this device?')) return;
    try {
      localStorage.removeItem(storageKey);
      savedText = '';
      draft.value = '';
      feedback.textContent = 'Draft cleared.';
    } catch {
      feedback.textContent = 'The saved draft could not be removed.';
    }
  };
  window.addEventListener('beforeunload', (event) => {
    if (draft.value === savedText) return;
    event.preventDefault();
    event.returnValue = '';
  });

}

function showConnection() {
  if (!draft) {
    readiness.textContent = navigator.onLine
      ? 'Sign in to open your inbox.'
      : 'Reconnect to open your inbox.';
  } else if (offlineReady) {
    readiness.textContent = navigator.onLine
      ? 'Ready for offline drafting.'
      : 'Offline. You can write, save, and copy your draft.';
  } else {
    readiness.textContent = navigator.onLine
      ? 'Preparing this app for offline use…'
      : 'Reconnect once to prepare this app for offline use.';
  }
}
document.getElementById('workspace').onclick = (event) => {
  if (navigator.onLine) return;
  event.preventDefault();
  feedback.textContent = 'Reconnect to open this workspace.';
};
// The static workspace pages are offline draft pads, not installable apps
// (PWA audit 2026-11-28, RC-2): they carry no manifest and no install
// button. The install surfaces live inside the apps themselves. This guard
// keeps the shared script safe on pages without an install button.
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  if (installButton) installButton.hidden = false;
});
if (installButton) {
  installButton.onclick = async () => {
    const prompt = installPrompt;
    installPrompt = null;
    installButton.hidden = true;
    if (prompt) await prompt.prompt();
  };
}
window.addEventListener('appinstalled', () => { if (installButton) installButton.hidden = true; });

async function prepareOffline() {
  showConnection();
  try {
    await navigator.serviceWorker.register('/install/workspace-sw.js', {
      scope: window.location.pathname,
    });
    const controller = navigator.serviceWorker.controller;
    if (controller?.scriptURL !== new URL('/install/workspace-sw.js', location.origin).href) return;
    offlineReady = true;
    showConnection();
  } catch {
    if (offlineReady) return showConnection();
    if (!draft) return showConnection();
    readiness.textContent = 'Offline setup is incomplete. Reopen this page while connected.';
  }
}
window.addEventListener('online', prepareOffline);
window.addEventListener('offline', showConnection);
navigator.serviceWorker?.addEventListener('controllerchange', prepareOffline);
prepareOffline();
