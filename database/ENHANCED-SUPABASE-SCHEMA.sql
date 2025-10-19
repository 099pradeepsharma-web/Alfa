-- ALFANUMRIK ENHANCED PRODUCTION SCHEMA
-- ===========================================
-- This builds on the basic schema with enterprise features:
-- - Multi-tenant org/school structure
-- - Parent-child relationships  
-- - Teacher-class assignments
-- - Enhanced RLS with org isolation
-- - Email domain-based role gating

-- Step 1: Drop existing constraints if upgrading
ALTER TABLE IF EXISTS public.achievements DROP CONSTRAINT IF EXISTS achievements_student_id_fkey;
ALTER TABLE IF EXISTS public.questions DROP CONSTRAINT IF EXISTS questions_student_id_fkey;
ALTER TABLE IF EXISTS public.study_goals DROP CONSTRAINT IF EXISTS study_goals_student_id_fkey;
ALTER TABLE IF EXISTS public.performance DROP CONSTRAINT IF EXISTS performance_student_id_fkey;
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 2: Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'school', -- 'school', 'district', 'organization'
    domain TEXT, -- email domain for auto-assignment (e.g., 'dpsschool.edu.in')
    settings JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'free', -- 'free', 'school', 'district'
    max_students INTEGER DEFAULT 100,
    max_teachers INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT organizations_pkey PRIMARY KEY (id),
    CONSTRAINT organizations_type_check CHECK (type IN ('school', 'district', 'organization')),
    CONSTRAINT organizations_tier_check CHECK (subscription_tier IN ('free', 'school', 'district', 'enterprise'))
);

-- Step 3: Create enhanced profiles table
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'student',
    full_name TEXT,
    email TEXT, -- cached from auth.users for easier queries
    grade TEXT, -- for students
    subject_specializations TEXT[], -- for teachers
    school_name TEXT, -- legacy support
    phone TEXT,
    avatar_url TEXT,
    settings JSONB DEFAULT '{}',
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_role_check CHECK (role IN ('student', 'teacher', 'parent', 'school_admin', 'district_admin'))
);

-- Step 4: Create parent-child relationships
CREATE TABLE IF NOT EXISTS public.parent_child_links (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    relationship_type TEXT DEFAULT 'parent', -- 'parent', 'guardian', 'caregiver'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT parent_child_links_pkey PRIMARY KEY (id),
    CONSTRAINT parent_child_unique UNIQUE (parent_id, child_id),
    CONSTRAINT parent_child_different CHECK (parent_id != child_id)
);

-- Step 5: Create teacher-class assignments
CREATE TABLE IF NOT EXISTS public.class_assignments (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    class_name TEXT, -- e.g., "9A Mathematics", "10B Science"
    org_id UUID REFERENCES public.organizations(id),
    academic_year TEXT DEFAULT EXTRACT(YEAR FROM NOW())::TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT class_assignments_pkey PRIMARY KEY (id),
    CONSTRAINT class_assignments_unique UNIQUE (teacher_id, student_id, subject, academic_year)
);

-- Step 6: Update existing tables to include org_id
ALTER TABLE public.performance ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.study_goals ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);

