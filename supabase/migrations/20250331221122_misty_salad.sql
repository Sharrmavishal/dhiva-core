/*
  # Organization Features Implementation

  1. New Fields
    - Add course_type to courses table
    - Add organization-specific fields
  
  2. New Tables
    - org_learners for managing organization subscribers
    
  3. Security
    - RLS policies for new tables and fields
    - Secure access patterns for org data
*/

-- Add course_type to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS
  course_type text NOT NULL DEFAULT 'personal'
  CHECK (course_type IN ('personal', 'public', 'org'));

-- Create org_learners table
CREATE TABLE IF NOT EXISTS org_learners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id),
  name text NOT NULL,
  phone_number text,
  email text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'completed')),
  subscribed_at timestamptz DEFAULT now(),
  -- Ensure at least one contact method is provided
  CONSTRAINT contact_method_required 
    CHECK (phone_number IS NOT NULL OR email IS NOT NULL)
);

-- Enable RLS
ALTER TABLE org_learners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for org_learners
CREATE POLICY "Course owners can view their learners"
  ON org_learners
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = org_learners.course_id
    AND courses.user_id = auth.uid()
  ));

CREATE POLICY "Course owners can add learners"
  ON org_learners
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = org_learners.course_id
    AND courses.user_id = auth.uid()
  ));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_learners_course
  ON org_learners(course_id);

CREATE INDEX IF NOT EXISTS idx_org_learners_status
  ON org_learners(status);

CREATE INDEX IF NOT EXISTS idx_courses_type
  ON courses(course_type);