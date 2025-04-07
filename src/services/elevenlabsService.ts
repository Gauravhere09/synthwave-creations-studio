
export interface Voice {
  voice_id: string;
  name: string;
}

export interface TTSOptions {
  voiceId: string;
  text: string;
  model?: string; // "eleven_multilingual_v2" | "eleven_turbo_v2" | "eleven_english_v1"
  stability?: number; // 0-1, default 0.5
  similarityBoost?: number; // 0-1, default 0.75
}

export const ELEVEN_LABS_VOICES = [
  { voice_id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  { voice_id: "AZnzlk1XvdvUeBnXmlld", name: "Domi" },
  { voice_id: "EXAVITQu4vr4xnSDxMaL", name: "Bella" },
  { voice_id: "ErXwobaYiN019PkySvjV", name: "Antoni" },
  { voice_id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli" },
  { voice_id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh" },
  { voice_id: "VR6AewLTigWG4xSOukaG", name: "Arnold" },
  { voice_id: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
  { voice_id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam" },
];

export const ELEVEN_LABS_MODELS = [
  { id: "eleven_multilingual_v2", name: "Multilingual v2" },
  { id: "eleven_turbo_v2", name: "Turbo v2" },
  { id: "eleven_english_v1", name: "English v1" },
];

export async function getVoices(apiKey: string): Promise<Voice[]> {
  if (!apiKey) {
    return ELEVEN_LABS_VOICES; // Return default voices if no API key
  }
  
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch voices');
    }
    
    const data = await response.json();
    return data.voices.map((voice: any) => ({
      voice_id: voice.voice_id,
      name: voice.name
    }));
  } catch (error) {
    console.error('Error fetching voices:', error);
    return ELEVEN_LABS_VOICES; // Fallback to default voices
  }
}

export async function synthesizeSpeech(
  apiKey: string,
  voiceId: string,
  text: string,
  stability = 0.5,
  clarity = 0.75
): Promise<string> {
  const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability,
          similarity_boost: clarity,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail?.message || 'Failed to generate speech');
    }

    // The response is binary audio data
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    return audioUrl;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
}

export async function generateSpeech(
  options: TTSOptions, 
  apiKey: string
): Promise<{ audioUrl: string | null; error?: string }> {
  const { voiceId, text, model = 'eleven_multilingual_v2', stability = 0.5, similarityBoost = 0.75 } = options;
  const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail?.message || 'Failed to generate speech');
    }

    // The response is binary audio data
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    return { audioUrl };
  } catch (error) {
    console.error('Error generating speech:', error);
    return { 
      audioUrl: null, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
}
