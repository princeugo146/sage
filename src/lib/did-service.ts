import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface StreamConfig {
  source_url?: string;
  driver_url?: string;
  audio_url?: string;
}

interface CreateStreamRequest {
  source_url: string;
  driver_url: string;
  audio_url?: string;
  config?: StreamConfig;
  face_detection?: boolean;
  face_crop?: boolean;
}

interface StreamResponse {
  id: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

class DIdService {
  private apiClient: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.DID_API_KEY || '';
    this.apiClient = axios.create({
      baseURL: 'https://api.d-id.com',
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a video stream with avatar
   */
  async createStream(sourceUrl: string, driverUrl: string): Promise<StreamResponse> {
    try {
      const response = await this.apiClient.post('/streams', {
        source_url: sourceUrl,
        driver_url: driverUrl,
        config: {
          fluent: true,
          pad: 0.1,
        },
        face_detection: true,
        face_crop: true,
      } as CreateStreamRequest);

      return response.data;
    } catch (error) {
      console.error('D-ID stream creation error:', error);
      throw error;
    }
  }

  /**
   * Get stream status
   */
  async getStreamStatus(streamId: string): Promise<StreamResponse> {
    try {
      const response = await this.apiClient.get(`/streams/${streamId}`);
      return response.data;
    } catch (error) {
      console.error('D-ID get stream error:', error);
      throw error;
    }
  }

  /**
   * Connect audio to stream (for synchronized speech)
   */
  async connectAudio(streamId: string, audioUrl: string): Promise<void> {
    try {
      await this.apiClient.patch(`/streams/${streamId}`, {
        audio_url: audioUrl,
      });
    } catch (error) {
      console.error('D-ID audio connection error:', error);
      throw error;
    }
  }

  /**
   * Destroy stream
   */
  async destroyStream(streamId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/streams/${streamId}`);
    } catch (error) {
      console.error('D-ID stream destruction error:', error);
      throw error;
    }
  }

  /**
   * Create avatar from image
   */
  async createAvatar(imageUrl: string, talkingPhotoMode: boolean = false): Promise<any> {
    try {
      const response = await this.apiClient.post('/avatars', {
        image_url: imageUrl,
        talking_photo_mode: talkingPhotoMode,
      });
      return response.data;
    } catch (error) {
      console.error('D-ID avatar creation error:', error);
      throw error;
    }
  }

  /**
   * Get available avatars
   */
  async getAvatars(): Promise<any[]> {
    try {
      const response = await this.apiClient.get('/avatars');
      return response.data.avatars || [];
    } catch (error) {
      console.error('D-ID get avatars error:', error);
      throw error;
    }
  }

  /**
   * Get available drivers (animations)
   */
  async getDrivers(): Promise<any[]> {
    try {
      const response = await this.apiClient.get('/drivers');
      return response.data.drivers || [];
    } catch (error) {
      console.error('D-ID get drivers error:', error);
      throw error;
    }
  }
}

export const dIdService = new DIdService();
