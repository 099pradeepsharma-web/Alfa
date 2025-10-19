// Quality AI Provider - Optimized for complex, long-form content
// Use for: lesson plans, detailed explanations, worksheets, comprehensive content
// Target: <5-7s response time with streaming capability

export interface QualityProviderConfig {
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

export class QualityProvider {
  private static config: QualityProviderConfig = {
    apiKey: process.env.VITE_GEMINI_API_KEY || '',
    model: 'gemini-1.5-pro', // High-quality variant
    maxTokens: 4000, // Higher limit for complex content
    temperature: 0.7 // Higher creativity for diverse content
  };

  /**
   * Generate comprehensive lesson plan
   */
  static async generateLessonPlan(request: ContentRequest): Promise<GeneratedContent> {
    const startTime = performance.now();
    
    try {
      const prompt = this.buildLessonPlanPrompt(request);
      const response = await this.callGeminiAPI(prompt, {
        maxTokens: 3000,
        temperature: 0.6
      });
      
      const content = this.parseLessonPlanResponse(response, request);
      
      return {
        content,
        metadata: {
          provider: 'gemini-quality',
          model: this.config.model,
          latency_ms: Math.round(performance.now() - startTime),
          cached: false
        }
      };
    } catch (error) {
      console.error('Quality lesson plan generation error:', error);
      throw error;
    }
  }

  /**
   * Generate detailed worksheet with multiple problems
   */
  static async generateWorksheet(request: ContentRequest): Promise<GeneratedContent> {
    const startTime = performance.now();
    
    try {
      const prompt = this.buildWorksheetPrompt(request);
      const response = await this.callGeminiAPI(prompt, {
        maxTokens: 2500,
        temperature: 0.5
      });
      
      const content = this.parseWorksheetResponse(response, request);
      
      return {
        content,
        metadata: {
          provider: 'gemini-quality',
          model: this.config.model,
          latency_ms: Math.round(performance.now() - startTime),
          cached: false
        }
      };
    } catch (error) {
      console.error('Quality worksheet generation error:', error);
      throw error;
    }
  }

  /**
   * Generate detailed explanation with examples
   */
  static async generateDetailedExplanation(request: ContentRequest): Promise<GeneratedContent> {
    const startTime = performance.now();
    
    try {
      const prompt = this.buildDetailedExplanationPrompt(request);
      const response = await this.callGeminiAPI(prompt, {
        maxTokens: 1500,
        temperature: 0.6
      });
      
      const content = {
        text: response.trim(),
        examples: [], // Would extract examples from response
        type: 'detailed_explanation',
        difficulty: request.difficulty
      };
      
      return {
        content,
        metadata: {
          provider: 'gemini-quality',
          model: this.config.model,
          latency_ms: Math.round(performance.now() - startTime),
          cached: false
        }
      };
    } catch (error) {
      console.error('Quality detailed explanation generation error:', error);
      throw error;
    }
  }

  /**
   * Build comprehensive lesson plan prompt
   */
  private static buildLessonPlanPrompt(request: ContentRequest): string {
    return `Create a comprehensive lesson plan for:

Grade: ${request.grade}
Subject: ${request.subject}
Topic: ${request.skill}
Difficulty Level: ${request.difficulty}
Language: ${request.language === 'hi' ? 'Hindi' : 'English'}

Include:
1. Learning Objectives (3-4 specific, measurable goals)
2. Prerequisites (what students should know)
3. Materials Needed
4. Lesson Structure (Introduction, Main Content, Activities, Wrap-up)
5. Key Concepts to Cover
6. Practice Exercises (3-5 problems)
7. Assessment Methods
8. Homework/Extension Activities
9. Common Misconceptions to Address
10. Real-world Applications

Make it:
- CBSE curriculum aligned
- Age-appropriate for ${request.grade} students
- Interactive and engaging
- Include time estimates for each section
- Culturally relevant with Indian examples

Format as structured JSON with clear sections.`;
  }

