import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const popularTopics = [
  'Artificial Intelligence',
  'Public Speaking',
  'Productivity',
  'Digital Marketing',
  'Personal Finance',
  'Leadership',
];

// Ensure environment variables are available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not properly configured');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function TopicSelection() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
      } else {
        alert('Please upload a PDF file');
      }
    }
  };

  const handleTopicClick = (selectedTopic: string) => {
    setTopic(selectedTopic);
  };

  const handleSubmit = async () => {
    if (!topic) {
      alert('Please select a topic');
      return;
    }

    setUploading(true);
    try {
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('materials')
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }
      }

      // Store topic selection in local storage for now
      localStorage.setItem('selectedTopic', topic);
      if (file) {
        localStorage.setItem('hasPDF', 'true');
      }

      navigate('/quiz');
    } catch (error) {
      console.error('Error:', error);
      alert('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            What would you like to learn?
          </h1>

          {/* Topic Input */}
          <div className="mb-8">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic (e.g., Artificial Intelligence)"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
          </div>

          {/* Popular Topics */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Popular Topics</h2>
            <div className="flex flex-wrap gap-2">
              {popularTopics.map((popularTopic) => (
                <button
                  key={popularTopic}
                  onClick={() => handleTopicClick(popularTopic)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                    ${topic === popularTopic
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {popularTopic}
                </button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-8">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              {!file ? (
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">
                    Upload study material (PDF only)
                  </span>
                  <span className="text-xs text-gray-400 mt-1">Optional</span>
                </label>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <span className="text-sm text-gray-600">{file.name}</span>
                  <button
                    onClick={() => setFile(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleSubmit}
            disabled={!topic || uploading}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold
              hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 
              focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {uploading ? 'Uploading...' : 'Take a quick quiz to personalize your journey'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopicSelection;