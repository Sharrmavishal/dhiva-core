import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Upload, Users, BarChart3, FileText, ChevronRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not properly configured');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Course {
  id: string;
  title: string;
  status: string;
  created_at: string;
  learner_count: number;
  completion_rate: number;
}

function OrgDashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          status,
          created_at
        `)
        .eq('course_type', 'org')
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      // Get learner counts and completion rates
      const coursesWithStats = await Promise.all(
        coursesData.map(async (course) => {
          const { count: learnerCount } = await supabase
            .from('org_learners')
            .select('*', { count: 'exact' })
            .eq('course_id', course.id);

          const { count: completedCount } = await supabase
            .from('org_learners')
            .select('*', { count: 'exact' })
            .eq('course_id', course.id)
            .eq('status', 'completed');

          return {
            ...course,
            learner_count: learnerCount || 0,
            completion_rate: learnerCount ? (completedCount || 0) / learnerCount * 100 : 0,
          };
        })
      );

      setCourses(coursesWithStats);
    } catch (error) {
      console.error('Error loading courses:', error);
      alert('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Organization Dashboard</h1>
            </div>
            <button
              onClick={() => navigate('/create-course')}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg
                hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 
                focus:ring-indigo-600 transition"
            >
              <Upload className="h-5 w-5 mr-2" />
              New Course
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                </div>
                <FileText className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Learners</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.reduce((sum, course) => sum + course.learner_count, 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg. Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(
                      courses.reduce((sum, course) => sum + course.completion_rate, 0) / 
                      (courses.length || 1)
                    )}%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Course List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Your Courses</h2>
            </div>
            {isLoading ? (
              <div className="p-6 text-center text-gray-500">Loading courses...</div>
            ) : courses.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No courses yet. Create your first course to get started.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="p-6 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => navigate(`/course/${course.id}/preview`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{course.title}</h3>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="capitalize">{course.status}</span>
                          <span>•</span>
                          <span>{course.learner_count} learners</span>
                          <span>•</span>
                          <span>{Math.round(course.completion_rate)}% completed</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrgDashboard;