import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// Enhanced Content Queue Consumer with Real AI Provider Routing
// Processes queued content_requests and routes to appropriate AI providers

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);

// AI Provider Router
class AIProviderRouter {
  /**
   * Route request to appropriate provider based on type and preference
   */
  static getProvider(requestType: string, preference: string = 'auto'): 'fast' | 'quality' {
    if (preference !== 'auto') {
      return preference as 'fast' | 'quality';
    }
    
    // Auto-routing logic
    switch (requestType) {
      case 'mcq':
      case 'explanation':
        return 'fast'; // Low latency for simple content
      case 'lesson_plan':
      case 'worksheet':
        return 'quality'; // High quality for complex content
      default:
        return 'fast';
    }
  }
  
  /**
   * Generate content using fast provider (Gemini Flash)
   */
  static async generateFast(request: any): Promise<any> {
    const prompts = {
      mcq: `Generate 1 MCQ for Grade ${request.grade} ${request.subject}, topic: ${request.skill}, difficulty: ${request.difficulty}. Format as JSON: {"question": "...", "options": ["A)", "B)", "C)", "D)"], "correct": "A", "explanation": "..."}`,
      explanation: `Explain ${request.skill} for Grade ${request.grade} ${request.subject} students in 2-3 sentences. Difficulty: ${request.difficulty}. Use simple language and one example.`
    };
    
    const prompt = prompts[request.request_type] || prompts.explanation;
    
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + Deno.env.get('GEMINI_API_KEY'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.3
          }
        })
      }
    );
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Generation failed';
    
    // Try to parse as JSON for MCQ, otherwise return as text
    if (request.request_type === 'mcq') {
      try {
        return JSON.parse(text.replace(/```json\s*|```\s*$/g, ''));
      } catch {
        return { question: text, type: 'mcq', error: 'Parse failed' };
      }
    }
    
    return { text, type: request.request_type };
  }
  
  /**
   * Generate content using quality provider (Gemini Pro)
   */
  static async generateQuality(request: any): Promise<any> {
    const prompts = {
      lesson_plan: `Create a detailed lesson plan for Grade ${request.grade} ${request.subject}, topic: ${request.skill}, difficulty: ${request.difficulty}. Include: objectives, materials, activities, assessment. CBSE aligned.`,
      worksheet: `Create a practice worksheet with 5-8 questions for Grade ${request.grade} ${request.subject}, topic: ${request.skill}, difficulty: ${request.difficulty}. Include answer key. CBSE format.`
    };
    
    const prompt = prompts[request.request_type] || `Generate detailed content about ${request.skill} for Grade ${request.grade} ${request.subject} students.`;
    
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=' + Deno.env.get('GEMINI_API_KEY'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 3000,
            temperature: 0.6
          }
        })
      }
    );
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Generation failed';
    
    return { 
      content: text, 
      type: request.request_type,
      title: `${request.subject}: ${request.skill}`,
      grade: request.grade,
      difficulty: request.difficulty
    };
  }
}

// Main queue processing function
async function processQueue() {
  try {
    // Get up to 5 queued requests
    const { data: jobs } = await supabase
      .from('content_requests')
      .select('*')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(5);

    if (!jobs || jobs.length === 0) {
      return { processed: 0, message: 'No queued jobs' };
    }

    let processed = 0;
    
    for (const job of jobs) {
      try {
        // Mark as generating
        await supabase
          .from('content_requests')
          .update({ status: 'generating', started_at: new Date().toISOString() })
          .eq('id', job.id);

        // Generate cache key
        const cacheKey = `${job.grade}|${job.subject}|${job.skill}|${job.difficulty}|${job.request_type}|${job.language}`;
        
        // Check cache first
        const { data: cached } = await supabase
          .from('content_cache')
          .select('content, provider_used')
          .eq('cache_key', cacheKey)
          .single();
          
        let content, providerUsed, latencyMs;
        
        if (cached?.content) {
          // Cache hit
          content = cached.content;
          providerUsed = 'cache';
          latencyMs = 0;
        } else {
          // Cache miss - generate new content
          const startTime = performance.now();
          const provider = AIProviderRouter.getProvider(job.request_type, job.provider_preference);
          
          if (provider === 'fast') {
            content = await AIProviderRouter.generateFast(job);
            providerUsed = 'gemini-flash';
          } else {
            content = await AIProviderRouter.generateQuality(job);
            providerUsed = 'gemini-pro';
          }
          
          latencyMs = Math.round(performance.now() - startTime);
          
          // Store in cache
          await supabase.from('content_cache').upsert({
            cache_key: cacheKey,
            content,
            provider_used: providerUsed,
            generated_at: new Date().toISOString(),
            ttl_seconds: 604800 // 7 days
          });
        }
        
        // Store result in content_items
        await supabase.from('content_items').insert({
          org_id: job.org_id,
          request_id: job.id,
          content_type: job.request_type,
          grade: job.grade,
          subject: job.subject,
          skill: job.skill,
          difficulty: job.difficulty,
          language: job.language,
          payload: content,
          provider_used: providerUsed,
          latency_ms: latencyMs,
          cached_from: providerUsed === 'cache'
        });
        
        // Mark as ready
        await supabase
          .from('content_requests')
          .update({ 
            status: 'ready',
            finished_at: new Date().toISOString()
          })
          .eq('id', job.id);
          
        processed++;
        
      } catch (error) {
        console.error(`Job ${job.id} processing error:`, error);
        
        // Mark as failed
        await supabase
          .from('content_requests')
          .update({ 
            status: 'failed',
            finished_at: new Date().toISOString()
          })
          .eq('id', job.id);
      }
    }
    
    return { processed, total: jobs.length };
  } catch (error) {
    console.error('Queue processing error:', error);
    throw error;
  }
}

serve(async (req) => {
  try {
    const result = await processQueue();
    return new Response(JSON.stringify({ 
      ok: true, 
      ...result,
      timestamp: new Date().toISOString()
    }), { 
      headers: { 'content-type': 'application/json' } 
    });
  } catch (e) {
    return new Response(JSON.stringify({ 
      error: String(e),
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
});