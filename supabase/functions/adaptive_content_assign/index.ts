import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async () => {
  try {
    const { data: lowMastery, error } = await supabase.rpc('get_students_needing_practice');
    if (error) throw error;
    if (!lowMastery || lowMastery.length === 0) return new Response('No low mastery students.', { status: 200 });

    for (const rec of lowMastery) {
      const prompt = {
        skill: rec.skill_id,
        difficulty: rec.mastery_level < 30 ? 'Hard' : 'Medium',
        type: 'worksheet',
        language: 'en'
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
        prompt
      });
      if (insertError) console.error('Failed to queue content:', insertError);
      await supabase.from('student_engagement').insert({
        student_id: rec.student_id,
        event_type: 'adaptive_assignment',
        skill_id: rec.skill_id,
        timestamp: new Date().toISOString()
      });
    }
    return new Response(`Assigned content to ${lowMastery.length} students.`, { status: 200 });
  } catch (error) {
    console.error('adaptive_content_assign error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});