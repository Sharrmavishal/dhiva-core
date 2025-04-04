import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Flag, AlertTriangle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not properly configured');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ContentFeedbackProps {
  microlearningId: string;
  className?: string;
}

function ContentFeedback({ microlearningId, className = '' }: ContentFeedbackProps) {
  const [feedback, setFeedback] = useState<'thumbs_up' | 'thumbs_down' | 'flag' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  const handleFeedback = async (type: 'thumbs_up' | 'thumbs_down' | 'flag') => {
    if (type === 'flag') {
      setShowFlagDialog(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase
        .from('content_flags')
        .insert([
          {
            microlearning_id: microlearningId,
            type,
            user_id: user.id,
          },
        ]);

      setFeedback(type);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFlagSubmit = async () => {
    if (!flagReason) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase
        .from('content_flags')
        .insert([
          {
            microlearning_id: microlearningId,
            type: 'flag',
            reason: flagReason,
            user_id: user.id,
          },
        ]);

      setFeedback('flag');
      setShowFlagDialog(false);
    } catch (error) {
      console.error('Error submitting flag:', error);
      alert('Failed to submit flag');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleFeedback('thumbs_up')}
          disabled={isSubmitting || feedback !== null}
          className={`p-1 rounded-full transition ${
            feedback === 'thumbs_up'
              ? 'bg-green-100 text-green-600'
              : 'hover:bg-gray-100 text-gray-400'
          }`}
          title="Helpful"
        >
          <ThumbsUp className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleFeedback('thumbs_down')}
          disabled={isSubmitting || feedback !== null}
          className={`p-1 rounded-full transition ${
            feedback === 'thumbs_down'
              ? 'bg-red-100 text-red-600'
              : 'hover:bg-gray-100 text-gray-400'
          }`}
          title="Not Helpful"
        >
          <ThumbsDown className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleFeedback('flag')}
          disabled={isSubmitting || feedback === 'flag'}
          className={`p-1 rounded-full transition ${
            feedback === 'flag'
              ? 'bg-yellow-100 text-yellow-600'
              : 'hover:bg-gray-100 text-gray-400'
          }`}
          title="Report Issue"
        >
          <Flag className="h-4 w-4" />
        </button>
      </div>

      {/* Flag Dialog */}
      {showFlagDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4 text-yellow-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <h3 className="text-lg font-medium">Report Content Issue</h3>
            </div>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Please describe the issue..."
              className="w-full h-32 px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowFlagDialog(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleFlagSubmit}
                disabled={!flagReason || isSubmitting}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContentFeedback;