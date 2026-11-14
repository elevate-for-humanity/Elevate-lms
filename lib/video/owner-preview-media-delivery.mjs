/** Preview URLs are scoped, temporary object reads. Stable object keys remain
 * in B2; this path never publishes a lesson or changes bucket permissions. */
export async function ownerPreviewMediaDelivery(result, {target, sign}) {
  if (!result.success || !target) return result;
  if (!/^[a-f0-9]{8}-[a-f0-9-]{27}$/i.test(target) || !result.key?.startsWith('course-videos/'))
    throw Error('OWNER_PREVIEW_MEDIA_SCOPE_INVALID');
  const url = await sign(result.key, 21600);
  if (!url) throw Error('OWNER_PREVIEW_MEDIA_SIGNING_FAILED');
  return {...result, url};
}
