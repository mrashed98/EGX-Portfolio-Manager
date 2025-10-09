# Docker Setup Guide

This project provides two Docker Compose configurations:

## 1. Development Mode (Recommended for Getting Started)

**File**: `docker-compose.dev.yml`

This mode mounts your local code as volumes, enabling hot-reload for both frontend and backend.

### Start Development Environment

```bash
docker-compose -f docker-compose.dev.yml up --build
```

**Features:**
- ✅ Hot reload for backend (FastAPI)
- ✅ Hot reload for frontend (Next.js dev mode)
- ✅ Code changes reflect immediately
- ✅ Faster iteration
- ✅ No rebuild needed for code changes

**Ports:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- PostgreSQL: localhost:5432

### Stop Services

```bash
docker-compose -f docker-compose.dev.yml down
```

### Reset Database

```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

## 2. Production Mode

**File**: `docker-compose.yml`

This mode builds optimized production images with standalone Next.js output.

### Build and Start

```bash
docker-compose up --build
```

**Features:**
- ✅ Optimized production builds
- ✅ Smaller image sizes
- ✅ Better performance
- ✅ Multi-stage Docker builds

**Note**: Any code changes require rebuilding:
```bash
docker-compose up --build
```

## Common Commands

### View Logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend
```

### Execute Commands in Containers

```bash
# Backend shell
docker-compose -f docker-compose.dev.yml exec backend sh

# Frontend shell
docker-compose -f docker-compose.dev.yml exec frontend sh

# Database shell
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d portfolio_db
```

### Database Migrations

```bash
# Create migration
docker-compose -f docker-compose.dev.yml exec backend alembic revision --autogenerate -m "description"

# Apply migrations
docker-compose -f docker-compose.dev.yml exec backend alembic upgrade head

# Rollback
docker-compose -f docker-compose.dev.yml exec backend alembic downgrade -1
```

## Troubleshooting

### Frontend Build Errors

If you see `.next/standalone` not found errors, use development mode:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Port Already in Use

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill

# Find and kill process on port 8000
lsof -ti:8000 | xargs kill
```

### Clean Everything and Restart

```bash
# Stop and remove everything
docker-compose -f docker-compose.dev.yml down -v
docker system prune -a

# Restart fresh
docker-compose -f docker-compose.dev.yml up --build
```

### Database Connection Issues

```bash
# Check PostgreSQL is healthy
docker-compose -f docker-compose.dev.yml ps

# Restart database
docker-compose -f docker-compose.dev.yml restart postgres

# View database logs
docker-compose -f docker-compose.dev.yml logs postgres
```

## Recommended Workflow

1. **First Time Setup:**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **Daily Development:**
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```
   
3. **When Finished:**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

4. **Production Testing:**
   ```bash
   docker-compose up --build
   ```

## Performance Tips

- Use `docker-compose.dev.yml` for development (faster)
- Use `docker-compose.yml` for production testing
- On Mac/Windows, consider Docker Desktop resource limits
- Use `.dockerignore` to exclude unnecessary files

## Next Steps

After starting the services:

1. Visit http://localhost:3000
2. Register a new account
3. Start creating portfolios and strategies
4. Check API docs at http://localhost:8000/docs

