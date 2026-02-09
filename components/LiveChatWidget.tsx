'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { createClient } from '@/lib/supabase/client';

interface ChatConfig {
  provider: 'tawk' | 'intercom' | 'crisp' | 'custom';
  widget_id: string;
  enabled: boolean;
  show_on_mobile: boolean;
  delay_seconds: number;
  custom_script?: string;
}

interface Props {
  forceShow?: boolean;
}

export function LiveChatWidget({ forceShow = false }: Props) {
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      const supabase = createClient();

      try {
        // Get user info
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);

        // Fetch chat widget config from database
        const { data: settings } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'live_chat_config')
          .single();

        if (settings?.value) {
          const chatConfig = JSON.parse(settings.value) as ChatConfig;
          setConfig(chatConfig);

          // Check if should show
          if (chatConfig.enabled || forceShow) {
            // Check mobile
            const isMobile = window.innerWidth < 768;
            if (isMobile && !chatConfig.show_on_mobile && !forceShow) {
              return;
            }

            // Delay loading
            setTimeout(() => {
              setShouldShow(true);
            }, (chatConfig.delay_seconds || 0) * 1000);
          }
        } else {
          // Default to Tawk.to
          setConfig({
            provider: 'tawk',
            widget_id: '67736c9649e2fd8dfef6b8e9/1igqnhqgd',
            enabled: true,
            show_on_mobile: true,
            delay_seconds: 2,
          });
          setTimeout(() => setShouldShow(true), 2000);
        }
      } catch (err) {
        console.error('Error fetching chat config:', err);
        // Fallback to default
        setConfig({
          provider: 'tawk',
          widget_id: '67736c9649e2fd8dfef6b8e9/1igqnhqgd',
          enabled: true,
          show_on_mobile: true,
          delay_seconds: 2,
        });
        setTimeout(() => setShouldShow(true), 2000);
      }
    }

    fetchConfig();
  }, [forceShow]);

  // Set user info in chat widget
  useEffect(() => {
    if (!loaded || !user) return;

    // Set user info for Tawk.to
    if (config?.provider === 'tawk' && typeof window !== 'undefined') {
      const Tawk_API = (window as any).Tawk_API;
      if (Tawk_API) {
        Tawk_API.onLoad = function() {
          Tawk_API.setAttributes({
            name: user.user_metadata?.full_name || user.email?.split('@')[0],
            email: user.email,
            userId: user.id,
          }, function(error: any) {
            if (error) console.error('Tawk setAttributes error:', error);
          });
        };
      }
    }

    // Set user info for Intercom
    if (config?.provider === 'intercom' && typeof window !== 'undefined') {
      const Intercom = (window as any).Intercom;
      if (Intercom) {
        Intercom('update', {
          name: user.user_metadata?.full_name || user.email?.split('@')[0],
          email: user.email,
          user_id: user.id,
        });
      }
    }

    // Set user info for Crisp
    if (config?.provider === 'crisp' && typeof window !== 'undefined') {
      const $crisp = (window as any).$crisp;
      if ($crisp) {
        $crisp.push(['set', 'user:email', user.email]);
        $crisp.push(['set', 'user:nickname', user.user_metadata?.full_name || user.email?.split('@')[0]]);
      }
    }
  }, [loaded, user, config]);

  // Log chat interactions
  const logChatEvent = async (eventType: string, metadata?: any) => {
    if (!user) return;

    const supabase = createClient();
    await supabase.from('user_activity').insert({
      user_id: user.id,
      activity_type: `chat_${eventType}`,
      metadata: {
        provider: config?.provider,
        ...metadata,
      },
    }).catch(() => {});
  };

  if (!shouldShow || !config) return null;

  // Tawk.to
  if (config.provider === 'tawk') {
    return (
      <Script
        id="tawk-to-chat"
        strategy="lazyOnload"
        onLoad={() => {
          setLoaded(true);
          logChatEvent('widget_loaded');
        }}
        dangerouslySetInnerHTML={{
          __html: `
            var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
            (function(){
              var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
              s1.async=true;
              s1.src='https://embed.tawk.to/${config.widget_id}';
              s1.charset='UTF-8';
              s1.setAttribute('crossorigin','*');
              s0.parentNode.insertBefore(s1,s0);
            })();
            Tawk_API.onChatStarted = function(){
              window.dispatchEvent(new CustomEvent('tawk-chat-started'));
            };
          `,
        }}
      />
    );
  }

  // Intercom
  if (config.provider === 'intercom') {
    return (
      <Script
        id="intercom-chat"
        strategy="lazyOnload"
        onLoad={() => {
          setLoaded(true);
          logChatEvent('widget_loaded');
        }}
        dangerouslySetInnerHTML={{
          __html: `
            window.intercomSettings = {
              api_base: "https://api-iam.intercom.io",
              app_id: "${config.widget_id}"
            };
            (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/${config.widget_id}';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
          `,
        }}
      />
    );
  }

  // Crisp
  if (config.provider === 'crisp') {
    return (
      <Script
        id="crisp-chat"
        strategy="lazyOnload"
        onLoad={() => {
          setLoaded(true);
          logChatEvent('widget_loaded');
        }}
        dangerouslySetInnerHTML={{
          __html: `
            window.$crisp=[];window.CRISP_WEBSITE_ID="${config.widget_id}";
            (function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();
          `,
        }}
      />
    );
  }

  // Custom script
  if (config.provider === 'custom' && config.custom_script) {
    return (
      <Script
        id="custom-chat"
        strategy="lazyOnload"
        onLoad={() => {
          setLoaded(true);
          logChatEvent('widget_loaded');
        }}
        dangerouslySetInnerHTML={{
          __html: config.custom_script,
        }}
      />
    );
  }

  return null;
}

export default LiveChatWidget;
