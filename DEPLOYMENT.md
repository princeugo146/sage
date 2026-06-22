# SAGE Production Deployment Guide

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Start with Docker Compose
docker-compose up

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Start development server
npm run dev
```

### System Health Check

```bash
npm run healthcheck
```

This validates connections to:
- Claude API
- PostgreSQL Database
- Qdrant Vector Database
- Redis Cache

## Environment Variables

All required environment variables:

```
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/sage_db
REDIS_URL=redis://localhost:6379
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_key

# APIs
ANTHROPIC_API_KEY=sk-ant-xxxxx
ELEVENLABS_API_KEY=xxxxx
OPENAI_API_KEY=sk-xxxxx
DID_API_KEY=Basic xxxxx

# Auth
JWT_SECRET=your_secret_key
JWT_EXPIRATION=7d

# App
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-domain.com
```

## Deployment Options

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Note:** Vercel handles serverless functions for `/api` routes automatically.

For external services (PostgreSQL, Redis, Qdrant), use:
- **PostgreSQL**: AWS RDS or DigitalOcean Managed Databases
- **Redis**: Redis Cloud or DigitalOcean Managed Databases
- **Qdrant**: Qdrant Cloud or self-hosted

### Option 2: Docker + Railway/Render

```bash
# Build Docker image
docker build -t sage:latest .

# Push to registry
docker tag sage:latest your-registry/sage:latest
docker push your-registry/sage:latest
```

Then deploy on:
- [Railway](https://railway.app)
- [Render](https://render.com)
- [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform)

### Option 3: Self-Hosted

```bash
# Clone and setup
git clone <repo>
cd sage
npm install
npm run build

# Start
NODE_ENV=production npm start
```

## Architecture for Production

```
Internet
   |
   v
Load Balancer (Vercel / Nginx)
   |
   +---> Vercel Edge Functions (API)
   |
   +---> Distributed Database
         - PostgreSQL Replica Set
         - Redis Cluster
         - Qdrant Multi-node
```

## Monitoring & Observability

### Recommended Tools

- **Error Tracking**: Sentry
- **Performance**: New Relic or Datadog
- **Logs**: LogRocket or ELK Stack
- **Database**: Datadog APM

### Health Checks

```bash
curl https://your-domain.com/api/health
```

## Security Checklist

- [ ] Set strong JWT_SECRET
- [ ] Use HTTPS only
- [ ] Enable database backups
- [ ] Implement rate limiting
- [ ] Use environment variables for all secrets
- [ ] Enable CORS correctly
- [ ] Implement input validation
- [ ] Use prepared statements (Drizzle ORM handles this)
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Scaling Considerations

### Horizontal Scaling
- API is stateless → easily scalable
- Use load balancer to distribute traffic
- Session data stored in Redis → shared across instances

### Vertical Scaling
- Increase database connection pool
- Cache frequently accessed data in Redis
- Use database indexes strategically

### Database Optimization
- Enable WAL (Write-Ahead Logging)
- Regular VACUUM operations
- Monitor slow queries
- Optimize indexes

## Cost Optimization

### API Usage
- **Claude**: ~$0.003 per conversation
- **ElevenLabs**: Free tier (10k chars/month)
- **D-ID**: $0.10 per minute of avatar video

### Infrastructure
- Vercel: $0 (free tier) or $20/month (pro)
- PostgreSQL: AWS RDS starts at ~$15/month
- Redis: Redis Cloud starts at $7/month
- Qdrant: Free self-hosted or ~$25/month cloud

## Rollback Strategy

```bash
# Vercel
vercel rollback

# Docker
docker stop sage
docker run -d --name sage your-registry/sage:previous-tag
```

## Support & Maintenance

- Monitor system health daily
- Review error logs weekly
- Update dependencies monthly
- Conduct security audit quarterly
- Backup database daily

## Contact

For production issues, check:
1. System health check
2. API logs
3. Database logs
4. Sentry error tracking
5. Infrastructure provider dashboard
