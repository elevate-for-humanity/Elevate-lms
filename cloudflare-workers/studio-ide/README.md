# Studio IDE - Cloudflare Workers Backend

Full development environment backend for the Elevate LMS admin panel.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Admin Panel (Next.js on Netlify)                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Monaco Editor + WebContainer (for npm/node preview)    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare Workers (studio-api.elevateforhumanity.org)     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Workspace   │  │   Terminal   │  │     Git      │      │
│  │   Durable    │  │   Durable    │  │   Routes     │      │
│  │   Object     │  │   Object     │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           │                │                │               │
│           ▼                ▼                ▼               │
│  ┌──────────────────────────────────────────────────┐      │
│  │  R2 (File Storage)  │  D1 (Metadata)             │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Features

- **Persistent File Storage**: Files stored in R2, survive page refresh
- **Real Terminal**: Durable Objects maintain terminal state
- **Git Integration**: Clone repos, track changes
- **Collaborative Editing**: WebSocket-based real-time sync
- **WebContainer Integration**: npm/node commands run client-side for instant preview

## Setup

### 1. Install dependencies

```bash
cd cloudflare-workers/studio-ide
npm install
```

### 2. Create Cloudflare resources

```bash
# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create elevate-studio

# Create R2 bucket
npx wrangler r2 bucket create elevate-studio-files

# Create KV namespace
npx wrangler kv:namespace create STUDIO_META
```

### 3. Update wrangler.toml

Replace the placeholder IDs with the actual IDs from step 2:

```toml
[[d1_databases]]
binding = "STUDIO_DB"
database_name = "elevate-studio"
database_id = "YOUR_D1_DATABASE_ID"

[[kv_namespaces]]
binding = "STUDIO_META"
id = "YOUR_KV_NAMESPACE_ID"
```

### 4. Run migrations

```bash
npx wrangler d1 execute elevate-studio --file=./schema.sql
```

### 5. Deploy

```bash
npm run deploy
```

### 6. Configure DNS

Add a CNAME record in Cloudflare DNS:

- Name: `studio-api`
- Target: Your worker URL

## API Endpoints

### Workspaces

- `GET /api/workspace` - List user's workspaces
- `POST /api/workspace` - Create workspace
- `GET /api/workspace/:id` - Get workspace details
- `DELETE /api/workspace/:id` - Delete workspace

### Files

- `GET /api/files?workspace=ID&path=PATH&list=true` - List files
- `GET /api/files?workspace=ID&path=PATH` - Read file
- `PUT /api/files?workspace=ID&path=PATH` - Write file
- `DELETE /api/files?workspace=ID&path=PATH` - Delete file

### Terminal

- `POST /api/terminal/exec?workspace=ID` - Execute command
- `WS /api/terminal/connect?workspace=ID` - WebSocket terminal

### Git

- `POST /api/git/clone?workspace=ID` - Clone repository

## Local Development

```bash
npm run dev
```

This starts the worker locally at `http://localhost:8787`.

## Environment Variables

Set in Cloudflare dashboard or wrangler.toml:

- `ENVIRONMENT` - "development" or "production"
- `MAX_FILE_SIZE` - Max file size in bytes (default: 10MB)
- `MAX_WORKSPACE_SIZE` - Max workspace size in bytes (default: 100MB)
