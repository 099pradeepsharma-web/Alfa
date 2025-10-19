-- Seed ALMS test data

INSERT INTO public.profiles (id, full_name, role, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Alice Student', 'student', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Bob Teacher', 'teacher', NOW());

INSERT INTO public.skills (id, name, subject, grade_level, created_at) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Algebra Basics', 'Mathematics', 'Grade 8', NOW()),
  ('44444444-4444-4444-4444-444444444444', 'Reading Comprehension', 'English', 'Grade 7', NOW());

INSERT INTO public.class_assignments (id, student_id, teacher_id, created_at) VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', NOW());

INSERT INTO public.quiz_results (id, student_id, skill_id, score, taken_at) VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 75, NOW()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 85, NOW());

INSERT INTO public.risk_scores (id, student_id, skill_id, score, computed_at) VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 20, NOW());

INSERT INTO public.student_skill_mastery (student_id, skill_id, mastery_level, last_assessed) VALUES
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 60, NOW()),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 70, NOW());
