
interface ScriptResponse {
  content: string;
  error?: string;
}

export async function generateScript(prompt: string, apiKey: string): Promise<ScriptResponse> {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
  
  try {
    // Enhance the prompt with expert scriptwriting context
    const enhancedPrompt = `As an expert and experienced professional scriptwriter with deep knowledge of narrative structure, character development, and compelling dialogue, please write a high-quality script based on the following request. Focus on creating engaging, well-structured content with proper formatting and natural dialogue. Avoid using asterisks or excessive punctuation. Create professional-grade material ready for production:\n\n${prompt}`;
    
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
                text: enhancedPrompt
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
