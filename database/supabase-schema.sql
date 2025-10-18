-- ===============================================
-- ALFANUMRIK SUPABASE DATABASE SCHEMA
-- ===============================================
-- Run this SQL in your Supabase SQL Editor
-- This creates the complete database schema for pilot deployment

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ===============================================
-- USER PROFILES TABLE
-- ===============================================
-- Extends auth.users with app-specific profile data
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    role text check (role in ('student','teacher','parent','admin')) not null default 'student',
    full_name text,
    grade text,
    school_name text,
    org_id uuid, -- For multi-tenant school organization
    avatar_url text,
    preferences jsonb default '{}',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Auto-update timestamp trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_profiles_updated_at
    before update on public.profiles
    for each row
    execute procedure update_updated_at_column();

-- ===============================================
-- PERFORMANCE TRACKING TABLE
-- ===============================================
create table if not exists public.performance (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references auth.users(id) on delete cascade not null,
    subject text not null,
    chapter text not null,
    score integer not null check (score >= 0 and score <= 100),
    total_questions integer not null default 10,
    type text check (type in ('quiz','exercise','diagnostic','practice','exam')) not null default 'quiz',
    difficulty text check (difficulty in ('Easy','Medium','Hard')) default 'Medium',
    time_spent_seconds integer default 0,
    completed_date timestamptz not null default now(),
    created_at timestamptz default now()
);

-- Optimized indexes for performance queries
create index if not exists idx_performance_student_date 
    on public.performance (student_id, completed_date desc);
create index if not exists idx_performance_subject_score 
    on public.performance (student_id, subject, score desc);
create index if not exists idx_performance_chapter 
    on public.performance (student_id, subject, chapter);

-- ===============================================
-- STUDY GOALS TABLE
-- ===============================================
create table if not exists public.study_goals (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references auth.users(id) on delete cascade not null,
    text text not null,
    is_completed boolean not null default false,
    due_date date,
    priority text check (priority in ('low','medium','high')) default 'medium',
    category text check (category in ('daily','weekly','monthly','exam-prep')) default 'daily',
    created_at timestamptz default now(),
    completed_at timestamptz
);

-- Update completed_at when is_completed changes to true
create or replace function update_goal_completed_at()
returns trigger as $$
begin
    if new.is_completed = true and old.is_completed = false then
        new.completed_at = now();
    elsif new.is_completed = false then
        new.completed_at = null;
    end if;
    return new;
end;
$$ language 'plpgsql';

create trigger update_study_goals_completed_at
    before update on public.study_goals
    for each row
    execute procedure update_goal_completed_at();

create index if not exists idx_study_goals_student 
    on public.study_goals (student_id, is_completed, created_at desc);

-- ===============================================
-- ACHIEVEMENTS TABLE
-- ===============================================
create table if not exists public.achievements (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    description text,
    icon text not null default '🏆',
    points integer not null default 0,
    category text check (category in ('academic','streak','improvement','milestone','special')) not null default 'academic',
    metadata jsonb default '{}', -- For storing additional achievement data
    created_at timestamptz default now()
);

create index if not exists idx_achievements_student 
    on public.achievements (student_id, created_at desc);
create index if not exists idx_achievements_category 
    on public.achievements (student_id, category);

-- ===============================================
-- STUDENT QUESTIONS TABLE (Doubt Solver)
-- ===============================================
create table if not exists public.questions (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references auth.users(id) on delete cascade not null,
    subject text not null,
    chapter text not null,
    concept text not null,
    question_text text not null,
    ai_response text,
    is_resolved boolean not null default false,
    teacher_note text, -- For teacher to add additional guidance
    created_at timestamptz default now(),
    resolved_at timestamptz
);

-- Update resolved_at when AI response is added
create or replace function update_question_resolved_at()
returns trigger as $$
begin
    if new.ai_response is not null and old.ai_response is null then
        new.is_resolved = true;
        new.resolved_at = now();
    end if;
    return new;
end;
$$ language 'plpgsql';

create trigger update_questions_resolved_at
    before update on public.questions
    for each row
    execute procedure update_question_resolved_at();

create index if not exists idx_questions_student 
    on public.questions (student_id, created_at desc);
