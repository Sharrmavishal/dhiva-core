import React from 'react';
import { AIContentBadge } from './AIContentBadge';
import { ContentFeedback } from './ContentFeedback';

interface MicrolearningCardProps {
  id: string;
  type: 'summary' | 'quiz' | 'poll' | 'challenge';
  content: string;
  dayNumber: number;
  sourceType: 'pdf' | 'user_input' | 'org_upload' | 'ai_only';
  generatedBy: 'openai' | 'claude' | 'hybrid';
  confidenceScore: number;
  className?: string;
}

function MicrolearningCard({
  id,
  type,
  content,
  dayNumber,
  sourceType,
  generatedBy,
  confidenceScore,
  className = '',
}: MicrolearningCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">Day {dayNumber}</span>
        <span className="text-sm px-2 py-1 rounded bg-indigo-100 text-indigo-700 capitalize">
          {type}
        </span>
      </div>

      {/* Content */}
      <div className="prose prose-indigo max-w-none mb-4">
        {content.split('\n').map((paragraph, index) => (
          <p key={index} className="mb-4">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
        <AIContentBadge
          sourceType={sourceType}
          generatedBy={generatedBy}
          confidenceScore={confidenceScore}
        />
        <ContentFeedback microlearningId={id} />
      </div>
    </div>
  );
}

export default MicrolearningCard;