// Both install pages are public, static documents. Only explicitly saved, user-written text persists.
const draft = document.getElementById('draft');
const feedback = document.getElementById('feedback');
const readiness = document.getElementById('readiness');
const installButton = document.getElementById('install');
const storageKey = 'elevate.workspace-draft.' + document.body.dataset.workspace;
let savedText = '';
let offlineReady = false;
let installPrompt;

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

function showConnection() {
  if (offlineReady) {
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
  feedback.textContent = 'Reconnect to open the secure workspace. Your draft stays here.';
};
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});
installButton.onclick = async () => {
  const prompt = installPrompt;
  installPrompt = null;
  installButton.hidden = true;
  if (prompt) await prompt.prompt();
};
window.addEventListener('appinstalled', () => { installButton.hidden = true; });

async function prepareOffline() {
  showConnection();
  try {
    const registration = await navigator.serviceWorker.register('/sw-admin.js', { scope: '/' });
    const active = (await navigator.serviceWorker.ready).active;
    if (!active) throw new Error('Service worker has not activated');
    const channel = new MessageChannel();
    const ready = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), 12000);
      channel.port1.onmessage = (event) => {
        clearTimeout(timer);
        resolve(event.data?.ready === true);
      };
      active.postMessage({ type: 'PREPARE_WORKSPACE' }, [channel.port2]);
    });
    channel.port1.close();
    if (!ready) {
      await registration.update();
      throw new Error('Workspace assets are unavailable');
    }
    offlineReady = true;
    showConnection();
  } catch {
    if (offlineReady) return showConnection();
    readiness.textContent = 'Offline setup is incomplete. Reopen this page while connected.';
  }
}
window.addEventListener('online', prepareOffline);
window.addEventListener('offline', showConnection);
navigator.serviceWorker?.addEventListener('controllerchange', prepareOffline);
prepareOffline();
