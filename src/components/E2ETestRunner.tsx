import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { runE2ETest } from '../utils/e2eTest';

function E2ETestRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleRunTest = async () => {
    setIsRunning(true);
    try {
      const testResults = await runE2ETest();
      setResults(testResults);
    } catch (error) {
      console.error('Test execution error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">E2E Test Runner</h1>
            <p className="mt-2 text-gray-600">
              Run end-to-end tests to validate core functionality
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <button
              onClick={handleRunTest}
              disabled={isRunning}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold
                hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 
                focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition
                flex items-center justify-center"
            >
              {isRunning ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Running Tests...
                </>
              ) : (
                'Run E2E Tests'
              )}
            </button>

            {results && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4">Test Results</h2>
                <div className="space-y-4">
                  {results.results.map((result: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        {result.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <span className="font-medium">{result.step}</span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          result.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {result.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Steps</p>
                      <p className="text-xl font-bold">{results.summary.totalSteps}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Passed</p>
                      <p className="text-xl font-bold text-green-600">
                        {results.summary.passedSteps}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Failed</p>
                      <p className="text-xl font-bold text-red-600">
                        {results.summary.failedSteps}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default E2ETestRunner;