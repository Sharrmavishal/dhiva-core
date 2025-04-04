import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Trophy, ChevronRight } from 'lucide-react';

function LearningPlan() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState({
    topic: '',
    level: '',
    duration: 0,
    score: 0
  });

  useEffect(() => {
    const topic = localStorage.getItem('selectedTopic') || '';
    const level = localStorage.getItem('competencyLevel') || '';
    const score = Number(localStorage.getItem('quizScore')) || 0;

    let duration = 0;
    if (level === 'beginner') duration = 10;
    else if (level === 'intermediate') duration = 6;
    else duration = 4;

    setPlan({ topic, level, duration, score });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <Trophy className="h-16 w-16 text-indigo-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Your Personalized Learning Plan
            </h1>
            <p className="text-lg text-gray-600">
              Based on your quiz results, we've crafted the perfect learning journey for you.
            </p>
          </div>

          {/* Plan Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
            <div className="grid gap-6">
              {/* Topic */}
              <div className="border-b border-gray-100 pb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {plan.topic}
                </h2>
                <p className="text-gray-600">
                  You scored {plan.score}% on the assessment
                </p>
              </div>

              {/* Level */}
              <div className="flex items-center gap-4">
                <Trophy className="h-6 w-6 text-indigo-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Your Level</h3>
                  <p className="text-gray-600 capitalize">{plan.level}</p>
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-4">
                <Calendar className="h-6 w-6 text-indigo-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Learning Duration</h3>
                  <p className="text-gray-600">{plan.duration} days</p>
                </div>
              </div>

              {/* Daily Time */}
              <div className="flex items-center gap-4">
                <Clock className="h-6 w-6 text-indigo-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Daily Commitment</h3>
                  <p className="text-gray-600">10-15 minutes per day</p>
                </div>
              </div>
            </div>
          </div>

          {/* What to Expect */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">What to Expect</h3>
            <ul className="space-y-3 text-gray-600">
              <li>• Daily bite-sized lessons tailored to your level</li>
              <li>• Interactive quizzes to reinforce learning</li>
              <li>• Weekly progress summaries</li>
              <li>• Personalized pace adjustments based on your performance</li>
            </ul>
          </div>

          {/* Continue Button */}
          <button
            onClick={() => navigate('/preferences')}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold
              hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 
              focus:ring-indigo-600 transition flex items-center justify-center"
          >
            Continue to Preferences
            <ChevronRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default LearningPlan;