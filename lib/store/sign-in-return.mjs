// Store authentication returns only to Store pages on the same application.
export function storeSignInReturnPath(value) {
  if(typeof value !== 'string' || /[\\\r\n\0]/.test(value))return '/store';
  try {
    const url=new URL(value,'https://store.elevateforhumanity.org');
    if(url.origin !== 'https://store.elevateforhumanity.org' || url.username || url.password ||
      !(url.pathname==='/store'||url.pathname.startsWith('/store/')))return '/store';
    return url.pathname+url.search+url.hash;
  } catch {return '/store';}
}

// Checkout authentication belongs to Store even when a product link originated
// on Marketing. Never require an LMS session to finish a commerce purchase.
export function storeSignInHref(value) {
  return 'https://store.elevateforhumanity.org/login?redirect=' + encodeURIComponent(storeSignInReturnPath(value));
}
