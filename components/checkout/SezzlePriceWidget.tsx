'use client';
import { logger } from '@/lib/logger';

import { useEffect } from 'react';
import Script from 'next/script';

interface ConfigGroupStyle {
  [property: string]: string;
}

interface RelatedElementAction {
  relatedPath: string;
  initialAction: (r: Element, w: Element) => void;
}

interface ObserveElement {
  eventType: string;
  element: string;
}

interface SezzleConfigGroup {
  targetXPath: string;
  renderToPath?: string;
  urlMatch?: string;
  theme?: 'light' | 'dark' | 'grayscale' | 'white' | 'white-flat' | 'purple-pill';
  ignoredPriceElements?: string[];
  ignoredFormattedPriceText?: string[];
  alignment?: 'left' | 'center' | 'right' | 'auto';
  alignmentSwitchMinWidth?: number;
  alignmentSwitchType?: 'center' | 'left' | 'right';
  containerStyle?: ConfigGroupStyle;
  textStyle?: ConfigGroupStyle;
  logoStyle?: ConfigGroupStyle;
  hideClasses?: string[];
  relatedElementActions?: RelatedElementAction[];
}

interface SezzleWidgetConfig {
  configGroups: SezzleConfigGroup[];
  language?: string;
  apDualInstall?: boolean;
  klarnaDualInstall?: boolean;
  minPrice?: number;
  maxPrice?: number;
  observeElements?: ObserveElement[];
}

interface SezzlePriceWidgetProps {
  merchantId?: string;
  config?: SezzleWidgetConfig;
  // Simple mode props (when not using full config)
  price?: number;
  targetSelector?: string;
  theme?: 'light' | 'dark' | 'grayscale' | 'white' | 'white-flat' | 'purple-pill';
  alignment?: 'left' | 'center' | 'right' | 'auto';
  language?: string;
  minPrice?: number;
  maxPrice?: number;
}

declare global {
  interface Document {
    sezzleConfig?: SezzleWidgetConfig;
  }
  interface Window {
    Sezzle?: {
      init: () => void;
    };
  }
}

/**
 * Sezzle Price Widget
 *
 * Displays "or 4 interest-free payments of $X with Sezzle" messaging.
 *
 * Simple Usage:
 * <SezzlePriceWidget price={99.99} />
 *
 * Advanced Usage with Config:
 * <SezzlePriceWidget
 *   config={{
 *     configGroups: [{
 *       targetXPath: ".product-price",
 *       theme: "dark",
 *       alignment: "left"
 *     }],
 *     minPrice: 35,
 *     maxPrice: 2500
 *   }}
 * />
 *
 * Requires NEXT_PUBLIC_SEZZLE_MERCHANT_ID environment variable.
 */
export default function SezzlePriceWidget({
  merchantId,
  config,
  price,
  targetSelector,
  theme = 'light',
  alignment = 'left',
  language = 'en',
  minPrice = 35,
  maxPrice = 2500,
}: SezzlePriceWidgetProps) {
  const sezzleMerchantId = merchantId || process.env.NEXT_PUBLIC_SEZZLE_MERCHANT_ID;

  useEffect(() => {
    // Set up Sezzle configuration
    if (config) {
      document.sezzleConfig = config;
    } else {
      // Build simple config from props
      document.sezzleConfig = {
        configGroups: [
          {
            targetXPath: targetSelector || '.sezzle-price',
            theme: theme,
            alignment: alignment,
          },
        ],
        language: language,
        minPrice: minPrice,
        maxPrice: maxPrice,
      };
    }

    // Reinitialize widget when config changes
    if (window.Sezzle) {
      window.Sezzle.init();
    }

    return () => {
      // Cleanup
      delete document.sezzleConfig;
    };
  }, [config, targetSelector, theme, alignment, language, minPrice, maxPrice]);

  if (!sezzleMerchantId) {
    logger.warn('SezzlePriceWidget: Missing NEXT_PUBLIC_SEZZLE_MERCHANT_ID');
    return null;
  }

  // If price provided, check limits
  if (price !== undefined && (price < minPrice || price > maxPrice)) {
    return null;
  }

  return (
    <>
      <Script
        id="sezzle-widget"
        src={`https://widget.sezzle.com/v1/javascript/price-widget?uuid=${sezzleMerchantId}`}
        strategy="lazyOnload"
        onLoad={() => {
          if (window.Sezzle) {
            window.Sezzle.init();
          }
        }}
      />
      {price !== undefined && (
        <div className="sezzle-price sezzle-payment-amount" data-sezzle-price={price.toFixed(2)}>
          ${price.toFixed(2)}
        </div>
      )}
    </>
  );
}

/**
 * Pre-built configurations for common use cases
 */
export const SezzleConfigs = {
  // Product page - targets common price selectors
  productPage: (options?: Partial<SezzleConfigGroup>): SezzleWidgetConfig => ({
    configGroups: [
      {
        targetXPath: '.product-price, .price, [data-price], .amount',
        theme: 'light',
        alignment: 'left',
        ...options,
      },
    ],
    minPrice: 35,
    maxPrice: 2500,
  }),

  // Cart page
  cartPage: (options?: Partial<SezzleConfigGroup>): SezzleWidgetConfig => ({
    configGroups: [
      {
        targetXPath: '.cart-total, .order-total, .subtotal',
        theme: 'light',
        alignment: 'right',
        ...options,
      },
    ],
    minPrice: 35,
    maxPrice: 2500,
  }),

  // Dark theme for dark backgrounds
  darkTheme: (targetXPath: string): SezzleWidgetConfig => ({
    configGroups: [
      {
        targetXPath,
        theme: 'dark',
        alignment: 'left',
      },
    ],
    minPrice: 35,
    maxPrice: 2500,
  }),

  // Custom styling
  custom: (
    targetXPath: string,
    containerStyle?: ConfigGroupStyle,
    textStyle?: ConfigGroupStyle,
    logoStyle?: ConfigGroupStyle,
  ): SezzleWidgetConfig => ({
    configGroups: [
      {
        targetXPath,
        theme: 'light',
        alignment: 'left',
        containerStyle,
        textStyle,
        logoStyle,
      },
    ],
    minPrice: 35,
    maxPrice: 2500,
  }),
};
