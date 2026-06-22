import { pgTable, text, timestamp, uuid, varchar, integer, real, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Users Table
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    email: varchar('email', { length: 255 }).notNull().unique(),
    username: varchar('username', { length: 100 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    birthDate: timestamp('birth_date'),
    country: varchar('country', { length: 100 }),
    subscriptionTier: varchar('subscription_tier', { length: 50 }).default('free'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    emailIdx: index('idx_users_email').on(t.email),
  })
);

// Companions Table
export const companions = pgTable(
  'companions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    gender: varchar('gender', { length: 20 }),
    ageStyle: integer('age_style'),
    avatarModel: varchar('avatar_model', { length: 255 }),
    voiceModel: varchar('voice_model', { length: 255 }),
    personalityId: uuid('personality_id'),
    profileImage: varchar('profile_image', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    userIdIdx: index('idx_companions_user_id').on(t.userId),
  })
);

// Relationships Table
export const relationships = pgTable(
  'relationships',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    companionId: uuid('companion_id').notNull().references(() => companions.id, { onDelete: 'cascade' }),
    trustScore: real('trust_score').default(0),
    friendshipScore: real('friendship_score').default(0),
    humorScore: real('humor_score').default(0),
    engagementScore: real('engagement_score').default(0),
    attachmentLevel: real('attachment_level').default(0),
    totalInteractions: integer('total_interactions').default(0),
    lastInteraction: timestamp('last_interaction').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    userIdIdx: index('idx_relationships_user_id').on(t.userId),
    companionIdIdx: index('idx_relationships_companion_id').on(t.companionId),
    unique: unique('unique_user_companion').on(t.userId, t.companionId),
  })
);

// Memories Table
export const memories = pgTable(
  'memories',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    companionId: uuid('companion_id').notNull().references(() => companions.id, { onDelete: 'cascade' }),
    category: varchar('category', { length: 100 }),
    importance: real('importance').default(0.5),
    memoryText: text('memory_text').notNull(),
    emotion: varchar('emotion', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    userIdIdx: index('idx_memories_user_id').on(t.userId),
    companionIdIdx: index('idx_memories_companion_id').on(t.companionId),
  })
);

// Conversations Table
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    companionId: uuid('companion_id').notNull().references(() => companions.id, { onDelete: 'cascade' }),
    startedAt: timestamp('started_at').defaultNow(),
    endedAt: timestamp('ended_at'),
    duration: integer('duration').default(0),
    messageCount: integer('message_count').default(0),
  },
  (t) => ({
    userIdIdx: index('idx_conversations_user_id').on(t.userId),
    companionIdIdx: index('idx_conversations_companion_id').on(t.companionId),
  })
);

// Messages Table
export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
    sender: varchar('sender', { length: 20 }).notNull(), // 'user' | 'companion'
    content: text('content').notNull(),
    emotion: varchar('emotion', { length: 50 }),
    audioUrl: varchar('audio_url', { length: 500 }),
    timestamp: timestamp('timestamp').defaultNow(),
  },
  (t) => ({
    conversationIdIdx: index('idx_messages_conversation_id').on(t.conversationId),
  })
);

// Emotion History Table
export const emotionHistory = pgTable(
  'emotion_history',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    detectedEmotion: varchar('detected_emotion', { length: 50 }).notNull(),
    confidence: real('confidence'),
    source: varchar('source', { length: 50 }), // 'voice' | 'text' | 'facial'
    timestamp: timestamp('timestamp').defaultNow(),
  },
  (t) => ({
    userIdIdx: index('idx_emotion_history_user_id').on(t.userId),
    timestampIdx: index('idx_emotion_history_timestamp').on(t.timestamp),
  })
);

// Personality State Table
export const personalityState = pgTable(
  'personality_state',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    companionId: uuid('companion_id').notNull().references(() => companions.id, { onDelete: 'cascade' }).unique(),
    empathyLevel: real('empathy_level').default(50),
    humorLevel: real('humor_level').default(50),
    curiosityLevel: real('curiosity_level').default(50),
    energyLevel: real('energy_level').default(50),
    confidenceLevel: real('confidence_level').default(50),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    companionIdIdx: index('idx_personality_state_companion_id').on(t.companionId),
  })
);

// Avatar State Table
export const avatarState = pgTable(
  'avatar_state',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    companionId: uuid('companion_id').notNull().references(() => companions.id, { onDelete: 'cascade' }).unique(),
    facialExpression: varchar('facial_expression', { length: 100 }),
    gesture: varchar('gesture', { length: 100 }),
    bodyPose: varchar('body_pose', { length: 100 }),
    gazeDirection: varchar('gaze_direction', { length: 100 }),
    audioUrl: varchar('audio_url', { length: 500 }),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    companionIdIdx: index('idx_avatar_state_companion_id').on(t.companionId),
  })
);

// Visual Memories Table
export const visualMemories = pgTable(
  'visual_memories',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    objectName: varchar('object_name', { length: 255 }),
    sceneDescription: text('scene_description'),
    confidence: real('confidence'),
    timestamp: timestamp('timestamp').defaultNow(),
  },
  (t) => ({
    userIdIdx: index('idx_visual_memories_user_id').on(t.userId),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  companions: many(companions),
  relationships: many(relationships),
  memories: many(memories),
  conversations: many(conversations),
  emotionHistory: many(emotionHistory),
  visualMemories: many(visualMemories),
}));

export const companionsRelations = relations(companions, ({ one, many }) => ({
  user: one(users, { fields: [companions.userId], references: [users.id] }),
  relationships: many(relationships),
  memories: many(memories),
  conversations: many(conversations),
  personalityState: one(personalityState),
  avatarState: one(avatarState),
}));

export const relationshipsRelations = relations(relationships, ({ one }) => ({
  user: one(users, { fields: [relationships.userId], references: [users.id] }),
  companion: one(companions, { fields: [relationships.companionId], references: [companions.id] }),
}));

export const memoriesRelations = relations(memories, ({ one }) => ({
  user: one(users, { fields: [memories.userId], references: [users.id] }),
  companion: one(companions, { fields: [memories.companionId], references: [companions.id] }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, { fields: [conversations.userId], references: [users.id] }),
  companion: one(companions, { fields: [conversations.companionId], references: [companions.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
}));