create index if not exists idx_questions_concept 
    on public.questions (student_id, subject, concept);

-- ===============================================
-- LEARNING STREAKS TABLE
-- ===============================================
create table if not exists public.learning_streaks (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references auth.users(id) on delete cascade not null unique,
    current_streak integer not null default 0,
    longest_streak integer not null default 0,
    last_activity_date date not null default current_date,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create trigger update_learning_streaks_updated_at
    before update on public.learning_streaks
    for each row
    execute procedure update_updated_at_column();

-- ===============================================
-- ORGANIZATIONS TABLE (For Multi-School Support)
-- ===============================================
create table if not exists public.organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    type text check (type in ('school','district','coaching')) not null default 'school',
    domain text, -- Email domain for auto-assignment
    settings jsonb default '{}',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create trigger update_organizations_updated_at
    before update on public.organizations
    for each row
    execute procedure update_updated_at_column();

-- ===============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===============================================
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.performance enable row level security;
alter table public.study_goals enable row level security;
alter table public.achievements enable row level security;
alter table public.questions enable row level security;
alter table public.learning_streaks enable row level security;
alter table public.organizations enable row level security;

-- PROFILES: Users can read/update their own profile
create policy "Users can view own profile" on public.profiles
    for select using ( auth.uid() = id );

create policy "Users can update own profile" on public.profiles
    for update using ( auth.uid() = id )
    with check ( auth.uid() = id );

create policy "Users can insert own profile" on public.profiles
    for insert with check ( auth.uid() = id );

-- PERFORMANCE: Students can CRUD their own performance data
create policy "Students own performance data" on public.performance
    for all using ( auth.uid() = student_id )
    with check ( auth.uid() = student_id );

-- STUDY GOALS: Students can CRUD their own goals
create policy "Students own study goals" on public.study_goals
    for all using ( auth.uid() = student_id )
    with check ( auth.uid() = student_id );

-- ACHIEVEMENTS: Students can read their own achievements, system can insert
create policy "Students read own achievements" on public.achievements
    for select using ( auth.uid() = student_id );

create policy "System can insert achievements" on public.achievements
    for insert with check ( auth.uid() = student_id );

-- QUESTIONS: Students can CRUD their own questions
create policy "Students own questions" on public.questions
    for all using ( auth.uid() = student_id )
    with check ( auth.uid() = student_id );

-- LEARNING STREAKS: Students can read/update their own streaks
create policy "Students own learning streaks" on public.learning_streaks
    for all using ( auth.uid() = student_id )
    with check ( auth.uid() = student_id );

-- ORGANIZATIONS: Members can read their organization
create policy "Members can view organization" on public.organizations
    for select using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.org_id = organizations.id
        )
    );

-- ===============================================
-- TEACHER ACCESS POLICIES (For Future Enhancement)
-- ===============================================
-- Teachers can view students in their organization
-- (Enable these when you add teacher role management)

/*
create policy "Teachers view org students performance" on public.performance
    for select using (
        exists (
            select 1 from public.profiles teacher_profile, public.profiles student_profile
            where teacher_profile.id = auth.uid()
            and teacher_profile.role = 'teacher'
            and student_profile.id = performance.student_id
            and student_profile.org_id = teacher_profile.org_id
        )
    );

create policy "Teachers view org students goals" on public.study_goals
    for select using (
        exists (
            select 1 from public.profiles teacher_profile, public.profiles student_profile
            where teacher_profile.id = auth.uid()
            and teacher_profile.role = 'teacher'
            and student_profile.id = study_goals.student_id
            and student_profile.org_id = teacher_profile.org_id
        )
    );
*/

-- ===============================================
-- HELPFUL VIEWS FOR ANALYTICS
-- ===============================================

-- Student performance summary view
create or replace view public.student_performance_summary as
select 
    p.student_id,
    pr.full_name as student_name,
    pr.grade,
    pr.school_name,
    p.subject,
    count(*) as total_attempts,
    round(avg(p.score), 2) as average_score,
    max(p.score) as best_score,
    min(p.score) as lowest_score,
    max(p.completed_date) as last_attempt,
    count(case when p.score >= 80 then 1 end) as high_scores,
    count(case when p.score < 60 then 1 end) as low_scores
