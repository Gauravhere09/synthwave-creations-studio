
export interface Voice {
  id: string;
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
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
  { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam" },
];

export const ELEVEN_LABS_MODELS = [
  { id: "eleven_multilingual_v2", name: "Multilingual v2" },
  { id: "eleven_turbo_v2", name: "Turbo v2" },
  { id: "eleven_english_v1", name: "English v1" },
];

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
