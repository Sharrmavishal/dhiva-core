import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Brain, Mail, MessageSquare } from 'lucide-react';
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
  audience_level: string;
  generated_plan: Array<{
    day: number;
    title: string;
    summary: string;
  }>;
  delivery_channel: 'whatsapp' | 'email' | 'both';
}

function PublicCourseView() {
  const { publicId } = useParams<{ publicId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [contactMethod, setContactMethod] = useState<'email' | 'whatsapp'>('email');
  const [contactValue, setContactValue] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [publicId]);

  const loadCourse = async () => {
    if (!publicId) return;

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('public_id', publicId)
      .eq('is_public', true)
      .single();

    if (error) {
      console.error('Error loading course:', error);
      return;
    }

    setCourse(data);
  };

  const handleSubscribe = async () => {
    if (!course || !contactValue) return;

    setIsSubscribing(true);
    try {
      // Validate contact value
      if (contactMethod === 'email' && !contactValue.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      if (contactMethod === 'whatsapp' && !/^\+?\d{10,}$/.test(contactValue)) {
        throw new Error('Please enter a valid phone number');
      }

      const { error } = await supabase
        .from('course_subscribers')
        .insert([
          {
            course_id: course.id,
            contact_method: contactMethod,
            contact_value: contactValue,
          },
        ]);

      if (error) throw error;

      alert('Successfully subscribed! Your learning journey will begin soon.');
      setContactValue('');
    } catch (error) {
      console.error('Error subscribing:', error);
      alert(error.message);
    } finally {
      setIsSubscribing(false);
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="container mx-auto px-4 text-center">
          <Brain className="h-12 w-12 text-indigo-600 mx-auto animate-pulse" />
          <p className="mt-4">Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Course Header */}
          <div className="text-center mb-12">
            <Brain className="h-16 w-16 text-indigo-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
            <p className="text-lg text-gray-600">
              {course.audience_level.charAt(0).toUpperCase() + course.audience_level.slice(1)} Level Course
            </p>
          </div>

          {/* Course Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Course Overview</h2>
            <div className="space-y-4">
              {course.generated_plan.map((day) => (
                <div key={day.day} className="flex items-start">
                  <div className="flex-shrink-0 w-16 text-sm font-medium text-gray-500">
                    Day {day.day}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{day.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold mb-6">Start Learning</h2>

            {/* Delivery Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How would you like to receive your lessons?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(course.delivery_channel === 'both' || course.delivery_channel === 'email') && (
                  <button
                    onClick={() => setContactMethod('email')}
                    className={`p-4 rounded-lg border ${
                      contactMethod === 'email'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-600 hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <Mail className={`h-6 w-6 ${
                      contactMethod === 'email' ? 'text-indigo-600' : 'text-gray-400'
                    } mb-2`} />
                    <h3 className="font-medium">Email Delivery</h3>
                    <p className="text-sm text-gray-500">Detailed lessons in your inbox</p>
                  </button>
                )}
                {(course.delivery_channel === 'both' || course.delivery_channel === 'whatsapp') && (
                  <button
                    onClick={() => setContactMethod('whatsapp')}
                    className={`p-4 rounded-lg border ${
                      contactMethod === 'whatsapp'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-600 hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <MessageSquare className={`h-6 w-6 ${
                      contactMethod === 'whatsapp' ? 'text-indigo-600' : 'text-gray-400'
                    } mb-2`} />
                    <h3 className="font-medium">WhatsApp Delivery</h3>
                    <p className="text-sm text-gray-500">Quick bytes on the go</p>
                  </button>
                )}
              </div>
            </div>

            {/* Contact Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {contactMethod === 'email' ? 'Your Email Address' : 'Your WhatsApp Number'}
              </label>
              <input
                type={contactMethod === 'email' ? 'email' : 'tel'}
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={contactMethod === 'email' ? 'you@example.com' : '+1234567890'}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>

            {/* Subscribe Button */}
            <button
              onClick={handleSubscribe}
              disabled={isSubscribing || !contactValue}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold
                hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 
                focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSubscribing ? 'Subscribing...' : 'Start This Course'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicCourseView;