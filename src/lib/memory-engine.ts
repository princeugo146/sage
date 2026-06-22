import { QdrantClient } from '@qdrant/js-client';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/db/drizzle';
import { memories } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
});

const COLLECTION_NAME = 'sage_memories';

interface MemoryScoreFactors {
  importanceScore: number; // 0-1
  emotionScore: number; // 0-1
  frequencyScore: number; // 0-1
  recencyScore: number; // 0-1
  relationshipScore: number; // 0-1
}

interface ScoredMemory {
  id: string;
  text: string;
  score: number;
  importance: number;
  emotion: string;
  createdAt: Date;
}

class MemoryEngine {
  /**
   * Calculate comprehensive memory score
   */
  private calculateMemoryScore(factors: MemoryScoreFactors): number {
    const weights = {
      importance: 0.35,
      emotion: 0.25,
      frequency: 0.2,
      recency: 0.15,
      relationship: 0.05,
    };

    return (
      factors.importanceScore * weights.importance +
      factors.emotionScore * weights.emotion +
      factors.frequencyScore * weights.frequency +
      factors.recencyScore * weights.recency +
      factors.relationshipScore * weights.relationship
    );
  }

  /**
   * Calculate recency score (newer memories score higher)
   */
  private getRecencyScore(createdAt: Date): number {
    const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    // Exponential decay: recent memories worth much more
    return Math.exp(-daysSinceCreation / 30);
  }

  /**
   * Calculate emotion score (certain emotions weighted higher)
   */
  private getEmotionScore(emotion: string | undefined): number {
    const emotionWeights: { [key: string]: number } = {
      happy: 0.9,
      excited: 0.9,
      proud: 0.85,
      sad: 0.7,
      frustrated: 0.6,
      anxious: 0.65,
      angry: 0.55,
      neutral: 0.3,
    };
    return emotionWeights[emotion || 'neutral'] || 0.5;
  }

  /**
   * Embed text using Anthropic's text embedding model
   */
  async embedText(text: string): Promise<number[]> {
    // For production, integrate with OpenAI embeddings API or similar
    // For now, using a placeholder that should be replaced
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    const data = await response.json();
    return data.data[0].embedding;
  }

  /**
   * Store a new memory with semantic embedding
   */
  async storeMemory(
    userId: string,
    companionId: string,
    memoryText: string,
    category: string,
    emotion?: string,
    importance: number = 0.5
  ): Promise<string> {
    const memoryId = uuidv4();

    // Embed the memory text
    const embedding = await this.embedText(memoryText);

    // Store in vector database
    await qdrant.upsert(COLLECTION_NAME, {
      points: [
        {
          id: memoryId,
          vector: embedding,
          payload: {
            userId,
            companionId,
            memoryText,
            category,
            emotion,
            importance,
            createdAt: new Date().toISOString(),
          },
        },
      ],
    });

    // Store metadata in PostgreSQL
    await db.insert(memories).values({
      id: memoryId as any,
      userId: userId as any,
      companionId: companionId as any,
      memoryText,
      category,
      emotion,
      importance,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return memoryId;
  }

  /**
   * Search memories by semantic similarity
   */
  async searchMemories(
    userId: string,
    companionId: string,
    query: string,
    limit: number = 5
  ): Promise<ScoredMemory[]> {
    const queryEmbedding = await this.embedText(query);

    const searchResults = await qdrant.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      filter: {
        must: [
          { key: 'userId', match: { value: userId } },
          { key: 'companionId', match: { value: companionId } },
        ],
      },
      limit,
      with_payload: true,
    });

    const scoredMemories: ScoredMemory[] = [];

    for (const result of searchResults) {
      const payload = result.payload as any;
      const createdAt = new Date(payload.createdAt);
      const recencyScore = this.getRecencyScore(createdAt);
      const emotionScore = this.getEmotionScore(payload.emotion);

      const factors: MemoryScoreFactors = {
        importanceScore: payload.importance,
        emotionScore,
        frequencyScore: 0.5, // Would track from interaction history
        recencyScore,
        relationshipScore: 0.5,
      };

      const finalScore = this.calculateMemoryScore(factors);

      scoredMemories.push({
        id: result.id as string,
        text: payload.memoryText,
        score: finalScore,
        importance: payload.importance,
        emotion: payload.emotion,
        createdAt,
      });
    }

    return scoredMemories.sort((a, b) => b.score - a.score);
  }

  /**
   * Get high-priority memories for injection into AI prompts
   */
  async getContextualMemories(
    userId: string,
    companionId: string,
    query: string,
    maxTokens: number = 2000
  ): Promise<ScoredMemory[]> {
    const memories = await this.searchMemories(userId, companionId, query, 20);

    // Filter and truncate to fit token limit
    let totalTokens = 0;
    const contextMemories: ScoredMemory[] = [];

    for (const memory of memories) {
      const estimatedTokens = memory.text.length / 4; // Rough estimate
      if (totalTokens + estimatedTokens <= maxTokens && memory.score > 0.3) {
        contextMemories.push(memory);
        totalTokens += estimatedTokens;
      }
    }

    return contextMemories;
  }

  /**
   * Get all memories for a user-companion pair
   */
  async getAllMemories(userId: string, companionId: string) {
    return await db.query.memories.findMany({
      where: and(
        eq(memories.userId, userId as any),
        eq(memories.companionId, companionId as any)
      ),
    });
  }

  /**
   * Update memory importance based on interaction patterns
   */
  async updateMemoryImportance(memoryId: string, newImportance: number): Promise<void> {
    // Update in PostgreSQL
    await db
      .update(memories)
      .set({ importance: newImportance, updatedAt: new Date() })
      .where(eq(memories.id, memoryId as any));
  }
}

export const memoryEngine = new MemoryEngine();