from public.performance p
join public.profiles pr on pr.id = p.student_id
group by p.student_id, pr.full_name, pr.grade, pr.school_name, p.subject;

-- Learning streak summary view
create or replace view public.learning_progress_summary as
select 
    pr.id as student_id,
    pr.full_name as student_name,
    pr.grade,
    pr.school_name,
    ls.current_streak,
    ls.longest_streak,
    ls.last_activity_date,
    count(p.id) as total_activities,
    count(sg.id) as total_goals,
    count(case when sg.is_completed then 1 end) as completed_goals,
    count(a.id) as total_achievements,
    coalesce(sum(a.points), 0) as total_points
from public.profiles pr
left join public.learning_streaks ls on ls.student_id = pr.id
left join public.performance p on p.student_id = pr.id and p.created_at > current_date - interval '30 days'
left join public.study_goals sg on sg.student_id = pr.id
left join public.achievements a on a.student_id = pr.id
where pr.role = 'student'
group by pr.id, pr.full_name, pr.grade, pr.school_name, ls.current_streak, ls.longest_streak, ls.last_activity_date;

-- ===============================================
-- FUNCTIONS FOR DATA MANAGEMENT
-- ===============================================

-- Function to update learning streak
create or replace function update_learning_streak(user_id uuid)
returns void as $$
declare
    current_streak_record public.learning_streaks%rowtype;
    today_date date := current_date;
    yesterday_date date := current_date - interval '1 day';
begin
    -- Get or create streak record
    select * into current_streak_record 
    from public.learning_streaks 
    where student_id = user_id;
    
    if not found then
        -- Create new streak record
        insert into public.learning_streaks (student_id, current_streak, longest_streak, last_activity_date)
        values (user_id, 1, 1, today_date);
    else
        if current_streak_record.last_activity_date = yesterday_date then
            -- Continue streak
            update public.learning_streaks 
            set 
                current_streak = current_streak_record.current_streak + 1,
                longest_streak = greatest(current_streak_record.longest_streak, current_streak_record.current_streak + 1),
                last_activity_date = today_date,
                updated_at = now()
            where student_id = user_id;
        elsif current_streak_record.last_activity_date = today_date then
            -- Already updated today, do nothing
            null;
        else
            -- Streak broken, restart
            update public.learning_streaks 
            set 
                current_streak = 1,
                last_activity_date = today_date,
                updated_at = now()
            where student_id = user_id;
        end if;
    end if;
end;
$$ language plpgsql;

-- Function to award achievement
create or replace function award_achievement(
    user_id uuid,
    achievement_title text,
    achievement_description text,
    achievement_icon text default '🏆',
    achievement_points integer default 10,
    achievement_category text default 'academic'
)
returns uuid as $$
declare
    achievement_id uuid;
begin
    -- Check if student already has this achievement (prevent duplicates)
    if exists (
        select 1 from public.achievements 
        where student_id = user_id 
        and title = achievement_title 
        and created_at::date = current_date
    ) then
        return null; -- Achievement already awarded today
    end if;
    
    -- Insert new achievement
    insert into public.achievements (
        student_id, title, description, icon, points, category
    ) values (
        user_id, achievement_title, achievement_description, 
        achievement_icon, achievement_points, achievement_category
    ) returning id into achievement_id;
    
    return achievement_id;
end;
$$ language plpgsql;

-- ===============================================
-- TRIGGERS FOR AUTOMATIC ACHIEVEMENTS
-- ===============================================

-- Trigger to award achievements based on performance
create or replace function check_performance_achievements()
returns trigger as $$
begin
    -- First perfect score
    if new.score = 100 then
        perform award_achievement(
            new.student_id,
            'Perfect Score! 💯',
            'Achieved 100% in ' || new.chapter,
            '💯',
            25,
            'academic'
        );
    end if;
    
    -- Consistent performer (5 scores above 80%)
    if (
        select count(*) 
        from public.performance 
        where student_id = new.student_id 
        and score >= 80 
        and created_at > current_date - interval '7 days'
    ) = 5 then
        perform award_achievement(
            new.student_id,
            'Consistent Performer 🎯',
            'Scored 80%+ in 5 recent attempts',
            '🎯',
            50,
            'streak'
        );
    end if;
    
    -- Update learning streak
    perform update_learning_streak(new.student_id);
    
    return new;
