import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import AIContentBadge from './AIContentBadge';
import ContentFeedback from './ContentFeedback';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not properly configured');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Microlearning {
  id: string;
  type: 'summary' | 'quiz' | 'poll' | 'challenge';
  content: string;
  day_number: number;
  source_type: 'pdf' | 'user_input' | 'org_upload' | 'ai_only';
  generated_by: 'openai' | 'claude' | 'hybrid';
  confidence_score: number;
}

interface TestResult {
  name: string;
  status: 'success' | 'failure' | 'pending';
  details?: string;
}

function TestTrustWrapping() {
  const [microlearnings, setMicrolearnings] = useState<Microlearning[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    runFunctionalityTests();
  }, []);

  const runFunctionalityTests = async () => {
    const results: TestResult[] = [
      { name: 'Topic Selection', status: 'pending' },
      { name: 'Quiz Generation', status: 'pending' },
      { name: 'Learning Path', status: 'pending' },
      { name: 'Microlearning Creation', status: 'pending' },
      { name: 'Preferences Setup', status: 'pending' },
      { name: 'Consent Logging', status: 'pending' },
      { name: 'Trust Wrapping', status: 'pending' },
      { name: 'WhatsApp Delivery', status: 'pending' }
    ];
    
    try {
      // Test 1: Topic Selection
      const { data: topics, error: topicsError } = await supabase
        .from('topics')
        .select('*')
        .limit(1);
      results[0].status = topics?.length ? 'success' : 'failure';
      if (topicsError) results[0].details = topicsError.message;

      // Test 2: Quiz Generation
      const { data: quizzes, error: quizzesError } = await supabase
        .from('microlearnings')
        .select('*')
        .eq('type', 'quiz')
        .limit(1);
      results[1].status = quizzes?.length ? 'success' : 'failure';
      if (quizzesError) results[1].details = quizzesError.message;

      // Test 3: Learning Path
      const { data: learnerProfiles, error: profilesError } = await supabase
        .from('learner_profiles')
        .select('*')
        .limit(1);
      results[2].status = learnerProfiles?.length ? 'success' : 'failure';
      if (profilesError) results[2].details = profilesError.message;

      // Test 4: Microlearning Creation
      const { data: microlearnings, error: microlearningsError } = await supabase
        .from('microlearnings')
        .select('*')
        .order('day_number', { ascending: true })
        .limit(5);
      results[3].status = microlearnings?.length ? 'success' : 'failure';
      if (microlearningsError) results[3].details = microlearningsError.message;
      setMicrolearnings(microlearnings || []);

      // Test 5: Preferences
      const { data: preferences, error: preferencesError } = await supabase
        .from('preferences')
        .select('*')
        .limit(1);
      results[4].status = preferences?.length ? 'success' : 'failure';
      if (preferencesError) results[4].details = preferencesError.message;

      // Test 6: Consent Logging
      const { data: consentLogs, error: consentError } = await supabase
        .from('consent_logs')
        .select('*')
        .limit(1);
      results[5].status = consentLogs?.length ? 'success' : 'failure';
      if (consentError) results[5].details = consentError.message;

      // Test 7: Trust Wrapping
      const trustWrappingValid = microlearnings?.every(m => 
        m.source_type && 
        m.generated_by && 
        typeof m.confidence_score === 'number' &&
        m.confidence_score >= 0 &&
        m.confidence_score <= 1
      );
      results[6].status = trustWrappingValid ? 'success' : 'failure';
      if (!trustWrappingValid) {
        results[6].details = 'Missing or invalid trust wrapping metadata';
      }

      // Test 8: WhatsApp Delivery
      const { data: whatsappSubs, error: whatsappError } = await supabase
        .from('course_subscribers')
        .select('*')
        .eq('contact_method', 'whatsapp')
        .limit(1);
      results[7].status = whatsappSubs?.length ? 'success' : 'failure';
      if (whatsappError) results[7].details = whatsappError.message;

      setTestResults(results);
    } catch (error) {
      console.error('Error running tests:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failure':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-700 mb-2">Test Suite Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="container mx-auto px-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Running functionality tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">
            QA Test Results
          </h1>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="font-semibold text-gray-900 mb-4">Module Status</h2>
            <div className="space-y-4">
              {testResults.map((result) => (
                <div key={result.name} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium text-gray-900">{result.name}</span>
                    </div>
                    {result.details && (
                      <p className="mt-1 text-sm text-red-600">{result.details}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    result.status === 'success' ? 'bg-green-100 text-green-700' :
                    result.status === 'failure' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {result.status === 'success' ? 'Working' :
                     result.status === 'failure' ? 'Not Working' :
                     'Testing...'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Trust Wrapper Verification
          </h2>

          <div className="space-y-6">
            {microlearnings.map((microlearning) => (
              <div key={microlearning.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500">Day {microlearning.day_number}</span>
                  <span className="text-sm px-2 py-1 rounded bg-indigo-100 text-indigo-700 capitalize">
                    {microlearning.type}
                  </span>
                </div>
                <div className="prose prose-indigo max-w-none mb-4">
                  {microlearning.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                  <AIContentBadge
                    sourceType={microlearning.source_type}
                    generatedBy={microlearning.generated_by}
                    confidenceScore={microlearning.confidence_score}
                  />
                  <ContentFeedback microlearningId={microlearning.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestTrustWrapping;