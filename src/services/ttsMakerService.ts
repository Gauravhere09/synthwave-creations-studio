
export interface TTSMakerOptions {
  text: string;
  voiceId: string;
  speed?: number; // 0-10, default 5
  pitch?: number; // 0-10, default 5
  volume?: number; // 0-10, default 5
}

export const TTS_MAKER_VOICES = [
  { id: "en-US-Wavenet-A", name: "US English - Wavenet A (Male)" },
  { id: "en-US-Wavenet-B", name: "US English - Wavenet B (Male)" },
  { id: "en-US-Wavenet-C", name: "US English - Wavenet C (Female)" },
  { id: "en-US-Wavenet-D", name: "US English - Wavenet D (Male)" },
  { id: "en-US-Wavenet-E", name: "US English - Wavenet E (Female)" },
  { id: "en-US-Wavenet-F", name: "US English - Wavenet F (Female)" },
  { id: "en-GB-Wavenet-A", name: "British English - Wavenet A (Female)" },
  { id: "en-GB-Wavenet-B", name: "British English - Wavenet B (Male)" },
  { id: "en-GB-Wavenet-C", name: "British English - Wavenet C (Female)" },
  { id: "en-GB-Wavenet-D", name: "British English - Wavenet D (Male)" },
];

export async function generateTTSMakerSpeech(
  options: TTSMakerOptions, 
  apiKey: string
): Promise<{ audioUrl: string | null; error?: string }> {
  const { text, voiceId, speed = 5, pitch = 5, volume = 5 } = options;
  const apiUrl = 'https://api.ttsmaker.com/v1/create-tts';

  try {
    const formData = new FormData();
    formData.append('api_key', apiKey);
    formData.append('voice_id', voiceId);
    formData.append('text', text);
    formData.append('speed', speed.toString());
    formData.append('pitch', pitch.toString());
    formData.append('volume', volume.toString());
    formData.append('format', 'mp3');

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate speech');
    }

    const data = await response.json();
    
    if (data.success && data.audio_url) {
      return { audioUrl: data.audio_url };
    } else {
      throw new Error(data.message || 'No audio URL returned');
    }
  } catch (error) {
    console.error('Error generating speech:', error);
    return { 
      audioUrl: null, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
}
