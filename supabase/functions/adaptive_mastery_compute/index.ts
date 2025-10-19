import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

/**
 * Edge Function: adaptive_mastery_compute
 * Aggregates recent performance and engagement data,
 * dynamically computes and updates student skill mastery levels.
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { studentId, skillId, subject, timeWindowDays = 30 } = await req.json();

    if (!studentId) {
      return new Response(JSON.stringify({ error: 'studentId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const skills = skillId ? [{ skillId, subject }] : await getStudentSkills(studentId);
    const results = [];

    for (const skill of skills) {
      const metrics = await computeMasteryMetrics(studentId, skill.skillId, skill.subject, timeWindowDays);
      const update = await updateStudentMastery(studentId, skill.skillId, skill.subject, metrics);
      results.push(update);
    }

    return new Response(
      JSON.stringify({ success: true, studentId, updatedSkills: results.length, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('adaptive_mastery_compute error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getStudentSkills(studentId) {
  const { data, error } = await supabase.from('student_skill_mastery').select('skill_id, subject').eq('student_id', studentId);
  if (error) throw error;
  return data.map(({ skill_id, subject }) => ({ skillId: skill_id, subject }));
}

async function computeMasteryMetrics(studentId, skillId, subject, timeWindowDays) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - timeWindowDays);

  const { data: performance, error: perfErr } = await supabase
    .from('student_performance')
    .select('*')
    .eq('student_id', studentId)
    .eq('skill_id', skillId)
    .eq('subject', subject)
    .gte('timestamp', cutoff.toISOString())
    .order('timestamp', { ascending: false });

  if (perfErr) throw perfErr;

  const { data: engagement, error: engErr } = await supabase
    .from('student_engagement')
    .select('*')
    .eq('student_id', studentId)
    .gte('date', cutoff.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (engErr) throw engErr;

  const accuracy = calculateAccuracy(performance);
  const consistency = calculateConsistency(performance);
  const progression = calculateProgression(performance);
  const engagementScore = calculateEngagement(engagement);
  const confidenceScore = calculateConfidence(accuracy, consistency, progression);
  const masteryLevel = calculateMasteryLevel(accuracy, consistency, progression, engagementScore);

  return { accuracy, consistency, progression, engagement: engagementScore, confidenceScore, masteryLevel };
}

function calculateAccuracy(performance) {
  if (!performance?.length) return 0;
  const correct = performance.filter((p) => p.is_correct).length;
  return correct / performance.length;
}

function calculateConsistency(performance) {
  if (!performance || performance.length < 3) return 0;
  const windowSize = Math.min(5, performance.length);
  const accuracies = [];
  for (let i = 0; i <= performance.length - windowSize; i++) {
    const window = performance.slice(i, i + windowSize);
    accuracies.push(calculateAccuracy(window));
  }
  const variance = calculateVariance(accuracies);
  return Math.max(0, 1 - variance);
}

function calculateProgression(performance) {
  if (!performance || performance.length < 5) return 0;
  const midpoint = Math.floor(performance.length / 2);
  const recent = performance.slice(0, midpoint);
  const older = performance.slice(midpoint);
  const recentAcc = calculateAccuracy(recent);
  const olderAcc = calculateAccuracy(older);
  return Math.max(0, Math.min(1, recentAcc - olderAcc + 0.5));
}

function calculateEngagement(engagement) {
  if (!engagement?.length) return 0;
  const total = engagement.reduce((sum, e) => sum + e.engagement_score, 0);
  return total / engagement.length;
}

function calculateConfidence(accuracy, consistency, progression) {
  return accuracy * 0.4 + consistency * 0.3 + progression * 0.3;
}

function calculateMasteryLevel(accuracy, consistency, progression, engagement) {
  const base = accuracy * 0.35 + consistency * 0.25 + progression * 0.2 + engagement * 0.2;
  if (base >= 0.85) return Math.min(1, base);
  if (base >= 0.7) return base * 0.9;
  if (base >= 0.5) return base * 0.8;
  return base * 0.7;
}

function calculateVariance(nums) {
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  return nums.reduce((a, n) => a + Math.pow(n - mean, 2), 0) / nums.length;
}

async function updateStudentMastery(studentId, skillId, subject, metrics) {
  const { data, error } = await supabase
    .from('student_skill_mastery')
    .upsert({
      student_id: studentId,
      skill_id: skillId,
      subject: subject,
      mastery_level: metrics.masteryLevel,
      confidence_score: metrics.confidenceScore,
      last_assessment_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'student_id,skill_id,subject' })
    .select()
    .single();
  if (error) throw error;
  return data;
}
