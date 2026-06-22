import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/middleware/auth';
import { memoryEngine } from '@/lib/memory-engine';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const companionId = searchParams.get('companionId');
    const query = searchParams.get('query') || '';

    if (!companionId) {
      return NextResponse.json(
        { error: 'Missing companionId' },
        { status: 400 }
      );
    }

    // Get contextual memories
    const memories = await memoryEngine.getContextualMemories(
      decoded.userId,
      companionId,
      query,
      2000
    );

    return NextResponse.json({
      memories: memories.map((m) => ({
        id: m.id,
        text: m.text,
        score: m.score,
        importance: m.importance,
        emotion: m.emotion,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error('Memory retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { companionId, memoryText, category, emotion, importance } = await req.json();

    if (!companionId || !memoryText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const memoryId = await memoryEngine.storeMemory(
      decoded.userId,
      companionId,
      memoryText,
      category || 'other',
      emotion,
      importance || 0.5
    );

    return NextResponse.json(
      { id: memoryId, message: 'Memory stored' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Memory storage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
