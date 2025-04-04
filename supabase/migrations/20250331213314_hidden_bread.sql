/*
  # Add public sharing features to courses

  1. Changes
    - Add to courses table:
      - `is_public` (boolean) - Controls if course is publicly shareable
      - `public_id` (uuid) - Unique identifier for public access
      - `qr_link` (text) - Generated QR code URL
      - `delivery_channel` (text) - Allowed delivery methods

  2. New Tables
    - `course_subscribers`
      - `id` (uuid, primary key)
      - `course_id` (uuid, references courses)
      - `contact_method` (text - email/whatsapp)
      - `contact_value` (text)
      - `subscribed_at` (timestamp)
      - `current_day` (integer)
      - `status` (text - active/completed/dropped)

  3. Security
    - Enable RLS on new table
    - Add policies for public course access
    - Add policies for subscriber management
*/

-- Add new columns to courses
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS public_id uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS qr_link text,
ADD COLUMN IF NOT EXISTS delivery_channel text DEFAULT 'both'
  CHECK (delivery_channel IN ('whatsapp', 'email', 'both'));

-- Create course_subscribers table
CREATE TABLE IF NOT EXISTS course_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id),
  contact_method text NOT NULL CHECK (contact_method IN ('email', 'whatsapp')),
  contact_value text NOT NULL,
  subscribed_at timestamptz DEFAULT now(),
  current_day integer DEFAULT 1,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  UNIQUE(course_id, contact_method, contact_value)
);

-- Enable RLS
ALTER TABLE course_subscribers ENABLE ROW LEVEL SECURITY;

-- Add policy for public course access
CREATE POLICY "Anyone can view public courses"
  ON courses
  FOR SELECT
  TO public
  USING (is_public = true);

-- Add policies for course subscribers
CREATE POLICY "Course owners can view their subscribers"
  ON course_subscribers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_subscribers.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can subscribe to public courses"
  ON course_subscribers
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_subscribers.course_id
      AND courses.is_public = true
    )
  );