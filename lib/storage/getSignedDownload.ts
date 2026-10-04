import { getSignedObjectUrl } from './object-storage';

export async function getSignedDownload(key: string, expiresIn = 600) {
  const url = await getSignedObjectUrl(key, expiresIn);
  if (!url) {
    throw new Error('Unable to create signed object-storage download URL');
  }
  return url;
}
