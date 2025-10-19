import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { student_id, trigger, skill_focus } = await req.json();

    if (!student_id) {
      return new Response(JSON.stringify({ error: 'student_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: lowMastery, error } = await supabase.rpc('get_students_needing_practice');
    if (error) throw error;
    if (!lowMastery || lowMastery.length === 0) {
      return new Response('No low mastery students.', { status: 200 });
    }

    for (const rec of lowMastery) {
      const prompt = {
        skill: rec.skill_id,
        difficulty: rec.mastery_level < 30 ? 'Hard' : 'Medium',
        type: 'worksheet',
        language: 'en',
      };

      const { error: insertError } = await supabase.from('content_requests').insert({
        org_id: rec.org_id,
        requested_by: rec.teacher_id,
        status: 'queued',
        request_type: 'worksheet',
        grade: rec.grade,
        subject: rec.subject,
        skill: rec.skill_id,
        difficulty: prompt.difficulty,
        language: 'en',
        prompt,
      });

      if (insertError) console.error('Failed to queue content:', insertError);

      await supabase.from('student_engagement').insert({
        student_id: rec.student_id,
        event_type: 'adaptive_assignment',
        skill_id: rec.skill_id,
        timestamp: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ success: true, assigned: lowMastery.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('adaptive_content_assign error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
