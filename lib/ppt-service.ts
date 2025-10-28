import { PresentationData } from './gemini-service';

export class PowerPointService {
  async generatePresentation(data: PresentationData, format: 'pptx' | 'pdf' = 'pptx'): Promise<Blob> {
    try {
      const response = await fetch('/api/generate-ppt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, format }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to generate presentation: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error generating presentation:', error);
      throw error;
    }
  }

  async downloadPresentation(data: PresentationData, format: 'pptx' | 'pdf' = 'pptx', filename?: string): Promise<void> {
    const blob = await this.generatePresentation(data, format);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const extension = format === 'pdf' ? 'pdf' : 'pptx';
    link.download = filename || `${data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Create a singleton instance
let pptService: PowerPointService | null = null;

export const getPowerPointService = (): PowerPointService => {
  if (!pptService) {
    pptService = new PowerPointService();
  }
  return pptService;
};