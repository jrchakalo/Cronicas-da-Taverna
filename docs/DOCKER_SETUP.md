# Documento legado

Este guia foi mantido apenas por histórico. Para o deploy atual, consulte [docs/DEPLOY.md](docs/DEPLOY.md).

# Docker Configuration Guide

## Overview

This document explains the Docker configuration for our Tech Challenge Blog application, including intentional issues that candidates should identify and fix.

## Docker Architecture

```
┌─────────────────────────────────────────────────────┐
│                Docker Network                        │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ PostgreSQL  │  │   Backend   │  │  Frontend   │ │
│  │ Container   │  │  Container  │  │  Container  │ │
│  │             │  │             │  │             │ │
│  │ Port: 5432  │  │ Port: 3001  │  │ Port: 3000  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Current Configuration (docker-compose.yml)

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: tech-challenge-db
    environment:
      POSTGRES_DB: tech_challenge_blog
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - tech-challenge-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: tech-challenge-backend
    environment:
      NODE_ENV: development
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: tech_challenge_blog
      DB_USER: admin
      DB_PASSWORD: password123
      JWT_SECRET: your-super-secret-jwt-key-here
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    volumes:
      - ./backend:/app
      - /app/node_modules
    networks:
      - tech-challenge-network
    # ISSUE: Missing restart policy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: tech-challenge-frontend
    environment:
      REACT_APP_API_URL: http://localhost:3001
    ports:
      - "3000:3000"
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules
    networks:
      - tech-challenge-network

volumes:
  postgres_data:

networks:
  tech-challenge-network:
    driver: bridge
```

## Intentional Issues for Evaluation

### 1. Missing Restart Policies

**Issue**: Containers don't automatically restart on failure.

**Fix**:

```yaml
services:
  postgres:
    # ... other config
    restart: unless-stopped

  backend:
    # ... other config
    restart: unless-stopped

  frontend:
    # ... other config
    restart: unless-stopped
```

### 2. No Health Checks

**Issue**: Docker doesn't know if services are actually healthy.

**Fix**:

```yaml
services:
  postgres:
    # ... other config
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d tech_challenge_blog"]
      interval: 30s
      timeout: 10s
      retries: 5

  backend:
    # ... other config
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 40s

  frontend:
    # ... other config
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 5
```

### 3. Inefficient Dockerfile Layers

**Backend Dockerfile Issues**:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# ISSUE: Copying everything before installing dependencies
COPY . .

# ISSUE: Using npm ci in production but copying dev files
RUN npm ci --only=production

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

**Fixed Backend Dockerfile**:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership to nodejs user
CHOWN nodejs:nodejs /app
USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["npm", "start"]
```

### 4. Security Issues

**Issues**:

- Running as root user
- Exposing sensitive environment variables
- No secrets management

**Fixes**:

```yaml
services:
  backend:
    # ... other config
    environment:
      NODE_ENV: development
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: tech_challenge_blog
      DB_USER: admin
      # Use Docker secrets instead of plain text
    secrets:
      - db_password
      - jwt_secret
    user: "nodejs:nodejs"

secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

### 5. Missing Resource Limits

**Issue**: Containers can consume unlimited resources.

**Fix**:

```yaml
services:
  postgres:
    # ... other config
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "0.5"
        reservations:
          memory: 256M
          cpus: "0.25"

  backend:
    # ... other config
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: "0.3"
        reservations:
          memory: 128M
          cpus: "0.1"
```

## Docker Commands

### Basic Commands

```bash
# Build and start all services
docker-compose up -d

# Build with force rebuild
docker-compose up -d --build

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Execute command in running container
docker-compose exec backend bash

# View running containers
docker-compose ps
```

### Development Commands

```bash
# Start only database
docker-compose up -d postgres

# Rebuild specific service
docker-compose build backend

# Scale services (if needed)
docker-compose up -d --scale backend=2

# View resource usage
docker stats
```

### Production Commands

```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d

# Update images
docker-compose pull
docker-compose up -d

# Backup database
docker-compose exec postgres pg_dump -U admin tech_challenge_blog > backup.sql

# Restore database
docker-compose exec -i postgres psql -U admin tech_challenge_blog < backup.sql
```

## Multi-Stage Builds

### Optimized Frontend Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy build files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

## Environment-Specific Configurations

### docker-compose.dev.yml

```yaml
version: "3.8"

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      NODE_ENV: development
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      NODE_ENV: development
    command: npm start
```

### docker-compose.prod.yml

```yaml
version: "3.8"

services:
  postgres:
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: "1"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    environment:
      NODE_ENV: production
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "0.5"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: "0.25"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
```

## Docker Networking

### Custom Networks

```yaml
networks:
  frontend-network:
    driver: bridge
  backend-network:
    driver: bridge
  database-network:
    driver: bridge
    internal: true # Database not accessible from outside

services:
  frontend:
    networks:
      - frontend-network

  backend:
    networks:
      - frontend-network
      - backend-network
      - database-network

  postgres:
    networks:
      - database-network
```

## Monitoring and Logging

### Logging Configuration

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service=backend"

  postgres:
    logging:
      driver: "syslog"
      options:
        syslog-address: "tcp://localhost:514"
        tag: "postgres"
```

### Monitoring with Health Checks

```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 40s
    depends_on:
      postgres:
        condition: service_healthy
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**

```bash
# Check what's using the port
lsof -i :3000
netstat -tulpn | grep :3000

# Kill process using port
kill -9 $(lsof -ti:3000)
```

2. **Volume Issues**

```bash
# Remove all volumes
docker-compose down -v

# Remove specific volume
docker volume rm tech-challenge_postgres_data
```

3. **Network Issues**

```bash
# List networks
docker network ls

# Inspect network
docker network inspect tech-challenge_tech-challenge-network

# Remove network
docker network rm tech-challenge_tech-challenge-network
```

4. **Permission Issues**

```bash
# Fix file permissions
sudo chown -R $USER:$USER ./backend/node_modules
sudo chown -R $USER:$USER ./frontend/node_modules
```

## Best Practices

### 1. Use .dockerignore

```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.cache
dist
```

### 2. Multi-stage Builds

- Separate build and runtime environments
- Smaller production images
- Better security

### 3. Health Checks

- Monitor service availability
- Enable automatic restarts
- Better orchestration

### 4. Resource Limits

- Prevent resource exhaustion
- Improve system stability
- Better resource planning

### 5. Secrets Management

- Never hardcode secrets
- Use Docker secrets or external systems
- Rotate secrets regularly

This documentation highlights the Docker configuration issues that candidates should identify and provides solutions for a production-ready setup.
