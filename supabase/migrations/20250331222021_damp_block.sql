/*
  # Org Alpha Extensions

  1. New Tables
    - `orgs` table for organization settings and branding
  
  2. Changes
    - Add `edited_plan` to courses table
    - Add indexes for analytics queries
    
  3. Security
    - Enable RLS on orgs table
    - Add policies for org management
*/

-- Create orgs table
CREATE TABLE IF NOT EXISTS orgs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  tagline text,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

-- Add edited_plan to courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS
  edited_plan jsonb;

-- Enable RLS
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orgs
CREATE POLICY "Users can manage their own orgs"
  ON orgs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for analytics
CREATE INDEX IF NOT EXISTS idx_learner_responses_course_day
  ON learner_responses(course_id, day_number);

CREATE INDEX IF NOT EXISTS idx_org_learners_completion
  ON org_learners(course_id, status);