import { ElevenLabsClient } from 'elevenlabs';
import axios from 'axios';

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

interface VoiceConfig {
  voiceId: string;
  modelId: string;
  stability: number;
  similarity: number;
}

const VOICE_CONFIGS: { [key: string]: VoiceConfig } = {
  young_male: {
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Example voice ID
    modelId: 'eleven_monolingual_v1',
    stability: 0.75,
    similarity: 0.75,
  },
  young_female: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    modelId: 'eleven_monolingual_v1',
    stability: 0.75,
    similarity: 0.75,
  },
  adult_male: {
    voiceId: 'g5CIjZEefAFz5CHtQwoj',
    modelId: 'eleven_monolingual_v1',
    stability: 0.8,
    similarity: 0.8,
  },
  adult_female: {
    voiceId: 'pNInz6obpgDQGcFmaJgB',
    modelId: 'eleven_monolingual_v1',
    stability: 0.8,
    similarity: 0.8,
  },
  elder_male: {
    voiceId: 'cgSugiBh9DGcNqAbqHEJ',
    modelId: 'eleven_monolingual_v1',
    stability: 0.9,
    similarity: 0.8,
  },
  elder_female: {
    voiceId: 'nPczCjzI2devNBz1zQrb',
    modelId: 'eleven_monolingual_v1',
    stability: 0.9,
    similarity: 0.8,
  },
};

class ElevenLabsService {
  /**
   * Convert text to speech
   */
  async textToSpeech(
    text: string,
    voiceProfile: string = 'adult_male'
  ): Promise<Buffer> {
    const voiceConfig = VOICE_CONFIGS[voiceProfile] || VOICE_CONFIGS['adult_male'];

    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}`,
        {
          text,
          model_id: voiceConfig.modelId,
          voice_settings: {
            stability: voiceConfig.stability,
            similarity_boost: voiceConfig.similarity,
          },
        },
        {
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
          },
          responseType: 'arraybuffer',
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      console.error('ElevenLabs text-to-speech error:', error);
      throw error;
    }
  }

  /**
   * Stream text-to-speech (for real-time avatar sync)
   */
  async streamTextToSpeech(
    text: string,
    voiceProfile: string = 'adult_male'
  ): Promise<ReadableStream<Uint8Array>> {
    const voiceConfig = VOICE_CONFIGS[voiceProfile] || VOICE_CONFIGS['adult_male'];

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            model_id: voiceConfig.modelId,
            voice_settings: {
              stability: voiceConfig.stability,
              similarity_boost: voiceConfig.similarity,
            },
          }),
        }
      );

      if (!response.body) {
        throw new Error('No response body from ElevenLabs');
      }

      return response.body as ReadableStream<Uint8Array>;
    } catch (error) {
      console.error('ElevenLabs streaming error:', error);
      throw error;
    }
  }

  /**
   * Get available voices
   */
  async getAvailableVoices(): Promise<any> {
    try {
      const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  /**
   * Clone a user's voice (premium feature)
   */
  async cloneVoice(
    name: string,
    audioBuffer: Buffer,
    labels?: { [key: string]: string }
  ): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.elevenlabs.io/v1/voice-lab/cloning',
        {
          name,
          labels,
          files: audioBuffer,
        },
        {
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
          },
        }
      );
      return response.data.voice_id;
    } catch (error) {
      console.error('Voice cloning error:', error);
      throw error;
    }
  }
}

export const elevenLabsService = new ElevenLabsService();
