import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// Supabase Edge Function: Risk computation (rules-based v1)
// Body: { org_id: string }

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);

serve(async (req) => {
  try {
    const { org_id } = await req.json();
    if (!org_id) return new Response(JSON.stringify({ error: 'org_id required' }), { status: 400 });

    // Pull students for org
    const { data: students } = await supabase
      .from('profiles')
      .select('id')
      .eq('org_id', org_id)
      .eq('role', 'student');

    const results: any[] = [];

    for (const s of students || []) {
      // Simplified signals: last 14 days
      const since = new Date(Date.now() - 14*24*60*60*1000).toISOString();
      const { data: perf } = await supabase
        .from('performance')
        .select('score, completed_date')
        .eq('student_id', s.id)
        .gte('completed_date', since);

      const avg = (perf || []).reduce((a, b) => a + b.score, 0) / ((perf || []).length || 1);

      // last_active from profiles or performance
      const last_active_at = (perf || []).length ? (perf || []).map(p => p.completed_date).sort().slice(-1)[0] : null;

      // Call rules function through a stub: reproduce logic here
      const inactivity_days = last_active_at ? ((Date.now() - new Date(last_active_at).getTime())/(1000*60*60*24)) : 999;
      let risk_level = 'low';
      if ((avg < 60 && (perf || []).length >= 5) || inactivity_days > 7) risk_level = 'high';
      else if ((avg >= 60 && avg < 75) || (perf || []).length < 3 || inactivity_days > 3) risk_level = 'medium';

      await supabase.from('risk_scores').insert({
        org_id,
        student_id: s.id,
        subject: null,
        risk_level,
        score: Math.round((100 - avg) * 10)/10,
        top_factors: { inactivity_days: Math.round(inactivity_days), quizzes: (perf || []).length },
        recommended_actions: risk_level === 'high' ? { assign_remedial: true, notify_parent: true } : { practice_more: true }
      });

      results.push({ student_id: s.id, risk_level });
    }

    return new Response(JSON.stringify({ ok: true, updated: results.length }), { headers: { 'content-type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
