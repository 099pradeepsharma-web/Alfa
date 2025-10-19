import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async () => {
  try {
    const { data: students, error } = await supabase.from('profiles').select('id').eq('role', 'student');
    if (error) throw error;
    if (!students || students.length === 0) return new Response('No students found.', { status: 200 });

    for (const student of students) {
      const { data: mastery, error: rpcError } = await supabase.rpc('compute_student_mastery', { student_uuid: student.id });
      if (rpcError) {
        console.error(`RPC error for student ${student.id}`, rpcError);
        continue;
      }
      if (!mastery) continue;

      for (const record of mastery) {
        const { error: upsertError } = await supabase.from('student_skill_mastery').upsert({
          student_id: student.id,
          skill_id: record.skill_id,
          mastery_level: record.mastery_level,
          last_assessed: new Date().toISOString()
        });
        if (upsertError) console.error(`Upsert error for student ${student.id}, skill ${record.skill_id}`, upsertError);
      }
    }
    return new Response('Mastery computation finished.', { status: 200 });
  } catch (error) {
    console.error('adaptive_mastery_compute error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});