end;
$$ language plpgsql;

create trigger performance_achievements_trigger
    after insert on public.performance
    for each row
    execute procedure check_performance_achievements();

-- ===============================================
-- INITIAL DATA AND SETUP
-- ===============================================

-- Create default organization (can be updated later)
insert into public.organizations (id, name, type, domain) 
values (
    gen_random_uuid(), 
    'Alfanumrik Pilot School', 
    'school', 
    'alfanumrik.edu'
) on conflict do nothing;

-- ===============================================
-- ANALYTICS FUNCTIONS (For Teacher Dashboards)
-- ===============================================

-- Get class performance summary
create or replace function get_class_performance(org_uuid uuid, grade_filter text default null)
returns table(
    subject text,
    chapter text,
    avg_score numeric,
    total_attempts bigint,
    students_attempted bigint,
    last_updated timestamptz
) as $$
begin
    return query
    select 
        p.subject,
        p.chapter,
        round(avg(p.score), 2) as avg_score,
        count(p.id) as total_attempts,
        count(distinct p.student_id) as students_attempted,
        max(p.completed_date) as last_updated
    from public.performance p
    join public.profiles pr on pr.id = p.student_id
    where pr.org_id = org_uuid
    and (grade_filter is null or pr.grade = grade_filter)
    and p.completed_date > current_date - interval '30 days'
    group by p.subject, p.chapter
    order by avg_score desc;
end;
$$ language plpgsql;

-- Get student progress report
create or replace function get_student_report(student_uuid uuid)
returns jsonb as $$
declare
    result jsonb;
begin
    select jsonb_build_object(
        'student_info', (
            select jsonb_build_object(
                'name', full_name,
                'grade', grade,
                'school', school_name
            )
            from public.profiles 
            where id = student_uuid
        ),
        'performance_summary', (
            select jsonb_agg(
                jsonb_build_object(
                    'subject', subject,
                    'avg_score', round(avg(score), 2),
                    'total_attempts', count(*),
                    'best_score', max(score),
                    'recent_trend', (
                        case 
                            when avg(case when completed_date > current_date - interval '7 days' then score end) > 
                                 avg(case when completed_date between current_date - interval '14 days' and current_date - interval '7 days' then score end)
                            then 'improving'
                            when avg(case when completed_date > current_date - interval '7 days' then score end) < 
                                 avg(case when completed_date between current_date - interval '14 days' and current_date - interval '7 days' then score end)
                            then 'declining'  
                            else 'stable'
                        end
                    )
                )
            )
            from public.performance 
            where student_id = student_uuid 
            and completed_date > current_date - interval '30 days'
            group by subject
        ),
        'achievements_count', (
            select count(*) 
            from public.achievements 
            where student_id = student_uuid
        ),
        'goals_progress', (
            select jsonb_build_object(
                'total', count(*),
                'completed', count(case when is_completed then 1 end),
                'completion_rate', round(100.0 * count(case when is_completed then 1 end) / count(*), 1)
            )
            from public.study_goals 
            where student_id = student_uuid
        ),
        'learning_streak', (
            select jsonb_build_object(
                'current', current_streak,
                'longest', longest_streak,
                'last_activity', last_activity_date
            )
            from public.learning_streaks 
            where student_id = student_uuid
        )
    ) into result;
    
    return result;
end;
$$ language plpgsql;

-- ===============================================
-- SETUP COMPLETION
-- ===============================================

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all functions in schema public to anon, authenticated;

-- Success message
do $$
begin
    raise notice '✅ Alfanumrik database schema created successfully!';
    raise notice '📊 Tables created: profiles, performance, study_goals, achievements, questions, learning_streaks, organizations';
    raise notice '🔒 Row Level Security enabled with student-owned data policies';
    raise notice '🎯 Analytics views and functions ready for teacher dashboards';
    raise notice '🚀 Your Alfanumrik app is now ready for multi-user, cloud-synced pilot deployment!';
end $$;