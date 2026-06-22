# SAGE Implementation Guide

Complete step-by-step instructions to get your AI companion platform live in production.

---

## Phase 1: Setup & Configuration (30 minutes)

### Step 1: Clone the Repository
```bash
git clone https://github.com/princeugo146/sage.git
cd sage
git checkout production-system
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Setup Environment Variables

Create `.env.local` with all API keys:

```bash
cp .env.example .env.local
```

Now edit `.env.local` and add your keys:

#### **Required API Keys** (get these first)

1. **Anthropic Claude API** → https://console.anthropic.com
   ```
   ANTHROPIC_API_KEY=sk-ant-XXXXX
   ```

2. **OpenAI (for embeddings)** → https://platform.openai.com
   ```
   OPENAI_API_KEY=sk-XXXXX
   ```

3. **ElevenLabs (voice)** → https://elevenlabs.io
   ```
   ELEVENLABS_API_KEY=xxxxx
   ```

4. **D-ID (avatars)** → https://www.d-id.com
   ```
   DID_API_KEY=Basic xxxxx
   ```

5. **JWT Secret (create your own)**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   ```
   JWT_SECRET=<output from above>
   ```

#### **Database URLs** (configure below)

```
DATABASE_URL=postgresql://user:pass@localhost:5432/sage_db
REDIS_URL=redis://localhost:6379
QDRANT_URL=http://localhost:6333
```

---

## Phase 2: Local Development Setup (45 minutes)

### Step 4: Start Services with Docker Compose

```bash
docker-compose up
```

This starts:
- ✅ PostgreSQL (port 5432)
- ✅ Redis (port 6379)
- ✅ Qdrant (port 6333)

**Wait for all services to be ready** (look for "ready to accept connections")

### Step 5: Run Database Migrations

In a new terminal:

```bash
npm run db:migrate
```

This creates all tables in PostgreSQL.

### Step 6: Seed Test Data

```bash
npm run db:seed
```

Creates a test user and companion:
- Email: `test@example.com`
- Password: `password`

### Step 7: Run Health Check

```bash
npm run healthcheck
```

This validates all connections:
```
✓ Claude API connected
✓ PostgreSQL connected
✓ Qdrant connected
✓ Redis connected
```

If all pass, proceed! If any fail, check the error messages.

### Step 8: Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 and sign in with test credentials.

---

## Phase 3: Feature Implementation (2-3 hours)

### Feature 1: Voice Input Processing

**Goal**: Allow users to record voice messages

Create `src/hooks/useVoiceInput.ts`:
```typescript
import { useRef } from 'react';

export function useVoiceInput() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.start();
  };

  const stopRecording = async (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
          chunksRef.current = [];
          resolve(audioBlob);
        };
        mediaRecorderRef.current.stop();
      }
    });
  };

  return { startRecording, stopRecording };
}
```

Update `src/pages/chat/[companionId].tsx` to add voice button:
```typescript
const { startRecording, stopRecording } = useVoiceInput();
const [isRecording, setIsRecording] = useState(false);

const handleVoiceMessage = async () => {
  if (!isRecording) {
    setIsRecording(true);
    await startRecording();
  } else {
    const audioBlob = await stopRecording();
    // Send to API
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('companionId', companionId);
    
    const response = await fetch('/api/chat/voice', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    setIsRecording(false);
  }
};
```

Create `src/pages/api/chat/voice.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/middleware/auth';
import axios from 'axios';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  try {
    // Parse multipart form data
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const companionId = formData.get('companionId') as string;

    // Convert to base64 for OpenAI Whisper
    const buffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(buffer).toString('base64');

    // Transcribe with OpenAI Whisper
    const transcriptionResponse = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      { audio: base64Audio, model: 'whisper-1' },
      { headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` } }
    );

    const transcribedText = transcriptionResponse.data.text;

    // Send to chat as normal message
    // ... (same logic as /api/chat)
    return NextResponse.json({ transcription: transcribedText });
  } catch (error) {
    console.error('Voice processing error:', error);
    return NextResponse.json({ error: 'Voice processing failed' }, { status: 500 });
  }
}
```

### Feature 2: Real-time WebSocket Chat

**Goal**: Stream responses in real-time

Create `src/lib/websocket-client.ts`:
```typescript
export function createWebSocketConnection(token: string) {
  const ws = new WebSocket(`wss://your-domain.com/api/ws?token=${token}`);

  ws.onopen = () => console.log('Connected');
  ws.onerror = (error) => console.error('WebSocket error:', error);

  return {
    send: (data: any) => ws.send(JSON.stringify(data)),
    on: (event: string, callback: Function) => {
      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.type === event) callback(data);
      };
    },
    close: () => ws.close(),
  };
}
```

### Feature 3: Avatar Video Rendering

**Goal**: Display D-ID avatar with speech sync

Create `src/components/AvatarView.tsx`:
```typescript
import { useEffect, useRef } from 'react';

interface AvatarViewProps {
  streamId: string;
  audioUrl?: string;
}

