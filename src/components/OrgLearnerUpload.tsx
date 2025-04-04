import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, Loader2, Check } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not properly configured');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface LearnerData {
  name: string;
  email?: string;
  phone_number?: string;
}

interface OrgLearnerUploadProps {
  courseId: string;
  onComplete: () => void;
}

function OrgLearnerUpload({ courseId, onComplete }: OrgLearnerUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<LearnerData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'text/csv') {
        setFile(selectedFile);
        parseCSV(selectedFile);
      } else {
        alert('Please upload a CSV file');
      }
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = results.data as LearnerData[];
        if (data.length > 500) {
          alert('Maximum 500 learners allowed per upload');
          return;
        }
        setPreview(data);
        validateData(data);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        alert('Error parsing CSV file');
      },
    });
  };

  const validateData = (data: LearnerData[]) => {
    const newErrors: string[] = [];
    data.forEach((row, index) => {
      if (!row.name) {
        newErrors.push(`Row ${index + 1}: Name is required`);
      }
      if (!row.email && !row.phone_number) {
        newErrors.push(`Row ${index + 1}: Either email or phone number is required`);
      }
      if (row.email && !row.email.includes('@')) {
        newErrors.push(`Row ${index + 1}: Invalid email format`);
      }
      if (row.phone_number && !/^\+?\d{10,}$/.test(row.phone_number)) {
        newErrors.push(`Row ${index + 1}: Invalid phone number format`);
      }
    });
    setErrors(newErrors);
  };

  const handleUpload = async () => {
    if (!file || errors.length > 0) return;

    setIsUploading(true);
    try {
      // Insert learners in batches
      const batchSize = 50;
      for (let i = 0; i < preview.length; i += batchSize) {
        const batch = preview.slice(i, i + batchSize).map(learner => ({
          course_id: courseId,
          name: learner.name,
          email: learner.email,
          phone_number: learner.phone_number,
        }));

        const { error } = await supabase
          .from('org_learners')
          .insert(batch);

        if (error) throw error;
      }

      onComplete();
    } catch (error) {
      console.error('Error uploading learners:', error);
      alert('Failed to upload learners');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="text-center mb-8">
        <Upload className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">
          Upload Learners
        </h2>
        <p className="mt-2 text-gray-600">
          Upload a CSV file with learner details (max 500 learners)
        </p>
      </div>

      {/* File Upload */}
      <div className="mb-8">
        <div 
          className={`border-2 border-dashed rounded-lg p-6 ${
            file ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
          }`}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
          />
          {!file ? (
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <FileText className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">
                Click to upload CSV file
              </span>
              <span className="text-xs text-gray-400 mt-1">
                Format: name, email, phone_number
              </span>
            </label>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{file.name}</span>
              <button
                onClick={() => {
                  setFile(null);
                  setPreview([]);
                  setErrors([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-red-600 mb-2">
            Please fix the following errors:
          </h3>
          <ul className="text-sm text-red-500 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Preview ({preview.length} learners)
          </h3>
          <div className="max-h-64 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Phone
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.map((learner, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {learner.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {learner.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {learner.phone_number || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={isUploading || !file || errors.length > 0}
        className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold
          hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 
          focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition
          flex items-center justify-center"
      >
        {isUploading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            Uploading...
          </>
        ) : (
          <>
            <Check className="h-5 w-5 mr-2" />
            Upload Learners
          </>
        )}
      </button>
    </div>
  );
}

export default OrgLearnerUpload;