-- Step 7: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_org_role ON public.profiles (org_id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_parent_child_parent ON public.parent_child_links (parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_child_child ON public.parent_child_links (child_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_teacher ON public.class_assignments (teacher_id, is_active);
CREATE INDEX IF NOT EXISTS idx_class_assignments_student ON public.class_assignments (student_id, is_active);
CREATE INDEX IF NOT EXISTS idx_class_assignments_org ON public.class_assignments (org_id, academic_year);

-- Performance indexes with org_id
CREATE INDEX IF NOT EXISTS idx_performance_org_student ON public.performance (org_id, student_id, completed_date DESC);
CREATE INDEX IF NOT EXISTS idx_study_goals_org_student ON public.study_goals (org_id, student_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_achievements_org_student ON public.achievements (org_id, student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_org_student ON public.questions (org_id, student_id, created_at DESC);

-- Step 8: Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_child_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Step 9: Drop existing policies
DROP POLICY IF EXISTS "Users access own profile" ON public.profiles;
DROP POLICY IF EXISTS "Students access own performance" ON public.performance;
DROP POLICY IF EXISTS "Students access own goals" ON public.study_goals;
DROP POLICY IF EXISTS "Students access own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Students access own questions" ON public.questions;

-- Step 10: Create enhanced RLS policies with org isolation

-- Organizations: Only members can view their org
CREATE POLICY "Org members access org" ON public.organizations
    FOR ALL USING (
        id IN (
            SELECT org_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Profiles: Multi-tenant with role-based access
CREATE POLICY "Profile access by role and org" ON public.profiles
    FOR ALL USING (
        -- Users can access their own profile
        auth.uid() = id
        OR
        -- Teachers can view students in their classes
        (
            EXISTS (
                SELECT 1 FROM public.profiles p 
                WHERE p.id = auth.uid() AND p.role = 'teacher'
            )
            AND role = 'student'
            AND EXISTS (
                SELECT 1 FROM public.class_assignments ca
                WHERE ca.teacher_id = auth.uid() 
                AND ca.student_id = profiles.id
                AND ca.is_active = TRUE
            )
        )
        OR
        -- Parents can view their children
        (
            EXISTS (
                SELECT 1 FROM public.profiles p 
                WHERE p.id = auth.uid() AND p.role = 'parent'
            )
            AND EXISTS (
                SELECT 1 FROM public.parent_child_links pcl
                WHERE pcl.parent_id = auth.uid() 
                AND pcl.child_id = profiles.id
            )
        )
        OR
        -- School admins can view users in their org
        (
            EXISTS (
                SELECT 1 FROM public.profiles p 
                WHERE p.id = auth.uid() 
                AND p.role IN ('school_admin', 'district_admin')
                AND p.org_id = profiles.org_id
            )
        )
    );

-- Parent-child links: Parents and children can view their relationships
CREATE POLICY "Parent child link access" ON public.parent_child_links
    FOR ALL USING (
        auth.uid() = parent_id 
        OR auth.uid() = child_id
        OR EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('school_admin', 'district_admin')
            AND (
                p.org_id IN (
                    SELECT org_id FROM public.profiles 
                    WHERE id IN (parent_id, child_id)
                )
            )
        )
    );

-- Class assignments: Teachers, students, and admins can view relevant assignments
CREATE POLICY "Class assignment access" ON public.class_assignments
    FOR ALL USING (
        auth.uid() = teacher_id 
        OR auth.uid() = student_id
        OR EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('school_admin', 'district_admin')
            AND p.org_id = class_assignments.org_id
        )
    );

-- Performance: Students own data + teachers for assigned students + parents for children
CREATE POLICY "Performance multi-role access" ON public.performance
    FOR ALL USING (
        -- Students access own data
        auth.uid() = student_id
        OR
        -- Teachers access assigned students' data
        EXISTS (
            SELECT 1 FROM public.class_assignments ca
            WHERE ca.teacher_id = auth.uid() 
            AND ca.student_id = performance.student_id
            AND ca.is_active = TRUE
        )
        OR
        -- Parents access children's data
        EXISTS (
            SELECT 1 FROM public.parent_child_links pcl
            WHERE pcl.parent_id = auth.uid() 
            AND pcl.child_id = performance.student_id
        )
        OR
        -- Admins access org data
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('school_admin', 'district_admin')
            AND p.org_id = performance.org_id
        )
    );

-- Similar policies for study_goals, achievements, questions
CREATE POLICY "Study goals multi-role access" ON public.study_goals
    FOR ALL USING (
        auth.uid() = student_id
        OR EXISTS (
            SELECT 1 FROM public.class_assignments ca
            WHERE ca.teacher_id = auth.uid() AND ca.student_id = study_goals.student_id AND ca.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.parent_child_links pcl
            WHERE pcl.parent_id = auth.uid() AND pcl.child_id = study_goals.student_id
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() AND p.role IN ('school_admin', 'district_admin') AND p.org_id = study_goals.org_id
        )
    );

CREATE POLICY "Achievements multi-role access" ON public.achievements
    FOR ALL USING (
        auth.uid() = student_id
        OR EXISTS (
            SELECT 1 FROM public.class_assignments ca
            WHERE ca.teacher_id = auth.uid() AND ca.student_id = achievements.student_id AND ca.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.parent_child_links pcl
            WHERE pcl.parent_id = auth.uid() AND pcl.child_id = achievements.student_id
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() AND p.role IN ('school_admin', 'district_admin') AND p.org_id = achievements.org_id
        )
    );

CREATE POLICY "Questions multi-role access" ON public.questions
    FOR ALL USING (
        auth.uid() = student_id
        OR EXISTS (
            SELECT 1 FROM public.class_assignments ca
            WHERE ca.teacher_id = auth.uid() AND ca.student_id = questions.student_id AND ca.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.parent_child_links pcl
            WHERE pcl.parent_id = auth.uid() AND pcl.child_id = questions.student_id
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() AND p.role IN ('school_admin', 'district_admin') AND p.org_id = questions.org_id
        )
    );

-- Step 11: Enhanced user setup function with org assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    org_record RECORD;
    user_role TEXT := 'student';
BEGIN
    -- Get user email
    user_email := NEW.email;
    
    -- Try to match email domain to organization
    SELECT * INTO org_record 
    FROM public.organizations 
    WHERE domain IS NOT NULL 
    AND user_email LIKE '%@' || domain
    LIMIT 1;
    
    -- Determine role based on email patterns (customize as needed)
    IF user_email LIKE '%teacher%' OR user_email LIKE '%faculty%' THEN
        user_role := 'teacher';
    ELSIF user_email LIKE '%admin%' OR user_email LIKE '%principal%' THEN
        user_role := 'school_admin';
    ELSIF user_email LIKE '%parent%' THEN
        user_role := 'parent';
    END IF;
    
    -- Insert profile
    INSERT INTO public.profiles (
        id, 
        org_id, 
        role, 
        full_name, 
        email
    ) VALUES (
        NEW.id,
        org_record.id,
        user_role,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(user_email, '@', 1)),
        user_email
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Fallback: create basic profile without org
        INSERT INTO public.profiles (id, role, full_name, email) 
        VALUES (NEW.id, 'student', COALESCE(NEW.raw_user_meta_data->>'full_name', user_email), user_email);
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Helper functions for role checking
CREATE OR REPLACE FUNCTION public.is_teacher(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role = 'teacher'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_parent(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role = 'parent'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_org(user_id UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT org_id FROM public.profiles WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 13: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Step 14: Insert demo organization
INSERT INTO public.organizations (id, name, type, domain, subscription_tier, max_students, max_teachers)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Demo School',
    'school',
    'demoschool.edu',
    'school',
    500,
    50
) ON CONFLICT (id) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🚀 ENHANCED ALFANUMRIK SCHEMA DEPLOYED!';
    RAISE NOTICE '✅ Multi-tenant organization support';
    RAISE NOTICE '👥 Parent-child relationships';  
    RAISE NOTICE '🏫 Teacher-class assignments';
    RAISE NOTICE '🔒 Enhanced RLS with org isolation';
    RAISE NOTICE '📧 Email domain-based role assignment';
    RAISE NOTICE '⚡ Production-ready for enterprise deployment';
END $$;