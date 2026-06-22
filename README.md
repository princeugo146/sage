# SAGE — Enterprise AI Companion Platform

## Overview

SAGE is a production-grade AI companion platform featuring realistic avatars, advanced memory systems, emotion detection, and sophisticated relationship tracking.

## Architecture

```
┌─────────────────────────────┐
│      Frontend (Next.js)      │
│   React Components + UI      │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│      API Gateway            │
│   Authentication + Routing  │
└─────────────┬───────────────┘
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
  Chat    Avatar    Memory
 Service  Service   Service
    │         │         │
    └────┬────┴────┬────┘
         ▼         ▼
      Claude   ElevenLabs
      API      Voice API
         │
         ▼
      D-ID Avatar
      Streaming

     Database Layer

   ┌────────────────────┐
   │   PostgreSQL       │
   │ (Relationships,    │
   │  Conversations,    │
   │  User Data)        │
   └────────────────────┘

   ┌────────────────────┐
   │ Qdrant Vector DB   │
   │ (Semantic Memory)  │
   └────────────────────┘

   ┌────────────────────┐
   │     Redis          │
   │ (Real-time Cache)  │
   └────────────────────┘
```

## Core Systems

### 1. Memory Engine
- Semantic memory storage using Qdrant vector database
- Intelligent memory scoring based on:
  - Importance (user-defined)
  - Emotion impact
  - Frequency of mention
  - Recency
  - Relationship context
- Automatic context injection into Claude prompts

### 2. Relationship Engine
- Real-time relationship score tracking
- 5 relationship metrics:
  - Trust Score (0-100)
  - Friendship Score (0-100)
  - Humor Score (0-100)
  - Engagement Score (0-100)
  - Attachment Level (0-100)
- Automatic metric updates based on interaction quality
- Relationship stage determination (Acquaintance → Best Friend)

### 3. Emotion Detection
- Multi-source emotion analysis:
  - Text sentiment analysis
  - Voice tone detection (future)
  - Facial expression recognition (future)
- Emotion pattern tracking
- Personality-aware responses

### 4. Avatar System
- D-ID streaming for realistic talking avatars
- Real-time audio-visual synchronization
- 8 pre-built characters across all ages/genders
- Facial expression and gesture animation
- Premium avatar customization

### 5. Voice Synthesis
- ElevenLabs integration for natural voice output
- Age/gender/personality-matched voices
- Voice cloning for premium users
- Real-time voice streaming

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis instance
- Qdrant vector database
- API keys:
  - Anthropic Claude API
  - ElevenLabs API
  - D-ID API

### Installation

```bash
# Clone repository
git clone https://github.com/yourorg/sage.git
cd sage

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed

# Start development server
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` — Create new user
- `POST /api/auth/login` — User login
- `POST /api/auth/logout` — User logout

### Companions
- `GET /api/companions` — List user's companions
- `POST /api/companions` — Create new companion
- `GET /api/companions/:id` — Get companion details
- `PUT /api/companions/:id` — Update companion

### Conversations
- `POST /api/chat` — Send message to companion
- `POST /api/chat/stream` — Stream voice conversation
- `GET /api/conversations/:id` — Get conversation history

### Memory
- `GET /api/memory/:companionId` — Retrieve contextual memories
- `POST /api/memory` — Store new memory

### Avatar
- `POST /api/avatar/stream` — Create avatar video stream
- `POST /api/avatar/expression` — Update avatar expression

## Development

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

## Deployment

### Vercel (Recommended)
```bash
vercel --prod
```

### Docker
```bash
docker build -t sage:latest .
docker run -p 3000:3000 sage:latest
```

## Roadmap

- [ ] Voice input processing (Web Speech API)
- [ ] Real-time video streaming optimization
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)
- [ ] Advanced facial recognition
- [ ] Premium avatar marketplace
- [ ] Memory persistence improvements
- [ ] Group conversations
- [ ] Integration with calendar/productivity apps

## License

MIT

## Support

For issues, feature requests, or questions, please open an issue on GitHub.
