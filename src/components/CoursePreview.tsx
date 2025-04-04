import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, X, RefreshCw, ChevronRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not properly configured');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface LearningDay {
  day: number;
  title: string;
  summary: string;
  type: 'summary' | 'quiz' | 'poll' | 'challenge';
}

interface Course {
  id: string;
  title: string;
  audience_level: string;
  generated_plan: LearningDay[];
  status: string;
}

function CoursePreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error loading course:', error);
      return;
    }

    setCourse(data);
  };

  const handleRegenerate = async () => {
    if (!course) return;

    setIsRegenerating(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-learning-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          courseId: course.id,
          title: course.title,
          audienceLevel: course.audience_level,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate learning plan');
      }

      await loadCourse();
    } catch (error) {
      console.error('Error:', error);
      alert('Error regenerating plan. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!course) return;

    try {
      const { error } = await supabase
        .from('courses')
        .update({ status: 'approved' })
        .eq('id', course.id);

      if (error) throw error;

      navigate('/preferences');
    } catch (error) {
      console.error('Error:', error);
      alert('Error approving course. Please try again.');
    }
  };

  const handleDiscard = async () => {
    if (!course) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id);

      if (error) throw error;

      navigate('/topic');
    } catch (error) {
      console.error('Error:', error);
      alert('Error discarding course. Please try again.');
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="container mx-auto px-4 text-center">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
            <p className="mt-2 text-gray-600">
              {course.audience_level.charAt(0).toUpperCase() + course.audience_level.slice(1)} Level Course
            </p>
          </div>

          {/* Learning Plan */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Generated Learning Plan</h2>
            <div className="space-y-4">
              {course.generated_plan?.map((day) => (
                <div
                  key={day.day}
                  className="p-4 rounded-lg bg-gray-50 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Day {day.day}</h3>
                    <span className="text-sm px-2 py-1 rounded bg-indigo-100 text-indigo-700">
                      {day.type}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">{day.title}</h4>
                  <p className="text-gray-600 text-sm">{day.summary}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center justify-center px-6 py-3 rounded-lg
                border border-gray-300 text-gray-700 bg-white hover:bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
                disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
              Regenerate Plan
            </button>
            <button
              onClick={handleApprove}
              className="flex items-center justify-center px-6 py-3 rounded-lg
                bg-indigo-600 text-white hover:bg-indigo-500
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition"
            >
              <Check className="h-5 w-5 mr-2" />
              Approve Plan
            </button>
            <button
              onClick={handleDiscard}
              className="flex items-center justify-center px-6 py-3 rounded-lg
                border border-red-300 text-red-700 bg-white hover:bg-red-50
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
            >
              <X className="h-5 w-5 mr-2" />
              Discard Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoursePreview;