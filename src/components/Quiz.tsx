import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';

// Mock quiz data (will be replaced with API call)
const mockQuizData = [
  {
    question: "What is the primary goal of machine learning?",
    options: [
      "To create self-aware computers",
      "To enable computers to learn from data",
      "To replace human workers",
      "To store large amounts of data"
    ],
    correct_answer: "To enable computers to learn from data"
  },
  {
    question: "Which of these is a common machine learning task?",
    options: [
      "Hardware repair",
      "Classification",
      "Software installation",
      "Network configuration"
    ],
    correct_answer: "Classification"
  },
  {
    question: "What is a neural network inspired by?",
    options: [
      "Computer circuits",
      "Human brain structure",
      "Telephone networks",
      "Social networks"
    ],
    correct_answer: "Human brain structure"
  }
];

function Quiz() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(mockQuizData);

  useEffect(() => {
    // Simulate API call to get quiz questions
    const topic = localStorage.getItem('selectedTopic');
    const hasPDF = localStorage.getItem('hasPDF') === 'true';

    // TODO: Replace with actual API call to generate questions
    setTimeout(() => {
      setQuizData(mockQuizData);
      setLoading(false);
    }, 1500);
  }, []);

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);

    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const calculateScore = () => {
    const correctAnswers = answers.filter(
      (answer, index) => answer === quizData[index].correct_answer
    );
    return (correctAnswers.length / quizData.length) * 100;
  };

  const handleSubmit = () => {
    const score = calculateScore();
    let level = '';

    if (score <= 40) level = 'beginner';
    else if (score <= 70) level = 'intermediate';
    else level = 'advanced';

    // Store results
    localStorage.setItem('quizScore', score.toString());
    localStorage.setItem('competencyLevel', level);

    navigate('/plan');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 text-indigo-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Generating your personalized quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">
                Question {currentQuestion + 1} of {quizData.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(((currentQuestion + 1) / quizData.length) * 100)}% complete
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / quizData.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {quizData[currentQuestion].question}
            </h2>

            {/* Options */}
            <div className="space-y-4">
              {quizData[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors
                    ${answers[currentQuestion] === option
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-600 hover:bg-gray-50'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              Previous
            </button>
            {currentQuestion === quizData.length - 1 && answers[currentQuestion] ? (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
              >
                See My Learning Path
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(Math.min(quizData.length - 1, currentQuestion + 1))}
                disabled={!answers[currentQuestion] || currentQuestion === quizData.length - 1}
                className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Quiz;