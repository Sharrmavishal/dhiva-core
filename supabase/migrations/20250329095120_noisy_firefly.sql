/*
  # Create preferences table

  1. New Tables
    - `preferences`
      - `id` (uuid, primary key)
      - `email` (text, not null)
      - `phone_number` (text)
      - `delivery_modes` (text array)
      - `frequency` (text)
      - `custom_days` (text array)
      - `time_of_day` (text)
      - `consent_given` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `preferences` table
    - Add policy for authenticated users to read and update their own data
*/

CREATE TABLE IF NOT EXISTS preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  phone_number text,
  delivery_modes text[] NOT NULL,
  frequency text NOT NULL,
  custom_days text[],
  time_of_day text NOT NULL,
  consent_given boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own preferences"
  ON preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);