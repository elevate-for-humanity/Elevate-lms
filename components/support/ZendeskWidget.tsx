"use client";

import React from 'react';
// components/support/ZendeskWidget.tsx

import { useEffect } from "react";

declare global {
  interface Window {
    zE?: any;
  }
}

export function ZendeskWidget({
  user,
}: {
  user?: { id: string; email: string; name?: string };
}) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_ZENDESK_KEY) return;

    const script = document.createElement("script");
    script.id = "ze-snippet";
    script.src = `https://static.zdassets.com/ekr/snippet.js?key=${process.env.NEXT_PUBLIC_ZENDESK_KEY}`;
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.zE && user) {
        window.zE("webWidget", "identify", {
          name: user.name || user.email,
          email: user.email,
        });
      }
    };

    return () => {
      const existingScript = document.getElementById("ze-snippet");
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [user]);

  return null;
}
