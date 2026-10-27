import { getSignedElevateMediaUrl } from './elevate-media-storage';

export async function getSignedDownload(key: string, expiresIn = 600) {
  const url = await getSignedElevateMediaUrl(key, expiresIn);
  if (!url) {
    throw new Error('Unable to create signed object-storage download URL');
  }
  return url;
}
