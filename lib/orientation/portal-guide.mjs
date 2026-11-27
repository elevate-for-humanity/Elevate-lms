export function liveAvatarGuideUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.origin !== 'https://embed.liveavatar.com' || url.username || url.password ||
        url.search || url.hash || !/^\/v1\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname)) return null;
    return url.href;
  } catch {
    return null;
  }
}
