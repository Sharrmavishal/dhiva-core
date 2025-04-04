/*
  # Add feedback tracking table and user status

  1. New Tables
    - `feedback`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `topic_id` (uuid, references topics)
      - `rating` (integer, 1-5)
      - `timestamp` (timestamptz)

  2. Changes
    - Add `status` column to `preferences` table
      - Values: 'active' or 'paused'
      - Default: 'active'

  3. Security
    - Enable RLS on `feedback` table
    - Add policies for authenticated users
*/

-- Add status to preferences
ALTER TABLE preferences 
ADD COLUMN IF NOT EXISTS status text 
DEFAULT 'active' 
CHECK (status IN ('active', 'paused'));

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES preferences(id) NOT NULL,
  topic_id uuid REFERENCES topics(id) NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  timestamp timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can insert own feedback"
  ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);