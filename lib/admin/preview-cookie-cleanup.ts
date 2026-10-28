import type { NextResponse } from 'next/server';

/** A user preview must never inherit an earlier shop-scoped preview. */
export function clearHostShopPreviewCookies(response: NextResponse) {
  for (const name of ['elevate_host_shop_preview_session', '__efh_host_shop_partner']) {
    response.cookies.set(name, '', { expires: new Date(0), path: '/' });
  }
}

/** Used when leaving preview or selecting a shop with no linked preview user. */
export function clearUserPreviewCookies(response: NextResponse) {
  for (const name of [
    'elevate_portal_preview_user',
    'elevate_portal_preview_actor',
    'elevate_portal_preview_session',
  ]) {
    response.cookies.set(name, '', { expires: new Date(0), path: '/' });
  }
}
