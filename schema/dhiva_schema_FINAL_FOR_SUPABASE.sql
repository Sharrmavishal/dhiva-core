-- DHIVA FINAL SCHEMA PATCH (VALIDATED)
-- Generated on 2025-04-05 05:58:26
-- Validated on 2025-04-05 06:04:00
-- Includes: Self-paced learning support, multi-language handling, conflict resolution, learner personalization

-- 1. COURSE_SUBSCRIBERS UPDATES FOR SELF-PACED TRACKING
ALTER TABLE public.course_subscribers
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_delivery_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_scheduled_delivery TIMESTAMPTZ;

-- Add index for efficient delivery scheduling queries
CREATE INDEX IF NOT EXISTS idx_course_subscribers_next_delivery 
ON public.course_subscribers(next_scheduled_delivery) 
WHERE next_scheduled_delivery IS NOT NULL;

-- 2. MULTI-LANGUAGE SUPPORT IN PDF_UPLOADS
ALTER TABLE public.pdf_uploads
ADD COLUMN IF NOT EXISTS primary_language TEXT,
ADD COLUMN IF NOT EXISTS detected_languages TEXT[];

-- Add constraint for standard language codes (ISO 639-1)
ALTER TABLE public.pdf_uploads
ADD CONSTRAINT pdf_uploads_primary_language_check 
CHECK (primary_language IS NULL OR length(primary_language) = 2);

-- Add index for language-based filtering
CREATE INDEX IF NOT EXISTS idx_pdf_uploads_primary_language 
ON public.pdf_uploads(primary_language) 
WHERE primary_language IS NOT NULL;

-- 3. LANGUAGE CODE IN MICROLEARNINGS
ALTER TABLE public.microlearnings
ADD COLUMN IF NOT EXISTS language_code TEXT;

-- Add constraint for standard language codes (ISO 639-1)
ALTER TABLE public.microlearnings
ADD CONSTRAINT microlearnings_language_code_check 
CHECK (language_code IS NULL OR length(language_code) = 2);

-- Add index for language-based filtering
CREATE INDEX IF NOT EXISTS idx_microlearnings_language_code 
ON public.microlearnings(language_code) 
WHERE language_code IS NOT NULL;

-- 4. NEW: PDF_LANGUAGE_SECTIONS
CREATE TABLE IF NOT EXISTS public.pdf_language_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pdf_upload_id UUID REFERENCES pdf_uploads(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    section TEXT NOT NULL,
    extracted_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT pdf_language_sections_language_check CHECK (length(language) = 2)
);

-- Add index for efficient filtering by PDF
CREATE INDEX IF NOT EXISTS idx_pdf_language_sections_pdf_upload_id 
ON public.pdf_language_sections(pdf_upload_id);

-- 5. NEW: LEARNER_LANGUAGE_PREFERENCES
CREATE TABLE IF NOT EXISTS public.learner_language_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    preferred_language TEXT NOT NULL,
    fluency_level TEXT DEFAULT 'basic',
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT learner_language_preferences_user_course_unique UNIQUE (user_id, course_id),
    CONSTRAINT learner_language_preferences_preferred_language_check CHECK (length(preferred_language) = 2),
    CONSTRAINT learner_language_preferences_fluency_level_check CHECK (
        fluency_level IN ('basic', 'intermediate', 'advanced', 'native')
    )
);

-- Add indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_learner_language_preferences_user_id 
ON public.learner_language_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_learner_language_preferences_course_id 
ON public.learner_language_preferences(course_id);

-- 6. CONFLICT RESOLUTION TRACKING
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS conflict_resolution_mode TEXT DEFAULT 'auto_recent';

-- Add constraint for valid conflict resolution modes
ALTER TABLE public.courses
ADD CONSTRAINT courses_conflict_resolution_mode_check 
CHECK (conflict_resolution_mode IN ('auto_recent', 'auto_rated', 'manual', 'edited_plan_override', 'primary_pdf_only'));

CREATE TABLE IF NOT EXISTS public.pdf_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_pdf_id UUID REFERENCES pdf_uploads(id) ON DELETE CASCADE,
    related_pdf_id UUID REFERENCES pdf_uploads(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL CHECK (relation_type IN ('update', 'merge', 'supplement')),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT pdf_relationships_different_pdfs CHECK (source_pdf_id != related_pdf_id)
);

-- Add indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_pdf_relationships_source_pdf_id 
ON public.pdf_relationships(source_pdf_id);

CREATE INDEX IF NOT EXISTS idx_pdf_relationships_related_pdf_id 
ON public.pdf_relationships(related_pdf_id);

CREATE TABLE IF NOT EXISTS public.content_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    content_id UUID, -- Assuming this references microlearnings but keeping flexible
    conflict_type TEXT NOT NULL,
    resolution_status TEXT DEFAULT 'pending',
    flagged_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT content_conflicts_conflict_type_check CHECK (
        conflict_type IN ('contradiction', 'redundancy', 'overlap', 'inconsistency')
    ),
    CONSTRAINT content_conflicts_resolution_status_check CHECK (
        resolution_status IN ('pending', 'resolved', 'ignored', 'auto_resolved')
    )
);

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_content_conflicts_topic_id 
ON public.content_conflicts(topic_id);

CREATE INDEX IF NOT EXISTS idx_content_conflicts_content_id 
ON public.content_conflicts(content_id) 
WHERE content_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.content_source_attribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID, -- Assuming this references microlearnings but keeping flexible
    source_pdf_id UUID REFERENCES pdf_uploads(id) ON DELETE CASCADE,
    extracted_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_content_source_attribution_content_id 
ON public.content_source_attribution(content_id) 
WHERE content_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_content_source_attribution_source_pdf_id 
ON public.content_source_attribution(source_pdf_id);

-- Add comment explaining content_id columns
COMMENT ON COLUMN public.content_conflicts.content_id IS 
'References content (likely microlearnings) but kept as UUID without FK for flexibility';

COMMENT ON COLUMN public.content_source_attribution.content_id IS 
'References content (likely microlearnings) but kept as UUID without FK for flexibility';