/*
  # Add delivery preference to learner profiles

  1. Changes
    - Add delivery_preference column to learner_profiles table
    - Add onboarding_step column to track onboarding progress
    
  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE learner_profiles 
ADD COLUMN IF NOT EXISTS delivery_preference text 
CHECK (delivery_preference IN ('whatsapp', 'email', 'both'));

ALTER TABLE learner_profiles 
ADD COLUMN IF NOT EXISTS onboarding_step text 
DEFAULT 'delivery_preference';