import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart3, Users, Clock, Star } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not properly configured');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Analytics {
  totalLearners: number;
  avgEngagement: number;
  completionRate: number;
  dayWiseDropoff: { day: number; count: number }[];
  avgFeedback: number;
}

function OrgCourseAnalytics() {
  const { id } = useParams<{ id: string }>();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [id]);

  const loadAnalytics = async () => {
    if (!id) return;

    try {
      // Get total learners
      const { count: totalLearners } = await supabase
        .from('org_learners')
        .select('*', { count: 'exact' })
        .eq('course_id', id);

      // Get completion rate
      const { count: completedLearners } = await supabase
        .from('org_learners')
        .select('*', { count: 'exact' })
        .eq('course_id', id)
        .eq('status', 'completed');

      // Get average engagement
      const { data: responses } = await supabase
        .from('learner_responses')
        .select('engagement_score, day_number')
        .eq('course_id', id);

      const avgEngagement = responses?.reduce((sum, r) => sum + (r.engagement_score || 0), 0) / 
        (responses?.length || 1);

      // Get day-wise dropoff
      const dayWiseDropoff = responses?.reduce((acc, r) => {
        acc[r.day_number] = (acc[r.day_number] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      // Get average feedback
      const { data: feedback } = await supabase
        .from('feedback')
        .select('rating')
        .eq('course_id', id);

      const avgFeedback = feedback?.reduce((sum, f) => sum + f.rating, 0) / 
        (feedback?.length || 1);

      setAnalytics({
        totalLearners: totalLearners || 0,
        avgEngagement,
        completionRate: totalLearners ? 
          ((completedLearners || 0) / totalLearners) * 100 : 0,
        dayWiseDropoff: Object.entries(dayWiseDropoff || {}).map(([day, count]) => ({
          day: parseInt(day),
          count,
        })),
        avgFeedback,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      alert('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="container mx-auto px-4 text-center">
          Loading analytics...
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="container mx-auto px-4 text-center">
          No analytics data available
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Learners</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.totalLearners}
                  </p>
                </div>
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg. Engagement</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(analytics.avgEngagement)}%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(analytics.completionRate)}%
                  </p>
                </div>
                <Clock className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg. Feedback</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.avgFeedback.toFixed(1)}/5
                  </p>
                </div>
                <Star className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Day-wise Dropoff */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Day-wise Engagement
            </h2>
            <div className="h-64">
              <div className="h-full flex items-end justify-between">
                {analytics.dayWiseDropoff.map(({ day, count }) => (
                  <div
                    key={day}
                    className="flex-1 mx-1"
                    style={{ height: `${(count / analytics.totalLearners) * 100}%` }}
                  >
                    <div className="bg-indigo-600 h-full rounded-t-lg" />
                    <div className="text-xs text-center mt-2">Day {day}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrgCourseAnalytics;