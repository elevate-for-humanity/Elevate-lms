export function GET(){return Response.json({
  "id": "org.elevateforhumanity.phone",
  "name": "Elevate Phone",
  "short_name": "Phone",
  "description": "Elevate phone dial pad and voicemail",
  "start_url": "/communications/phone",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1E3A5F",
  "icons": [
    {
      "src": "https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/icons/student-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/icons/student-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/icons/student-512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Phone & ringer",
      "short_name": "Phone & ringer",
      "description": "Open the dial pad and incoming call alert controls.",
      "url": "/communications/phone#incoming-call-alert-mode",
      "icons": [
        {
          "src": "https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/icons/student-192.png",
          "sizes": "192x192",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "Text messages",
      "short_name": "Texts",
      "url": "/communications/texts",
      "icons": [
        {
          "src": "https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/icons/student-192.png",
          "sizes": "192x192",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "Interoffice email",
      "short_name": "Email",
      "url": "/communications/email",
      "icons": [
        {
          "src": "https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/icons/student-192.png",
          "sizes": "192x192",
          "type": "image/png"
        }
      ]
    }
  ]
},{headers:{'Content-Type':'application/manifest+json'}});}
