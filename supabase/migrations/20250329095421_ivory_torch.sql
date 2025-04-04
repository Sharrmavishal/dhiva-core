/*
  # Create microlearnings table and related schemas

  1. New Tables
    - `topics`
      - `id` (uuid, primary key)
      - `name` (text)
      - `user_id` (uuid)
      - `competency_level` (text)
      - `pdf_url` (text, optional)
      - `created_at` (timestamp)
    
    - `microlearnings`
      - `id` (uuid, primary key)
      - `topic_id` (uuid, foreign key)
      - `day_number` (integer)
      - `type` (text - summary/quiz/poll/challenge)
      - `content` (text)
      - `status` (text - pending/sent)
      - `created_at` (timestamp)
      - `scheduled_for` (timestamp)
      - `sent_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read their own data
*/

-- Create topics table
CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid NOT NULL,
  competency_level text NOT NULL,
  pdf_url text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users (id)
);

-- Create microlearnings table
CREATE TABLE IF NOT EXISTS microlearnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES topics(id),
  day_number integer NOT NULL,
  type text NOT NULL CHECK (type IN ('summary', 'quiz', 'poll', 'challenge')),
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent')),
  created_at timestamptz DEFAULT now(),
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  CONSTRAINT fk_topic FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Enable RLS
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE microlearnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for topics
CREATE POLICY "Users can read own topics"
  ON topics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topics"
  ON topics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for microlearnings
CREATE POLICY "Users can read own microlearnings"
  ON microlearnings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM topics 
      WHERE topics.id = microlearnings.topic_id 
      AND topics.user_id = auth.uid()
    )
  );