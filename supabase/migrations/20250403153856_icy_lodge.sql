/*
  # Add delivery logging table

  1. New Tables
    - `delivery_logs`
      - Track all delivery attempts
      - Store success/failure status
      - Record delivery method used
      - Capture error messages if any

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  microlearning_id uuid NOT NULL REFERENCES microlearnings(id),
  learner_id uuid NOT NULL REFERENCES learner_profiles(id),
  delivery_method text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  delivered_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE delivery_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view own delivery logs"
  ON delivery_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learner_profiles
      WHERE learner_profiles.id = delivery_logs.learner_id
      AND learner_profiles.user_id = auth.uid()
    )
  );

-- Add indexes for performance
CREATE INDEX idx_delivery_logs_microlearning
  ON delivery_logs(microlearning_id);

CREATE INDEX idx_delivery_logs_learner
  ON delivery_logs(learner_id);

CREATE INDEX idx_delivery_logs_method
  ON delivery_logs(delivery_method);

CREATE INDEX idx_delivery_logs_success
  ON delivery_logs(success);