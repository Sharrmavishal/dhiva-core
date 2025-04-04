import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, BookOpen, Target } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not properly configured');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface LearnerProfileProps {
  courseId: string;
  onComplete: () => void;
}

function LearnerProfile({ courseId, onComplete }: LearnerProfileProps) {
  const [priorExposure, setPriorExposure] = useState('');
  const [preferredFormat, setPreferredFormat] = useState('');
  const [selfAssessedLevel, setSelfAssessedLevel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!priorExposure || !preferredFormat || !selfAssessedLevel) {
      alert('Please answer all questions');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('learner_profiles')
        .insert([
          {
            user_id: user.id,
            course_id: courseId,
            prior_exposure: priorExposure,
            preferred_format: preferredFormat,
            self_assessed_level: selfAssessedLevel,
            track_version: selfAssessedLevel === 'beginner' ? 'A' : 
                         selfAssessedLevel === 'advanced' ? 'C' : 'B',
          },
        ]);

      if (error) throw error;
      onComplete();
    } catch (error) {
      console.error('Error saving learner profile:', error);
      alert('Failed to save your preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="text-center mb-8">
        <Brain className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">
          Help us personalize your learning
        </h2>
        <p className="mt-2 text-gray-600">
          Answer a few questions to optimize your learning experience
        </p>
      </div>

      <div className="space-y-6">
        {/* Prior Exposure */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How familiar are you with this topic?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { value: 'new', label: 'New to me' },
              { value: 'somewhat', label: 'Somewhat familiar' },
              { value: 'experienced', label: 'Very familiar' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPriorExposure(option.value)}
                className={`p-4 rounded-lg border text-left ${
                  priorExposure === option.value
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-600 hover:bg-gray-50'
                } transition-colors`}
              >
                <BookOpen className={`h-5 w-5 mb-2 ${
                  priorExposure === option.value ? 'text-indigo-600' : 'text-gray-400'
                }`} />
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What type of content do you prefer?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { value: 'stories', label: 'Stories & Examples' },
              { value: 'quizzes', label: 'Interactive Quizzes' },
              { value: 'summaries', label: 'Concise Summaries' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPreferredFormat(option.value)}
                className={`p-4 rounded-lg border text-left ${
                  preferredFormat === option.value
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-600 hover:bg-gray-50'
                } transition-colors`}
              >
                <Target className={`h-5 w-5 mb-2 ${
                  preferredFormat === option.value ? 'text-indigo-600' : 'text-gray-400'
                }`} />
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Self-Assessed Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How would you rate your current knowledge level?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSelfAssessedLevel(option.value)}
                className={`p-4 rounded-lg border text-left ${
                  selfAssessedLevel === option.value
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-600 hover:bg-gray-50'
                } transition-colors`}
              >
                <Brain className={`h-5 w-5 mb-2 ${
                  selfAssessedLevel === option.value ? 'text-indigo-600' : 'text-gray-400'
                }`} />
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !priorExposure || !preferredFormat || !selfAssessedLevel}
          className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold
            hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 
            focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

export default LearnerProfile;