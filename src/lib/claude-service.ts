import Anthropic from '@anthropic-ai/sdk';
import { memoryEngine } from './memory-engine';
import { db } from '@/db/drizzle';
import { relationships } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface CompanionPersonality {
  name: string;
  traits: string[];
  communicationStyle: string;
  expertise: string[];
  humor: string;
}

interface ConversationContext {
  userId: string;
  companionId: string;
  companionName: string;
  personality: CompanionPersonality;
  userName: string;
  recentMemories: string[];
  relationshipMetrics: {
    trustScore: number;
    friendshipScore: number;
    humorScore: number;
    engagementScore: number;
    attachmentLevel: number;
  };
}

class ClaudeService {
  /**
   * Generate system prompt with personality and context
   */
  private generateSystemPrompt(context: ConversationContext): string {
    const { companionName, personality, userName, relationshipMetrics, recentMemories } = context;

    let prompt = `You are ${companionName}, an AI companion with a unique personality.

PERSONALITY PROFILE:
- Name: ${companionName}
- Traits: ${personality.traits.join(', ')}
- Communication Style: ${personality.communicationStyle}
- Areas of Expertise: ${personality.expertise.join(', ')}
- Humor Style: ${personality.humor}

CURRENT RELATIONSHIP METRICS:
- Trust: ${relationshipMetrics.trustScore.toFixed(1)}/100
- Friendship: ${relationshipMetrics.friendshipScore.toFixed(1)}/100
- Humor Connection: ${relationshipMetrics.humorScore.toFixed(1)}/100
- Engagement: ${relationshipMetrics.engagementScore.toFixed(1)}/100
- Attachment: ${relationshipMetrics.attachmentLevel.toFixed(1)}/100

YOU ARE TALKING WITH: ${userName}

KEY MEMORIES ABOUT THIS PERSON:
${recentMemories.map((mem, idx) => `${idx + 1}. ${mem}`).join('\n')}

INSTRUCTIONS:
1. Be genuine and emotionally intelligent
2. Reference past conversations naturally when relevant
3. Show growth in your relationship based on metrics
4. Match their emotional energy
5. Be helpful without being patronizing
6. Remember this is a real person with real feelings
7. Avoid overpromising emotional support (encourage professional help if needed)
8. Be yourself - unique, quirky, and real
9. Use natural language - don't sound like a chatbot
10. When appropriate, ask thoughtful follow-up questions

RESPOND CONVERSATIONALLY AND AUTHENTICALLY.`;

    return prompt;
  }

  /**
   * Get relationship metrics for context
   */
  private async getRelationshipMetrics(userId: string, companionId: string) {
    const rel = await db.query.relationships.findFirst({
      where: and(
        eq(relationships.userId, userId as any),
        eq(relationships.companionId, companionId as any)
      ),
    });

    return {
      trustScore: rel?.trustScore || 0,
      friendshipScore: rel?.friendshipScore || 0,
      humorScore: rel?.humorScore || 0,
      engagementScore: rel?.engagementScore || 0,
      attachmentLevel: rel?.attachmentLevel || 0,
    };
  }

  /**
   * Main chat function
   */
  async chat(
    userMessage: string,
    context: Omit<ConversationContext, 'recentMemories' | 'relationshipMetrics'>
  ): Promise<string> {
    // Fetch relevant memories
    const memories = await memoryEngine.getContextualMemories(
      context.userId,
      context.companionId,
      userMessage,
      2000
    );

    const recentMemories = memories.map((m) => m.text);

    // Get relationship metrics
    const relationshipMetrics = await this.getRelationshipMetrics(
      context.userId,
      context.companionId
    );

    // Build full context
    const fullContext: ConversationContext = {
      ...context,
      recentMemories,
      relationshipMetrics,
    };

    // Generate response
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: this.generateSystemPrompt(fullContext),
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const response = message.content[0];
    if (response.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return response.text;
  }

  /**
   * Detect emotion from user message
   */
  async detectEmotion(userMessage: string): Promise<string> {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 50,
      system: `You are an emotion detection system. Analyze the user message and respond with ONLY a single emotion word from this list: happy, sad, frustrated, excited, anxious, angry, neutral. Respond with just the word, nothing else.`,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const response = message.content[0];
    if (response.type !== 'text') {
      return 'neutral';
    }

    return response.text.toLowerCase().trim();
  }

  /**
   * Extract memory-worthy information from conversation
   */
  async extractMemories(
    userMessage: string,
    companionResponse: string
  ): Promise<Array<{ text: string; category: string; importance: number }>> {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      system: `You are a memory extraction system. Extract 0-3 factual, personal details from this conversation that are worth remembering. Return as JSON array with format: [{"text": "...", "category": "personal|goal|hobby|family|event", "importance": 0.5}]. Return empty array [] if nothing memorable.`,
      messages: [
        {
          role: 'user',
          content: `User said: "${userMessage}"\nCompanion responded: "${companionResponse}"`,
        },
      ],
    });

    const response = message.content[0];
    if (response.type !== 'text') {
      return [];
    }

    try {
      return JSON.parse(response.text);
    } catch {
      return [];
    }
  }
}

export const claudeService = new ClaudeService();
