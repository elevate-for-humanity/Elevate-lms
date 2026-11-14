import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';

export default getRequestConfig(async () => {
  // Try to get locale from cookie
  let locale: Locale = defaultLocale;

  try {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;

    if (localeCookie && locales.includes(localeCookie)) {
      locale = localeCookie;
    }
  } catch {
    // Cookies not available, use default
  }

  // Load messages for the locale
  const messages = (await import(`./messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