  /**
   * Build worksheet prompt
   */
  private static buildWorksheetPrompt(request: ContentRequest): string {
    const questionCount = request.difficulty === 'Easy' ? 5 : request.difficulty === 'Medium' ? 7 : 10;
    
    return `Create a practice worksheet for:

Grade: ${request.grade}
Subject: ${request.subject}
Topic: ${request.skill}
Difficulty: ${request.difficulty}
Language: ${request.language === 'hi' ? 'Hindi' : 'English'}

Include:
- ${questionCount} progressive difficulty questions
- Mix of question types (MCQ, short answer, problem-solving)
- Answer key with step-by-step solutions
- Marking scheme
- Time limit suggestion
- Instructions for students

Make questions:
- CBSE curriculum aligned
- Progressively challenging
- Include real-world applications
- Use Indian context and examples
- Cover different aspects of the topic

Format as structured JSON with questions, answers, and metadata.`;
  }

  /**
   * Build detailed explanation prompt
   */
  private static buildDetailedExplanationPrompt(request: ContentRequest): string {
    return `Provide a detailed explanation of:

Grade: ${request.grade}
Subject: ${request.subject}
Concept: ${request.skill}
Difficulty: ${request.difficulty}
Language: ${request.language === 'hi' ? 'Hindi' : 'English'}

Structure:
1. Simple definition in student-friendly language
2. Key components or steps
3. 2-3 concrete examples (use Indian context)
4. Common mistakes students make
5. Memory aids or mnemonics
6. Connection to other concepts they know
7. Real-world applications

Make it:
- Age-appropriate for ${request.grade}
- CBSE aligned
- Engaging and relatable
- Include visual descriptions where helpful
- Use analogies familiar to Indian students`;
  }

  /**
   * Call Gemini Pro API with quality settings
   */
  private static async callGeminiAPI(prompt: string, options: { maxTokens: number; temperature: number }): Promise<string> {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=' + this.config.apiKey, {
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
        throw new Error(`Gemini Pro API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0]?.content?.parts[0]?.text || '';
    } catch (error) {
      console.error('Gemini Pro API call error:', error);
      throw error;
    }
  }

  /**
   * Parse lesson plan response
   */
  private static parseLessonPlanResponse(response: string, request: ContentRequest): any {
    try {
      // Try to parse as JSON first
      let cleanResponse = response.replace(/```json\s*|```\s*$/g, '').trim();
      return JSON.parse(cleanResponse);
    } catch {
      // If not JSON, structure the text response
      return {
        title: `${request.subject}: ${request.skill}`,
        grade: request.grade,
        difficulty: request.difficulty,
        content: response,
        type: 'lesson_plan',
        estimated_duration: '45 minutes',
        created_at: new Date().toISOString()
      };
    }
  }

  /**
   * Parse worksheet response
   */
  private static parseWorksheetResponse(response: string, request: ContentRequest): any {
    try {
      let cleanResponse = response.replace(/```json\s*|```\s*$/g, '').trim();
      return JSON.parse(cleanResponse);
    } catch {
      return {
        title: `${request.subject} Practice Worksheet: ${request.skill}`,
        grade: request.grade,
        difficulty: request.difficulty,
        content: response,
        type: 'worksheet',
        created_at: new Date().toISOString()
      };
    }
  }

  /**
   * Generate content based on request type
   */
  static async generate(request: ContentRequest): Promise<GeneratedContent> {
    switch (request.type) {
      case 'lesson_plan':
        return this.generateLessonPlan(request);
      case 'worksheet':
        return this.generateWorksheet(request);
      case 'explanation':
        return this.generateDetailedExplanation(request);
      default:
        throw new Error(`Quality provider doesn't support type: ${request.type}`);
    }
  }

  /**
   * Check if request type is supported by quality provider
   */
  static supports(requestType: string): boolean {
    return ['lesson_plan', 'worksheet', 'explanation'].includes(requestType);
  }

  /**
   * Get performance characteristics
   */
  static getPerformanceProfile() {
    return {
      avgLatency: '4000ms',
      maxTokens: 4000,
      supportedTypes: ['lesson_plan', 'worksheet', 'explanation'],
      costPerRequest: '$0.005',
      slaTarget: '<7s'
    };
  }
}

export default QualityProvider;