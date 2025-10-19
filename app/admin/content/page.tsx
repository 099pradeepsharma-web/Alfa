'use client';

import { ContentGeneratorConsole } from '../../../src/components';

export default function ContentAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Content Generator</h1>
        <p className="text-gray-600 mt-2">
          Generate educational content using AI. Queue requests for MCQs, worksheets, lesson plans, and explanations.
        </p>
      </div>
      
      <ContentGeneratorConsole />
    </div>
  );
}