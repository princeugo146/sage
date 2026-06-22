import { NextRequest, NextResponse } from 'next/server';
import { claudeService } from '@/lib/claude-service';
import { emotionDetector } from '@/lib/emotion-detector';
import { relationshipEngine } from '@/lib/relationship-engine';
import { memoryEngine } from '@/lib/memory-engine';
import { verifyToken } from '@/middleware/auth';
import { getCharacter } from '@/lib/characters';
import { db } from '@/db/drizzle';
import { messages, conversations } from '@/db/schema';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { companionId, message, conversationId } = await req.json();

    if (!companionId || !message) {
      return NextResponse.json(
        { error: 'Missing companionId or message' },
        { status: 400 }
      );
    }

    // Get companion
    const companion = await db.query.companions.findFirst({
      where: (t) => t.id as any,
    });

    if (!companion) {
      return NextResponse.json(
        { error: 'Companion not found' },
        { status: 404 }
      );
    }

    const characterDef = getCharacter(companion.id);
    if (!characterDef) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    // Detect emotion
    const emotionMetrics = await emotionDetector.detectFromText(message);
    await emotionDetector.storeEmotionDetection(decoded.userId, emotionMetrics);

    // Generate response
    const response = await claudeService.chat(message, {
      userId: decoded.userId,
      companionId,
      companionName: characterDef.name,
      personality: {
        name: characterDef.name,
        traits: characterDef.traits,
        communicationStyle: characterDef.communicationStyle,
        expertise: characterDef.expertise,
        humor: characterDef.humor,
      },
      userName: 'User', // Would fetch from user table
    });

    // Extract memories
    const extractedMemories = await claudeService.extractMemories(message, response);
    for (const mem of extractedMemories) {
      await memoryEngine.storeMemory(
        decoded.userId,
        companionId,
        mem.text,
        mem.category,
        emotionMetrics.emotion,
        mem.importance
      );
    }

    // Update relationship
    const interactionScore = relationshipEngine.scoreInteraction(
      message.length,
      emotionMetrics.emotion !== 'neutral',
      false,
      0.5
    );
    await relationshipEngine.updateRelationship(decoded.userId, companionId, interactionScore);

    // Save messages to conversation
    if (conversationId) {
      await db.insert(messages).values({
        id: undefined as any,
        conversationId: conversationId as any,
        sender: 'user',
        content: message,
        emotion: emotionMetrics.emotion,
        timestamp: new Date(),
      });

      await db.insert(messages).values({
        id: undefined as any,
        conversationId: conversationId as any,
        sender: 'companion',
        content: response,
        emotion: emotionMetrics.emotion,
        timestamp: new Date(),
      });
    }

    return NextResponse.json({
      message: response,
      emotion: emotionMetrics.emotion,
      memoryInsights: extractedMemories.length > 0 ? 'Memories stored' : undefined,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
