import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, FileText, Loader2, Link as LinkIcon } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not properly configured');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface FileWithPreview extends File {
  preview?: string;
}

function CourseCreator() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [title, setTitle] = useState('');
  const [audienceLevel, setAudienceLevel] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [creatorConsent, setCreatorConsent] = useState(false);
  const [publicOptin, setPublicOptin] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter(file => file.type === 'application/pdf');
    setFiles(prev => [...prev, ...pdfFiles]);
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !audienceLevel || files.length === 0 || !creatorConsent) {
      alert('Please fill in all fields, upload at least one PDF, and confirm your consent');
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create course record with consent fields
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert([
          {
            title,
            audience_level: audienceLevel,
            status: 'draft',
            creator_consent: creatorConsent,
            public_optin: publicOptin
          },
        ])
        .select()
        .single();

      if (courseError) throw courseError;

      // Log creator consent
      await supabase
        .from('consent_logs')
        .insert([
          {
            user_id: user.id,
            type: 'ai',
            details: {
              course_id: course.id,
              public_optin: publicOptin,
              accepted_at: new Date().toISOString()
            }
          }
        ]);

      // Upload PDFs
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('course-pdfs')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('course-pdfs')
          .getPublicUrl(fileName);

        // Create pdf_upload record
        const { error: pdfError } = await supabase
          .from('pdf_uploads')
          .insert([
            {
              course_id: course.id,
              file_url: publicUrl,
              filename: file.name,
            },
          ]);

        if (pdfError) throw pdfError;

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      // Trigger learning plan generation
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-learning-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          courseId: course.id,
          title,
          audienceLevel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate learning plan');
      }

      navigate(`/course/${course.id}/preview`);
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating course. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <FileText className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Create Your Course</h1>
            <p className="mt-2 text-gray-600">
              Upload your PDFs and let Dhiva create a personalized learning journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Course Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                placeholder="e.g., Introduction to Machine Learning"
              />
            </div>

            {/* Audience Level */}
            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                Intended Audience Level
              </label>
              <select
                id="level"
                value={audienceLevel}
                onChange={(e) => setAudienceLevel(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              >
                <option value="">Select a level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload PDFs
              </label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 ${
                  files.length > 0 ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      onDrop(Array.from(e.target.files));
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">
                    Drop PDFs here or click to upload
                  </span>
                </label>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                    >
                      <span className="text-sm text-gray-600 truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Creator Consent */}
            <div className="space-y-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="creatorConsent"
                  checked={creatorConsent}
                  onChange={(e) => setCreatorConsent(e.target.checked)}
                  className="h-4 w-4 mt-1 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="creatorConsent" className="ml-2 text-sm text-gray-700">
                  I confirm I have the rights to upload this content and consent to Dhiva using AI to generate learning material as described in the{' '}
                  <Link to="/ai-disclosure" className="text-indigo-600 hover:text-indigo-500" target="_blank">
                    AI Disclosure
                  </Link>
                  .
                </label>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="publicOptin"
                  checked={publicOptin}
                  onChange={(e) => setPublicOptin(e.target.checked)}
                  className="h-4 w-4 mt-1 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="publicOptin" className="ml-2 text-sm text-gray-700">
                  Allow others to subscribe to this course via public opt-in link.
                </label>
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Uploading...</span>
                  <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isUploading || !title || !audienceLevel || files.length === 0}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold
                hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 
                focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition
                flex items-center justify-center"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Processing...
                </>
              ) : (
                'Create Course'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CourseCreator;