// components/TenantCustomStyles.tsx
// NOTE: This component runs in root layout which may be edge context.
// DO NOT import @supabase/supabase-js here - it breaks Netlify edge functions.
import { sanitizeHtml } from '@/lib/sanitize';
import { getTenantFromHost } from "@/lib/multiTenant/tenantFromHost";
import { headers } from "next/headers";
import { createClient } from '@/lib/supabase/server';

interface TenantStyles {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  custom_css?: string;
  custom_favicon_url?: string;
  custom_font_url?: string;
  font_family?: string;
  border_radius?: string;
  logo_url?: string;
}

interface TenantStyles {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  custom_css?: string;
  custom_favicon_url?: string;
  custom_font_url?: string;
  font_family?: string;
  border_radius?: string;
  logo_url?: string;
}

export async function TenantCustomStyles() {
  const headersList = await headers();
  const host = headersList.get("host") ?? undefined;
  
  let styles: TenantStyles | null = null;

<<<<<<< HEAD
  // Get tenant from host - no DB call to avoid edge runtime issues
=======
  // Try to get tenant from host
>>>>>>> d5f142eac (Add database integration to all components with createClient)
  const tenant = await getTenantFromHost(host);
  
  if (tenant) {
    styles = {
      primary_color: tenant.primary_color,
      secondary_color: tenant.secondary_color,
      custom_css: tenant.custom_css,
      custom_favicon_url: tenant.custom_favicon_url,
    };
<<<<<<< HEAD
=======
  } else {
    // Fallback: try to get styles from site_settings
    try {
      const supabase = await createClient();
      const { data: siteStyles } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'custom_styles')
        .single();

      if (siteStyles?.value) {
        styles = JSON.parse(siteStyles.value);
      }
    } catch (err) {
      // No custom styles configured
    }
>>>>>>> d5f142eac (Add database integration to all components with createClient)
  }

  if (!styles) return null;

  const cssVariables = `
    :root {
      ${styles.primary_color ? `--tenant-primary: ${styles.primary_color};` : ''}
      ${styles.secondary_color ? `--tenant-secondary: ${styles.secondary_color};` : ''}
      ${styles.accent_color ? `--tenant-accent: ${styles.accent_color};` : ''}
      ${styles.background_color ? `--tenant-bg: ${styles.background_color};` : ''}
      ${styles.text_color ? `--tenant-text: ${styles.text_color};` : ''}
      ${styles.border_radius ? `--tenant-radius: ${styles.border_radius};` : ''}
      ${styles.font_family ? `--tenant-font: ${styles.font_family};` : ''}
    }
    
    ${styles.primary_color ? `
      .btn-primary, .bg-primary, [data-tenant-primary] {
        background-color: var(--tenant-primary) !important;
      }
      .text-primary, [data-tenant-primary-text] {
        color: var(--tenant-primary) !important;
      }
      .border-primary, [data-tenant-primary-border] {
        border-color: var(--tenant-primary) !important;
      }
      .ring-primary {
        --tw-ring-color: var(--tenant-primary) !important;
      }
    ` : ''}
    
    ${styles.secondary_color ? `
      .btn-secondary, .bg-secondary, [data-tenant-secondary] {
        background-color: var(--tenant-secondary) !important;
      }
      .text-secondary, [data-tenant-secondary-text] {
        color: var(--tenant-secondary) !important;
      }
    ` : ''}
    
    ${styles.font_family ? `
      body, .tenant-font {
        font-family: var(--tenant-font), system-ui, sans-serif !important;
      }
    ` : ''}
  `;

  return (
    <>
      {/* Custom font */}
      {styles.custom_font_url && (
        <link rel="stylesheet" href={styles.custom_font_url} />
      )}
      
      {/* CSS Variables and tenant overrides */}
      <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      
      {/* Custom CSS from tenant */}
      {styles.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: sanitizeHtml(styles.custom_css) }} />
      )}
      
      {/* Custom favicon */}
      {styles.custom_favicon_url && (
        <link rel="icon" href={styles.custom_favicon_url} />
      )}
    </>
  );
}

export default TenantCustomStyles;
