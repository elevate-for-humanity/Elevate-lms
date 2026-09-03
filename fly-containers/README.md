# Studio IDE Container Service

Full Linux container for native binary execution. Runs on Fly.io.

## Features

- Real bash terminal via WebSocket (node-pty)
- Python, Go, Rust, Node.js pre-installed
- File system operations
- Command execution

## Deployment

### 1. Install Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Login to Fly.io

```bash
fly auth login
```

### 3. Create app

```bash
fly apps create elevate-studio-containers
```

### 4. Deploy

```bash
fly deploy
```

### 5. Get URL

Your container service will be available at:
`https://elevate-studio-containers.fly.dev`

## API Endpoints

### Files

- `GET /api/files` - List all files
- `GET /api/file?path=...` - Read file
- `PUT /api/file` - Write file `{ path, content }`
- `DELETE /api/file?path=...` - Delete file

### Commands

- `POST /api/exec` - Execute command `{ command, cwd? }`

### Terminal (WebSocket)

Connect to `wss://elevate-studio-containers.fly.dev/terminal`

Messages:

- Send: `{ type: 'input', data: '...' }` - Send input
- Send: `{ type: 'resize', cols: 80, rows: 24 }` - Resize terminal
- Send: `{ type: 'signal', signal: 'SIGINT' }` - Send signal
- Receive: `{ type: 'output', data: '...' }` - Terminal output
- Receive: `{ type: 'exit', exitCode: 0 }` - Process exited

## Cost

- ~$0.50/month when idle (auto-stop)
- ~$5/month with moderate usage
- Scales automatically

## Integration

Update `.env.local`:

```
NEXT_PUBLIC_CONTAINER_API_URL=https://elevate-studio-containers.fly.dev
```
