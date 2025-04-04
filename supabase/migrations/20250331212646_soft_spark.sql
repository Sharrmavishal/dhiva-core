/*
  # Add PDF Course Management Tables

  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `audience_level` (text)
      - `generated_plan` (jsonb)
      - `status` (text - draft/approved/live)
      - `created_at` (timestamp)

    - `pdf_uploads`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `course_id` (uuid, references courses)
      - `file_url` (text)
      - `filename` (text)
      - `uploaded_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  audience_level text NOT NULL CHECK (audience_level IN ('beginner', 'intermediate', 'advanced')),
  generated_plan jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'live')),
  created_at timestamptz DEFAULT now()
);

-- Create pdf_uploads table
CREATE TABLE IF NOT EXISTS pdf_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  course_id uuid NOT NULL REFERENCES courses(id),
  file_url text NOT NULL,
  filename text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
CREATE POLICY "Users can read own courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own courses"
  ON courses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses"
  ON courses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for pdf_uploads
CREATE POLICY "Users can read own pdf uploads"
  ON pdf_uploads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pdf uploads"
  ON pdf_uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);