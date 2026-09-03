# Studio IDE Container - Full Linux environment
# Supports native binaries, Python, Go, Rust, etc.

FROM node:20-bookworm

# Install common development tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    vim \
    nano \
    build-essential \
    python3 \
    python3-pip \
    python3-venv \
    golang-go \
    rustc \
    cargo \
    postgresql-client \
    redis-tools \
    jq \
    htop \
    tree \
    zip \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install global npm packages
RUN npm install -g \
    typescript \
    ts-node \
    nodemon \
    pm2 \
    pnpm \
    yarn

# Create workspace directory (consistent with /app used in Northflank builds)
WORKDIR /app

# Copy server code
COPY server.js package.json ./
RUN npm install --production

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start server
CMD ["node", "server.js"]
