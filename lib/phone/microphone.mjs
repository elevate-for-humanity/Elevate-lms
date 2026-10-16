// Verify real capture before advertising a browser phone as ready.
export async function verifyPhoneMicrophone(mediaDevices = globalThis.navigator?.mediaDevices) {
  if (!mediaDevices?.getUserMedia) {
    throw new Error('Microphone capture is unavailable. Open Elevate Phone in a supported browser over HTTPS.');
  }
  let stream;
  try {
    stream = await mediaDevices.getUserMedia({ audio: true, video: false });
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
    stream?.getTracks().forEach(track => track.stop());
  }
}
