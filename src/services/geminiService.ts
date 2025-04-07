
interface ScriptResponse {
  content: string;
  error?: string;
}

export async function generateScript(prompt: string, apiKey: string): Promise<ScriptResponse> {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate script');
    }
    
    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
      const content = data.candidates[0].content.parts[0].text;
      return { content };
    } else {
      throw new Error('No content generated');
    }
  } catch (error) {
    console.error('Error generating script:', error);
    return {
      content: '',
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}
