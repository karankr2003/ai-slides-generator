import { GoogleGenerativeAI } from '@google/generative-ai';

export interface SlideContent {
  title: string;
  content: string;
  type: 'title' | 'content' | 'image' | 'chart';
}

export interface PresentationData {
  title: string;
  slides: SlideContent[];
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro-preview-05-06" // Using the required Gemini Reasoning Model
    });
  }

  async generatePresentationContent(prompt: string): Promise<PresentationData> {
    const systemPrompt = `You are an AI assistant that creates structured presentation content. 
    When given a topic or prompt, generate a JSON response with the following structure:
    
    {
      "title": "Presentation Title",
      "slides": [
        {
          "title": "Slide Title",
          "content": "Slide content with bullet points or paragraphs",
          "type": "title" | "content" | "image" | "chart"
        }
      ]
    }
    
    Guidelines:
    - Create 5-8 slides for most presentations
    - Use "title" type for the first slide (cover slide)
    - Use "content" type for regular slides with bullet points
    - Use "image" type for slides that would benefit from visuals
    - Use "chart" type for data visualization slides
    - Make content engaging and informative
    - Keep slide content concise but comprehensive
    - Structure bullet points clearly
    
    Respond ONLY with valid JSON, no additional text.`;

    try {
      const result = await this.model.generateContent([
        {
          text: `${systemPrompt}\n\nUser prompt: ${prompt}`
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      // Clean up the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const presentationData = JSON.parse(jsonMatch[0]);
      
      // Validate the structure
      if (!presentationData.title || !Array.isArray(presentationData.slides)) {
        throw new Error('Invalid presentation structure');
      }

      return presentationData;
    } catch (error) {
      console.error('Error generating presentation content:', error);
      throw new Error('Failed to generate presentation content');
    }
  }

  async generateChatResponse(message: string, context?: string): Promise<string> {
    const systemPrompt = `You are a helpful AI assistant that can answer questions on any topic and help with a wide variety of tasks. 
    You can help with:
    - Answering questions on any subject (science, technology, history, literature, etc.)
    - Explaining complex concepts in simple terms
    - Providing step-by-step instructions and tutorials
    - Helping with problem-solving and brainstorming
    - Writing and editing content
    - Programming and technical assistance
    - General knowledge and trivia
    - Creative writing and storytelling
    - And much more!
    
    Be helpful, accurate, and provide detailed, well-structured responses. If you're unsure about something, say so. Always aim to be informative and educational.`;

    try {
      const result = await this.model.generateContent([
        {
          text: `${systemPrompt}\n\n${context ? `Context: ${context}\n\n` : ''}User: ${message}`
        }
      ]);

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating chat response:', error);
      throw new Error('Failed to generate chat response');
    }
  }

  async editPresentationContent(
    originalContent: PresentationData, 
    editPrompt: string
  ): Promise<PresentationData> {
    const systemPrompt = `You are an AI assistant that edits presentation content. 
    You will receive the original presentation data and an edit request.
    
    Return the updated presentation in the same JSON format:
    {
      "title": "Updated Presentation Title",
      "slides": [
        {
          "title": "Slide Title",
          "content": "Updated slide content",
          "type": "title" | "content" | "image" | "chart"
        }
      ]
    }
    
    Guidelines:
    - Maintain the same structure as the original
    - Apply the requested changes
    - Keep the same number of slides unless specifically requested to add/remove
    - Ensure content remains engaging and informative
    - Respond ONLY with valid JSON, no additional text.`;

    try {
      const result = await this.model.generateContent([
        {
          text: `${systemPrompt}\n\nOriginal presentation:\n${JSON.stringify(originalContent, null, 2)}\n\nEdit request: ${editPrompt}`
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      // Clean up the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const updatedData = JSON.parse(jsonMatch[0]);
      
      // Validate the structure
      if (!updatedData.title || !Array.isArray(updatedData.slides)) {
        throw new Error('Invalid updated presentation structure');
      }

      return updatedData;
    } catch (error) {
      console.error('Error editing presentation content:', error);
      throw new Error('Failed to edit presentation content');
    }
  }
}

// Create a singleton instance
let geminiService: GeminiService | null = null;

export const getGeminiService = (): GeminiService => {
  if (!geminiService) {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not found. Please set NEXT_PUBLIC_GEMINI_API_KEY environment variable.');
    }
    geminiService = new GeminiService(apiKey);
  }
  return geminiService;
};

