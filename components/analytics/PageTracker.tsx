'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { Gtag } from '@/lib/types/external-sdks';

interface PageTrackerProps {
  pageName: string;
  pageCategory?: string;
}

// Type-safe gtag helper
function safeGtag(): Gtag.Gtag | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { gtag?: Gtag.Gtag }).gtag;
}

export function PageTracker({ pageName, pageCategory }: PageTrackerProps) {
  const pathname = usePathname();

  useEffect(() => {
    const gtag = safeGtag();
    if (gtag) {
      gtag('event', 'page_view', {
        page_title: pageName,
        page_location: window.location.href,
        page_path: pathname,
        page_category: pageCategory,
      });
    }
  }, [pathname, pageName, pageCategory]);

  return null;
}

// Track CTA clicks
export function trackCTAClick(ctaName: string, destination?: string) {
  const gtag = safeGtag();
  if (gtag) {
    gtag('event', 'cta_click', {
      event_category: 'engagement',
      event_label: ctaName,
      destination: destination,
    });
  }
}

// Track search
export function trackSearch(query: string, category?: string) {
  const gtag = safeGtag();
  if (gtag) {
    gtag('event', 'search', {
      search_term: query,
      search_category: category,
    });
  }
}

// Track product view
export function trackProductView(
  productId: string,
  productName: string,
  category: string,
  price: number,
) {
  const gtag = safeGtag();
  if (gtag) {
    gtag('event', 'view_item', {
      currency: 'USD',
      value: price,
      items: [
        {
          item_id: productId,
          item_name: productName,
          item_category: category,
          price: price,
        },
      ],
    });
  }
}

// Track course view
export function trackCourseView(
  courseId: string,
  courseName: string,
  category: string,
  price?: number,
) {
  const gtag = safeGtag();
  if (gtag) {
    gtag('event', 'view_item', {
      currency: 'USD',
      value: price || 0,
      items: [
        {
          item_id: courseId,
          item_name: courseName,
          item_category: category,
          price: price || 0,
        },
      ],
    });
  }
}

// Track add to cart
export function trackAddToCart(
  productId: string,
  productName: string,
  category: string,
  price: number,
) {
  const gtag = safeGtag();
  if (gtag) {
    gtag('event', 'add_to_cart', {
      currency: 'USD',
      value: price,
      items: [
        {
          item_id: productId,
          item_name: productName,
          item_category: category,
          price: price,
          quantity: 1,
        },
      ],
    });
  }
}

// Track form submission
export function trackFormSubmit(formName: string, success: boolean) {
  const gtag = safeGtag();
  if (gtag) {
    gtag('event', success ? 'form_submit_success' : 'form_submit_error', {
      event_category: 'form',
      event_label: formName,
    });
  }
}

// Track help article view
export function trackArticleView(articleId: string, articleTitle: string, category: string) {
  const gtag = safeGtag();
  if (gtag) {
    gtag('event', 'article_view', {
      event_category: 'content',
      article_id: articleId,
      article_title: articleTitle,
      article_category: category,
    });
  }
}
