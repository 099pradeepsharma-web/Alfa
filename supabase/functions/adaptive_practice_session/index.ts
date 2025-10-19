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
    const { student_id, session_id, answer, question_id } = await req.json();

    if (!student_id) return new Response(JSON.stringify({ error: 'student_id required' }), { status: 400, headers: corsHeaders });
    if (!session_id) return new Response(JSON.stringify({ error: 'session_id required' }), { status: 400, headers: corsHeaders });
    if (!question_id) return new Response(JSON.stringify({ error: 'question_id required' }), { status: 400, headers: corsHeaders });
    if (!answer) return new Response(JSON.stringify({ error: 'answer required' }), { status: 400, headers: corsHeaders });

    // Get question data
    const { data: questionData, error: qError } = await supabase
      .from('practice_questions')
      .select('correct_option')
      .eq('id', question_id)
      .single();

    if (qError) throw qError;

    const isCorrect = questionData.correct_option === answer;

    // Update practice_questions record
    const { error: updateError } = await supabase
      .from('practice_questions')
      .update({
        answered_correctly: isCorrect,
        answered_at: new Date().toISOString(),
        reward_points_earned: isCorrect ? 10 : 0
      })
      .eq('id', question_id);

    if (updateError) throw updateError;

    // Update practice_sessions record
    let rewardPoints = 0;
    if (isCorrect) rewardPoints = 10;

    const { error: sessionError } = await supabase
      .from('practice_sessions')
      .update({
        total_questions: supabase.raw('total_questions + 1'),
        correct_answers: supabase.raw(`correct_answers + ${isCorrect ? 1 : 0}`),
        reward_points: supabase.raw(`reward_points + ${rewardPoints}`),
        updated_at: new Date().toISOString()
      })
      .eq('id', session_id);

    if (sessionError) throw sessionError;

    // Prepare next question (placeholder: fetch adaptive question logic or generate)
    const { data: nextQuestion, error: nextQError } = await supabase
      .from('practice_questions')
      .select('*')
      .eq('session_id', session_id)
      .is('answered_correctly', null)
      .limit(1)
      .single();

    if (nextQError) {
      return new Response(JSON.stringify({
        message: 'Practice session completed or no further questions.',
        correct_answer: questionData.correct_option,
        isCorrect
      }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({
      nextQuestion,
      correct_answer: questionData.correct_option,
      isCorrect
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('adaptive_practice_session error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
