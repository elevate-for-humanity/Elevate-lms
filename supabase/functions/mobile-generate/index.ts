/**
 * Mobile App Generator Edge Function
 * Generates React Native Expo app configuration
 *
 * Copyright (c) 2025 Elevate for Humanity
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EAS_BUILD_WEBHOOK = Deno.env.get('EAS_BUILD_WEBHOOK');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      org_id,
      appName,
      primary = '#111827',
      accent = '#06b6d4',
      logoUrl,
      platform = 'both',
    } = body;

    if (!org_id || !appName) {
      return new Response('org_id and appName required', { status: 400 });
    }

    // Store mobile app config in org_settings
    const { data: settings, error: settingsError } = await supabase
      .from('org_settings')
      .select('config')
      .eq('org_id', org_id)
      .maybeSingle();

    const currentConfig = settings?.config || {};
    const updatedConfig = {
      ...currentConfig,
      branding: {
        ...(currentConfig.branding || {}),
        primary,
        accent,
        logoUrl,
      },
      mobile: {
        appName,
        platform,
        updatedAt: Date.now(),
      },
    };

    await supabase.from('org_settings').upsert({
      org_id,
      config: updatedConfig,
    });

    // Create mobile app record
    const { data: app, error: appError } = await supabase
      .from('mobile_apps')
      .insert({
        org_id,
        app_name: appName,
        platform,
        config: {
          branding: { primary, accent, logoUrl },
          expo: {
            name: appName,
            slug: appName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            version: '1.0.0',
            orientation: 'portrait',
            icon: logoUrl || './assets/icon.png',
            splash: {
              image: './assets/splash.png',
              resizeMode: 'contain',
              backgroundColor: primary,
            },
            updates: {
              fallbackToCacheTimeout: 0,
            },
            assetBundlePatterns: ['**/*'],
            ios: {
              supportsTablet: true,
              bundleIdentifier: `com.elevateforhumanity.${appName.toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
            },
            android: {
              adaptiveIcon: {
                foregroundImage: logoUrl || './assets/adaptive-icon.png',
                backgroundColor: primary,
              },
              package: `com.elevateforhumanity.${appName.toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
            },
          },
        },
        build_status: 'pending',
      })
      .select()
      .single();

    if (appError) {
      return new Response(appError.message, { status: 500 });
    }

    // Generate app template
    const template = generateExpoTemplate(appName, primary, accent, logoUrl, org_id);

    // Upload template to storage
    const templateBlob = new Blob([template], { type: 'application/json' });
    const { error: uploadError } = await supabase.storage
      .from('mobile-builds')
      .upload(`templates/${org_id}/app.json`, templateBlob, { upsert: true });

    if (uploadError) {
    }

    // Trigger EAS build webhook if configured
    if (EAS_BUILD_WEBHOOK) {
      fetch(EAS_BUILD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id,
          app_id: app.id,
          platform,
          appName,
        }),
      }).catch((err) => console.error('EAS webhook failed:', err));
    }

    // Update build status
    await supabase.from('mobile_apps').update({ build_status: 'building' }).eq('id', app.id);

    return new Response(
      JSON.stringify({
        ok: true,
        app_id: app.id,
        message: 'Mobile app generation started',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});

function generateExpoTemplate(
  appName: string,
  primary: string,
  accent: string,
  logoUrl: string | undefined,
  orgId: string,
): string {
  return JSON.stringify(
    {
      expo: {
        name: appName,
        slug: appName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        version: '1.0.0',
        orientation: 'portrait',
        icon: logoUrl || './assets/icon.png',
        userInterfaceStyle: 'light',
        splash: {
          image: './assets/splash.png',
          resizeMode: 'contain',
          backgroundColor: primary,
        },
        updates: {
          fallbackToCacheTimeout: 0,
        },
        assetBundlePatterns: ['**/*'],
        ios: {
          supportsTablet: true,
          bundleIdentifier: `com.elevateforhumanity.${appName.toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
        },
        android: {
          adaptiveIcon: {
            foregroundImage: logoUrl || './assets/adaptive-icon.png',
            backgroundColor: primary,
          },
          package: `com.elevateforhumanity.${appName.toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
        },
        web: {
          favicon: './assets/favicon.png',
        },
        extra: {
          orgId,
          supabaseUrl: SUPABASE_URL,
          primaryColor: primary,
          accentColor: accent,
        },
      },
    },
    null,
    2,
  );
}
