import { db } from '@/db/drizzle';
import { relationships } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface RelationshipUpdate {
  trustIncrease?: number;
  friendshipIncrease?: number;
  humorIncrease?: number;
  engagementIncrease?: number;
  attachmentIncrease?: number;
}

class RelationshipEngine {
  private MAX_SCORE = 100;

  /**
   * Normalize score to 0-100 range
   */
  private normalizeScore(score: number): number {
    return Math.max(0, Math.min(this.MAX_SCORE, score));
  }

  /**
   * Initialize relationship for new companion
   */
  async initializeRelationship(
    userId: string,
    companionId: string
  ): Promise<void> {
    const existing = await db.query.relationships.findFirst({
      where: and(
        eq(relationships.userId, userId as any),
        eq(relationships.companionId, companionId as any)
      ),
    });

    if (!existing) {
      await db.insert(relationships).values({
        id: undefined as any,
        userId: userId as any,
        companionId: companionId as any,
        trustScore: 30, // Start with some baseline
        friendshipScore: 20,
        humorScore: 25,
        engagementScore: 30,
        attachmentLevel: 10,
        totalInteractions: 0,
        lastInteraction: new Date(),
        createdAt: new Date(),
      });
    }
  }

  /**
   * Update relationship metrics
   */
  async updateRelationship(
    userId: string,
    companionId: string,
    updates: RelationshipUpdate
  ): Promise<void> {
    const rel = await db.query.relationships.findFirst({
      where: and(
        eq(relationships.userId, userId as any),
        eq(relationships.companionId, companionId as any)
      ),
    });

    if (!rel) {
      await this.initializeRelationship(userId, companionId);
      return this.updateRelationship(userId, companionId, updates);
    }

    const updated = {
      trustScore: this.normalizeScore(
        (rel.trustScore || 0) + (updates.trustIncrease || 0)
      ),
      friendshipScore: this.normalizeScore(
        (rel.friendshipScore || 0) + (updates.friendshipIncrease || 0)
      ),
      humorScore: this.normalizeScore(
        (rel.humorScore || 0) + (updates.humorIncrease || 0)
      ),
      engagementScore: this.normalizeScore(
        (rel.engagementScore || 0) + (updates.engagementIncrease || 0)
      ),
      attachmentLevel: this.normalizeScore(
        (rel.attachmentLevel || 0) + (updates.attachmentIncrease || 0)
      ),
      totalInteractions: (rel.totalInteractions || 0) + 1,
      lastInteraction: new Date(),
    };

    await db
      .update(relationships)
      .set(updated)
      .where(
        and(
          eq(relationships.userId, userId as any),
          eq(relationships.companionId, companionId as any)
        )
      );
  }

  /**
   * Score interaction quality (returns recommended metric updates)
   */
  scoreInteraction(
    messageLength: number,
    hasEmotionalContent: boolean,
    hasLaughter: boolean,
    responseTime: number // in seconds
  ): RelationshipUpdate {
    let updates: RelationshipUpdate = {};

    // Trust increases with consistent engagement
    if (messageLength > 50) updates.trustIncrease = 2;
    if (responseTime < 2) updates.trustIncrease = (updates.trustIncrease || 0) + 1;

    // Friendship increases with emotional conversations
    if (hasEmotionalContent) updates.friendshipIncrease = 3;
    if (messageLength > 100) updates.friendshipIncrease = (updates.friendshipIncrease || 0) + 2;

    // Humor increases with laughter
    if (hasLaughter) updates.humorIncrease = 5;

    // Engagement always increases
    updates.engagementIncrease = 2;

    // Attachment increases with longer conversations
    if (messageLength > 200) updates.attachmentIncrease = 2;
    if (hasEmotionalContent && hasLaughter)
      updates.attachmentIncrease = (updates.attachmentIncrease || 0) + 1;

    return updates;
  }

  /**
   * Get relationship summary
   */
  async getRelationshipSummary(userId: string, companionId: string): Promise<any> {
    const rel = await db.query.relationships.findFirst({
      where: and(
        eq(relationships.userId, userId as any),
        eq(relationships.companionId, companionId as any)
      ),
    });

    if (!rel) {
      return null;
    }

    // Determine relationship stage
    const avgScore =
      ((rel.trustScore || 0) +
        (rel.friendshipScore || 0) +
        (rel.humorScore || 0) +
        (rel.engagementScore || 0) +
        (rel.attachmentLevel || 0)) /
      5;

    let stage = 'Acquaintance';
    if (avgScore > 60) stage = 'Friend';
    if (avgScore > 75) stage = 'Close Friend';
    if (avgScore > 85 && (rel.totalInteractions || 0) > 50) stage = 'Best Friend';

    return {
      stage,
      metrics: {
        trust: rel.trustScore || 0,
        friendship: rel.friendshipScore || 0,
        humor: rel.humorScore || 0,
        engagement: rel.engagementScore || 0,
        attachment: rel.attachmentLevel || 0,
      },
      totalInteractions: rel.totalInteractions || 0,
      lastInteraction: rel.lastInteraction,
      averageScore: avgScore,
    };
  }
}

export const relationshipEngine = new RelationshipEngine();
