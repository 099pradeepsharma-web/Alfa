// Fast AI Provider - Optimized for low-latency, short-form content
// Use for: MCQs, quick explanations, hints, short answers
// Target: <1.5s response time

export interface FastProviderConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface ContentRequest {
  grade: string;
  subject: string;
  skill: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'mcq' | 'explanation' | 'worksheet' | 'lesson_plan';
  language: string;
  context?: string;
}

export interface GeneratedContent {
  content: any;
  metadata: {
    provider: string;
    model: string;
    latency_ms: number;
    tokens_used?: number;
    cached: boolean;
  };
}

export class FastProvider {
  private static config: FastProviderConfig = {
    apiKey: process.env.VITE_GEMINI_API_KEY || '',
    model: 'gemini-1.5-flash', // Fast variant
    maxTokens: 1000, // Limit for short-form content
    temperature: 0.3 // Lower temperature for consistency
  };

  /**
   * Generate MCQ questions with 4 options
   */
  static async generateMCQ(request: ContentRequest): Promise<GeneratedContent> {
    const startTime = performance.now();
    
    try {
      const prompt = this.buildMCQPrompt(request);
      const response = await this.callGeminiAPI(prompt, {
        maxTokens: 400,
        temperature: 0.2
      });
      
      const content = this.parseMCQResponse(response);
      
      return {
        content,
        metadata: {
          provider: 'gemini-fast',
          model: this.config.model,
          latency_ms: Math.round(performance.now() - startTime),
          cached: false
        }
      };
    } catch (error) {
      console.error('Fast MCQ generation error:', error);
      throw error;
    }
  }

  /**
   * Generate short explanation (2-3 sentences)
   */
  static async generateExplanation(request: ContentRequest): Promise<GeneratedContent> {
    const startTime = performance.now();
    
    try {
      const prompt = this.buildExplanationPrompt(request);
      const response = await this.callGeminiAPI(prompt, {
        maxTokens: 300,
        temperature: 0.4
      });
      
      const content = {
        text: response.trim(),
        type: 'explanation',
        difficulty: request.difficulty
      };
      
      return {
        content,
        metadata: {
          provider: 'gemini-fast',
          model: this.config.model,
          latency_ms: Math.round(performance.now() - startTime),
          cached: false
        }
      };
    } catch (error) {
      console.error('Fast explanation generation error:', error);
      throw error;
    }
  }

  /**
   * Build optimized prompt for MCQ generation
   */
  private static buildMCQPrompt(request: ContentRequest): string {
    return `Generate 1 multiple choice question for:

Grade: ${request.grade}
Subject: ${request.subject}
Skill: ${request.skill}
Difficulty: ${request.difficulty}
Language: ${request.language === 'hi' ? 'Hindi' : 'English'}

Format as JSON:
{
  "question": "Question text",
  "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
  "correct": "A",
  "explanation": "Brief explanation why this is correct"
}

Make it CBSE curriculum aligned and age-appropriate.`;
  }

  /**
   * Build optimized prompt for explanation generation
   */
  private static buildExplanationPrompt(request: ContentRequest): string {
    return `Explain this concept briefly (2-3 sentences):

Grade: ${request.grade}
Subject: ${request.subject}
Concept: ${request.skill}
Difficulty: ${request.difficulty}
Language: ${request.language === 'hi' ? 'Hindi' : 'English'}

Make it:
- Age-appropriate for ${request.grade} students
- CBSE curriculum aligned
- Clear and concise
- Include one real-world example

Just return the explanation text, no extra formatting.`;
  }

  /**
   * Call Gemini API with fast settings
   */
  private static async callGeminiAPI(prompt: string, options: { maxTokens: number; temperature: number }): Promise<string> {
    try {
      // This is a simplified version - you'll integrate with your existing Gemini service
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + this.config.apiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            maxOutputTokens: options.maxTokens,
            temperature: options.temperature,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0]?.content?.parts[0]?.text || '';
    } catch (error) {
      console.error('Gemini API call error:', error);
      throw error;
    }
  }

  /**
   * Parse MCQ response and validate format
   */
  private static parseMCQResponse(response: string): any {
    try {
      // Clean up response (remove markdown formatting if present)
      let cleanResponse = response.replace(/```json\s*|```\s*$/g, '').trim();
      
      const parsed = JSON.parse(cleanResponse);
      
      // Validate required fields
      if (!parsed.question || !parsed.options || !parsed.correct || !parsed.explanation) {
        throw new Error('Invalid MCQ format');
      }
      
      // Ensure options is an array of 4 items
      if (!Array.isArray(parsed.options) || parsed.options.length !== 4) {
        throw new Error('MCQ must have exactly 4 options');
      }
      
      return {
        question: parsed.question,
        options: parsed.options,
        correct: parsed.correct,
        explanation: parsed.explanation,
        type: 'mcq'
      };
    } catch (error) {
      console.error('MCQ parsing error:', error);
      // Return fallback MCQ
      return {
        question: `Sample ${request.subject} question for ${request.skill}`,
        options: ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
        correct: 'A',
        explanation: 'This is a sample explanation.',
        type: 'mcq',
        error: 'Parsing failed, showing fallback content'
      };
    }
  }

  /**
   * Generate content based on request type
   */
  static async generate(request: ContentRequest): Promise<GeneratedContent> {
    switch (request.type) {
      case 'mcq':
        return this.generateMCQ(request);
      case 'explanation':
        return this.generateExplanation(request);
      default:
        throw new Error(`Fast provider doesn't support type: ${request.type}`);
    }
  }

  /**
   * Check if request type is supported by fast provider
   */
  static supports(requestType: string): boolean {
    return ['mcq', 'explanation'].includes(requestType);
  }

  /**
   * Get performance characteristics
   */
  static getPerformanceProfile() {
    return {
      avgLatency: '800ms',
      maxTokens: 1000,
      supportedTypes: ['mcq', 'explanation'],
      costPerRequest: '$0.001',
      slaTarget: '<1.5s'
    };
  }
}

export default FastProvider;