
export interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
  width?: 512 | 640 | 768 | 1024;
  height?: 512 | 640 | 768 | 1024;
  cfgScale?: number; // 0-35
  steps?: number; // 10-50
  seed?: number;
  style?: string;
  [key: string]: string | number | undefined; // Add index signature to make it compatible with Json
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  base64Image: string;
  params: ImageGenerationParams;
  base64_image?: string; // Added for compatibility with Supabase
}

export async function generateImage(
  params: ImageGenerationParams,
  apiKey: string
): Promise<{ images: GeneratedImage[] | null; error?: string }> {
  const apiUrl = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';

  const defaults = {
    width: 1024,
    height: 1024,
    cfgScale: 7,
    steps: 30,
    style: 'enhance',
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: params.prompt,
            weight: 1,
          },
          {
            text: params.negativePrompt || '',
            weight: -1,
          },
        ],
        width: params.width || defaults.width,
        height: params.height || defaults.height,
        cfg_scale: params.cfgScale || defaults.cfgScale,
        steps: params.steps || defaults.steps,
        seed: params.seed || Math.floor(Math.random() * 2147483647),
        style_preset: params.style || defaults.style,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate image');
    }

    const data = await response.json();
    
    if (!data.artifacts || !data.artifacts.length) {
      throw new Error('No images generated');
    }
    
    const images: GeneratedImage[] = data.artifacts.map((artifact: any, index: number) => {
      const base64Image = artifact.base64;
      const timestamp = Date.now();
      const id = `img_${timestamp}_${index}`;

      return {
        id,
        url: `data:image/png;base64,${base64Image}`,
        prompt: params.prompt,
        timestamp,
        base64Image,
        base64_image: base64Image, // Added for compatibility with Supabase
        params,
      };
    });

    return { images };
  } catch (error) {
    console.error('Error generating image:', error);
    return { 
      images: null, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
}
