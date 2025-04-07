
import axios from 'axios';

export interface Voice {
  voice_id: string; // Change from id to voice_id to match the expected property
  name: string;
  category?: string;
}

export const getVoices = async (apiKey: string): Promise<Voice[]> => {
  try {
    const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    return response.data.voices.map((voice: any) => ({
      voice_id: voice.voice_id, // Make sure we map to voice_id
      name: voice.name,
      category: voice.category
    }));
  } catch (error) {
    console.error('Error fetching voices:', error);
    throw error;
  }
};

export const synthesizeSpeech = async (
  apiKey: string,
  text: string,
  voiceId: string
): Promise<{ audioUrl: string; audioBase64?: string }> => {
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    // Convert the audio buffer to a base64 string
    const audioBase64 = Buffer.from(response.data).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    return { audioUrl, audioBase64 };
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
};
