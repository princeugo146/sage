# SAGE — Production Development Guidelines

## Code Organization

```
sage/
├── src/
│   ├── app/              # Next.js app directory
│   ├── pages/            # API routes and pages
│   │   ├── api/          # Backend API endpoints
│   │   └── ...           # Frontend pages
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Business logic
│   ├── db/               # Database
│   ├── middleware/       # Auth, CORS, etc
│   ├── types/            # TypeScript types
│   └── utils/            # Utilities
├── scripts/              # Utility scripts
├── public/               # Static assets
└── docker-compose.yml    # Local dev infrastructure
```

## Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes**
   - Write tests
   - Follow TypeScript best practices
   - Use existing patterns

3. **Test locally**
   ```bash
   npm run type-check
   npm run lint
   npm run test
   ```

4. **Commit with clear messages**
   ```bash
   git commit -m "feat: description of change"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/my-feature
   ```

## Core Systems

### 1. Memory Engine (`src/lib/memory-engine.ts`)
Handles semantic memory storage and retrieval using Qdrant vector database.

**Key Methods:**
- `storeMemory()` - Save new memory with embedding
- `searchMemories()` - Find memories by semantic similarity
- `getContextualMemories()` - Get memories for AI prompt injection

### 2. Claude Service (`src/lib/claude-service.ts`)
Manages Claude API interactions with personality injection.

**Key Methods:**
- `chat()` - Generate intelligent responses
- `detectEmotion()` - Analyze user emotion
- `extractMemories()` - Parse memorable information

### 3. Relationship Engine (`src/lib/relationship-engine.ts`)
Tracks and updates relationship metrics.

**Key Methods:**
- `initializeRelationship()` - Setup new relationship
- `updateRelationship()` - Modify scores
- `scoreInteraction()` - Calculate metric changes
- `getRelationshipSummary()` - Get relationship status

### 4. Emotion Detector (`src/lib/emotion-detector.ts`)
Multi-source emotion analysis.

**Sources:**
- Text (Claude-based)
- Voice (placeholder)
- Facial (placeholder)

### 5. Voice Service (`src/lib/elevenlabs-service.ts`)
Text-to-speech with age/gender matching.

### 6. Avatar Service (`src/lib/did-service.ts`)
D-ID streaming for realistic avatars.

## Adding New Features

### Add New API Endpoint

1. Create file: `src/pages/api/feature.ts`
2. Use authentication middleware
3. Return proper status codes
4. Example:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/middleware/auth';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  // Your logic here
  return NextResponse.json({ data: {} });
}
```

### Add New Database Table

1. Update `src/db/schema.ts`
2. Run: `npm run db:migrate`
3. Use Drizzle ORM for queries

### Add New Character

Update `src/lib/characters.ts`:

```typescript
export const CHARACTERS = {
  // ..existing
  newchar: {
    id: 'newchar',
    name: 'Name',
    // ... properties
  },
};
```

## Testing

```bash
# Unit tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint

# System health
npm run healthcheck
```

## Performance Tips

1. **Memory Engine**: Results cached in Redis for 5 minutes
2. **Claude API**: Use streaming for long responses
3. **Database**: Indexed frequently queried fields
4. **Frontend**: Lazy load components

## Error Handling

All services have try-catch blocks:

```typescript
try {
  // Operation
} catch (error) {
  console.error('Context:', error);
  return NextResponse.json(
    { error: 'User-friendly message' },
    { status: 500 }
  );
}
```

## Logging Standards

```typescript
// Error
console.error('Failed to fetch user:', error);

// Info
console.log('User created:', userId);

// Debug (only in development)
if (process.env.DEBUG) {
  console.log('Debug info:', data);
}
```

## Next Steps

1. Complete all API endpoints
2. Add voice input processing
3. Implement WebSocket for real-time chat
4. Add unit/integration tests
5. Setup CI/CD pipeline
6. Deploy to staging environment
7. Performance testing and optimization
8. Production rollout with monitoring

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [Claude API](https://docs.anthropic.com)
- [ElevenLabs API](https://elevenlabs.io/docs)
- [D-ID API](https://docs.d-id.com)

## Questions?

Refer to the main README.md or check existing code for patterns.