export function AvatarView({ streamId, audioUrl }: AvatarViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Fetch stream from D-ID
    fetch(`https://api.d-id.com/streams/${streamId}`)
      .then((res) => res.json())
      .then((data) => {
        if (videoRef.current) {
          videoRef.current.src = data.stream_url;
        }
      });

    // Sync audio
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  }, [streamId, audioUrl]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className="w-full rounded-lg"
        autoPlay
        playsInline
      />
      <audio ref={audioRef} hidden />
    </div>
  );
}
```

---

## Phase 4: Testing (30 minutes)

### Step 9: Test Complete Flow

1. **Login**: test@example.com / password
2. **Create Companion**: Click "Add Companion" (Alex)
3. **Send Message**: "Hello Alex, my favorite hobby is coding"
4. **Check Memory**: Response should reference coding in future messages
5. **Check Relationship**: Trust/Friendship scores should increase

### Step 10: Load Testing

```bash
npm run build
npm run start
```

Test with multiple concurrent requests:
```bash
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/chat \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"companionId":"xxx","message":"Hello"}' &
done
```

---

## Phase 5: Production Deployment (2 hours)

### Option A: Deploy to Vercel (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Setup external services first
# Go to Vercel Dashboard → Storage → Create database
# - PostgreSQL (Vercel Postgres)
# - Redis (Upstash Redis)
```

Update `.env.production`:
```
DATABASE_URL=<vercel-postgres-url>
REDIS_URL=<upstash-redis-url>
QDRANT_URL=<qdrant-cloud-url>
QDRANT_API_KEY=<api-key>
```

Deploy:
```bash
vercel --prod
```

### Option B: Deploy to Railway

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Create project
railway init

# 4. Add PostgreSQL
railway add --plugin postgres

# 5. Add Redis
railway add --plugin redis

# 6. Deploy
railway up
```

### Option C: Deploy to Render

1. Push code to GitHub
2. Go to https://render.com
3. Create new Web Service
4. Connect GitHub repo
5. Select `production-system` branch
6. Add environment variables
7. Deploy

---

## Phase 6: Monitoring & Scaling

### Step 11: Setup Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
```

`src/pages/_app.tsx`:
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Step 12: Database Optimization

Enable proper indexes:
```sql
CREATE INDEX idx_memories_user_companion ON memories(user_id, companion_id);
CREATE INDEX idx_conversations_created ON conversations(created_at DESC);
```

### Step 13: Caching Strategy

Update `src/lib/memory-engine.ts`:
```typescript
const redis = createClient({ url: process.env.REDIS_URL });

async function getContextualMemories(...) {
  const cacheKey = `memories:${userId}:${companionId}:${query}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const memories = await searchMemories(...);
  await redis.setEx(cacheKey, 300, JSON.stringify(memories)); // 5 min cache
  
  return memories;
}
```

---

## Phase 7: Advanced Features (Optional)

### Add Multi-Language Support

Install i18n:
```bash
npm install next-i18next i18next
```

### Add Analytics

```bash
npm install posthog-js
```

### Add Websockets

```bash
npm install ws socket.io
```

### Add Mobile App

```bash
npx create-expo-app sage-mobile
npm install expo-constants axios
```

---

## Troubleshooting Guide

### Claude API Connection Failed
```
Error: 401 Unauthorized

Solution: Check ANTHROPIC_API_KEY is correct
vercel env pull  # Get live vars
```

### Database Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:5432

Solution: Ensure Docker is running
docker-compose ps
docker-compose restart postgres
```

### Memory Engine Not Working
```
Error: Qdrant connection refused

Solution: Check Qdrant is running
curl http://localhost:6333/health
```

### Build Fails with TypeScript Errors
```
npm run type-check  # See all errors
# Fix issues, then rebuild
npm run build
```

---

## Quick Reference Commands

| Task | Command |
|------|---------|
| Start local dev | `docker-compose up && npm run dev` |
| Run health check | `npm run healthcheck` |
| Build for production | `npm run build` |
| Deploy to Vercel | `vercel --prod` |
| View logs | `vercel logs` |
| Check database | `psql $DATABASE_URL` |
| Test API | `curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/companions` |

---

## Success Checklist

- [ ] All dependencies installed
- [ ] All API keys configured
- [ ] Docker services running
- [ ] Database migrations complete
- [ ] Health check passes
- [ ] Test user account works
- [ ] Can chat with companion
- [ ] Relationship scores update
- [ ] Memories are stored
- [ ] Deployed to production
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Error tracking working
- [ ] Monitoring setup

---

## Next Steps After Going Live

1. **Day 1**: Monitor error logs, fix any bugs
2. **Week 1**: Gather user feedback, optimize performance
3. **Month 1**: Add premium features, expand character library
4. **Quarter 1**: Mobile app launch, API for third parties

---

## Support Resources

- **Documentation**: `/README.md`
- **Deployment Guide**: `/DEPLOYMENT.md`
- **Development Guide**: `/DEVELOPMENT.md`
- **API Docs**: Check inline comments in `/src/pages/api/`

**You're ready to launch! 🚀**
