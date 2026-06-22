// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  birthDate?: Date;
  country?: string;
  createdAt: Date;
  updatedAt: Date;
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  passwordHash: string;
}

// Companion Types
export interface Companion {
  id: string;
  userId: string;
  name: string;
  gender: 'male' | 'female' | 'non-binary';
  ageStyle: number; // 18-80
  avatarModel: string;
  voiceModel: string;
  personalityId: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Relationship Types
export interface Relationship {
  id: string;
  userId: string;
  companionId: string;
  trustScore: number; // 0-100
  friendshipScore: number; // 0-100
  humorScore: number; // 0-100
  engagementScore: number; // 0-100
  attachmentLevel: number; // 0-100
  lastInteraction: Date;
  totalInteractions: number;
}

// Memory Types
export interface Memory {
  id: string;
  userId: string;
  companionId: string;
  category: string;
  importance: number; // 0-1
  memoryText: string;
  embedding?: number[];
  emotion?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Conversation Types
export interface Conversation {
  id: string;
  userId: string;
  companionId: string;
  startedAt: Date;
  endedAt?: Date;
  duration: number; // in seconds
  messageCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'companion';
  content: string;
  emotion?: string;
  audioUrl?: string;
  timestamp: Date;
}

// Emotion Types
export interface EmotionDetection {
  id: string;
  userId: string;
  detectedEmotion: 'happy' | 'sad' | 'frustrated' | 'excited' | 'anxious' | 'angry' | 'neutral';
  confidence: number; // 0-1
  source: 'voice' | 'text' | 'facial';
  timestamp: Date;
}

// Personality Types
export interface PersonalityProfile {
  id: string;
  companionId: string;
  empathyLevel: number; // 0-100
  humorLevel: number; // 0-100
  curiosityLevel: number; // 0-100
  energyLevel: number; // 0-100
  confidenceLevel: number; // 0-100
  updatedAt: Date;
}

// Avatar State Types
export interface AvatarState {
  companionId: string;
  facialExpression: string;
  gesture: string;
  bodyPose: string;
  gazeDirection: string;
  audioUrl?: string;
  updatedAt: Date;
}

// Visual Memory Types
export interface VisualMemory {
  id: string;
  userId: string;
  objectName: string;
  sceneDescription: string;
  confidence: number;
  timestamp: Date;
}

// API Request/Response Types
export interface ChatRequest {
  companionId: string;
  message: string;
  messageType: 'text' | 'voice';
  audioData?: ArrayBuffer;
}

export interface ChatResponse {
  message: string;
  emotion: string;
  audioUrl?: string;
  suggestions?: string[];
  memoryInsight?: string;
}

export interface VoiceStreamRequest {
  companionId: string;
  audioStream: Blob;
}

export interface AvatarStreamResponse {
  videoStream: ReadableStream<Uint8Array>;
  emotions: EmotionDetection;
  gestureState: AvatarState;
}
