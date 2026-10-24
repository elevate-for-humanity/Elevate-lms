// Verify real capture before advertising a browser phone as ready.
export async function verifyPhoneMicrophone(mediaDevices = globalThis.navigator?.mediaDevices, { signal, timeoutMs = 15000 } = {}) {
  if (!mediaDevices?.getUserMedia) {
    throw new Error('Microphone capture is unavailable. Open Elevate Phone in a supported browser over HTTPS.');
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('A finite microphone verification deadline is required.');
  const cancelled = () => Object.assign(new Error('Phone connection was cancelled.'), { name: 'AbortError' });
  if (signal?.aborted) throw cancelled();
  let stream, timer, abort;
  let expired = false;
  const capture = Promise.resolve().then(() => {
    if (signal?.aborted) throw cancelled();
    return mediaDevices.getUserMedia({ audio: true, video: false });
  }).then(value => {
    // getUserMedia cannot be cancelled. Never retain a device granted after
    // this attempt timed out or its caller disconnected.
    if (expired) value.getTracks().forEach(track => track.stop());
    return value;
  });
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      expired = true;
      reject(new Error('Microphone permission was not confirmed. Allow microphone access for this Elevate site, then reconnect the phone.'));
    }, timeoutMs);
    abort = () => { expired = true; reject(cancelled()); };
    signal?.addEventListener('abort', abort, { once: true });
  });
  try {
    stream = await Promise.race([capture, deadline]);
    if (signal?.aborted) throw cancelled();
    if (!stream.getAudioTracks().some(track => track.readyState === 'live')) {
      throw new Error('No working microphone is connected. Connect a microphone or headset, then reconnect the phone.');
    }
  } catch (error) {
    if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
      throw new Error('No microphone is connected to this browser. Connect a microphone or headset, then reconnect the phone.', { cause: error });
    }
    if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
      throw new Error('Microphone access is blocked. Allow microphone access for this Elevate site in browser and device settings, then reconnect the phone.', { cause: error });
    }
    if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') {
      throw new Error('The microphone cannot be opened. Close other apps using it, check the device connection, then reconnect the phone.', { cause: error });
    }
    throw error;
  } finally {
    expired = true;
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
    stream?.getTracks().forEach(track => track.stop());
  }
}
