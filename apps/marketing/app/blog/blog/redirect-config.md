# Blog Redirect Configuration

## Option 1: DNS CNAME (Recommended)

Set up a CNAME record in your DNS:

```
blog.www.elevateforhumanity.org CNAME your-durable-blog.durable.co
```

## Option 2: Next.js Redirect

Add to `next.config.mjs`:

```javascript
async redirects() {
  return [
    {
      source: '/blog',
      destination: 'https://your-durable-blog.durable.co',
      permanent: false,
    },
    {
      source: '/blog/:path*',
      destination: 'https://your-durable-blog.durable.co/:path*',
      permanent: false,
    },
  ]
}
```

## Option 3: Reverse Proxy

Use Next.js rewrites to proxy Durable blog:

```javascript
async rewrites() {
  return [
    {
      source: '/blog/:path*',
      destination: 'https://your-durable-blog.durable.co/:path*',
    },
  ]
}
```

## Current Setup

The blog page currently:

- Fetches from Supabase `blog_posts` table
- Shows social media fallback if no posts
- Can be replaced with any of the above options

## To Implement

1. Get your Durable blog URL
2. Choose option above
3. Update configuration
4. Test redirect/proxy
