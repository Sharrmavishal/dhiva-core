/*
  # Adaptive Learning System Implementation

  1. New Tables
    - `learner_profiles`
      - Stores initial preferences and learning style
      - Tracks current learning track version
    
    - `learner_responses`
      - Logs all interactions and scoring
      - Enables adaptive learning decisions

  2. Changes
    - Add track variations to existing tables
    - Enable comprehensive response tracking
    - Support adaptive content delivery

  3. Security
    - RLS policies for new tables
    - Secure access patterns for learner data
*/

-- Create learner_profiles table
CREATE TABLE IF NOT EXISTS learner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  course_id uuid NOT NULL REFERENCES courses(id),
  prior_exposure text NOT NULL CHECK (prior_exposure IN ('new', 'somewhat', 'experienced')),
  preferred_format text NOT NULL CHECK (preferred_format IN ('stories', 'quizzes', 'summaries')),
  self_assessed_level text NOT NULL CHECK (self_assessed_level IN ('beginner', 'intermediate', 'advanced')),
  track_version text NOT NULL DEFAULT 'B' CHECK (track_version IN ('A', 'B', 'C')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Create learner_responses table
CREATE TABLE IF NOT EXISTS learner_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  course_id uuid NOT NULL REFERENCES courses(id),
  day_number integer NOT NULL,
  message_sent text NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('summary', 'quiz', 'poll', 'challenge', 'recap')),
  user_reply text,
  engagement_score integer CHECK (engagement_score BETWEEN 0 AND 100),
  comprehension_score integer CHECK (comprehension_score BETWEEN 0 AND 100),
  track_version text NOT NULL DEFAULT 'B' CHECK (track_version IN ('A', 'B', 'C')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE learner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learner_profiles
CREATE POLICY "Users can read own learner profiles"
  ON learner_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learner profiles"
  ON learner_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learner profiles"
  ON learner_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for learner_responses
CREATE POLICY "Users can read own responses"
  ON learner_responses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responses"
  ON learner_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_learner_responses_user_course
  ON learner_responses(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_learner_responses_scores
  ON learner_responses(engagement_score, comprehension_score);

CREATE INDEX IF NOT EXISTS idx_learner_profiles_user_course
  ON learner_profiles(user_id, course_id);