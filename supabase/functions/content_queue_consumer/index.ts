import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// Supabase Edge Function: Content Queue Consumer
// Periodically checks content_requests (status=queued), routes to AI provider
// Upserts result in content_items and content_cache

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);

async function runPipeline() {
  // Get up to 5 queued requests
  const { data: jobs } = await supabase
    .from('content_requests')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(5);

  for (const job of jobs || []) {
    const key = `${job.grade}|${job.subject}|${job.skill}|${job.difficulty}|${job.request_type}|${job.language}`;
    // Check cache
    const { data: cache } = await supabase.from('content_cache').select('content').eq('cache_key', key).single();
    if (cache && cache.content) {
      await supabase.from('content_items').insert({
        org_id: job.org_id,
        request_id: job.id,
        content_type: job.request_type,
        grade: job.grade,
        subject: job.subject,
        skill: job.skill,
        difficulty: job.difficulty,
        language: job.language,
        payload: cache.content,
        provider_used: 'cache',
        cached_from: true
      });
      await supabase.from('content_requests').update({ status: 'ready' }).eq('id', job.id);
      continue;
    }
    // Route to provider (stub: fast for MCQ, quality for lesson_plan, etc)
    let provider = 'fast';
    if (job.request_type === 'lesson_plan' || job.provider_preference === 'quality') provider = 'quality';
    // Simulate call
    const content = { text: `[${provider} AI] ${job.request_type} for ${job.subject}, ${job.skill}, ${job.grade}, ${job.difficulty}` };
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
      provider_used: provider,
      cached_from: false
    });
    await supabase.from('content_cache').upsert({
      cache_key: key,
      content,
      provider_used: provider,
      generated_at: new Date().toISOString(),
      ttl_seconds: 604800
    });
    await supabase.from('content_requests').update({ status: 'ready' }).eq('id', job.id);
  }
}

serve(async (req) => {
  try {
    await runPipeline();
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
