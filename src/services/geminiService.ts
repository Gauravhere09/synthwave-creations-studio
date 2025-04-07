
interface ScriptResponse {
  content: string;
  error?: string;
}

export async function generateScript(prompt: string, apiKey: string): Promise<ScriptResponse> {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
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
          temperature: 0.9, // Increased from 0.7 to be more creative
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_ONLY_HIGH"
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate script');
    }
    
    const data = await response.json();
    
    // Debug the response structure
    console.log('Gemini response structure:', JSON.stringify(data, null, 2));
    
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
      const content = data.candidates[0].content.parts[0].text;
      
      // Check if content is just returning the prompt
      if (content.includes(enhancedPrompt) || content === prompt) {
        throw new Error('Model returned the prompt without proper generation');
      }
      
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
