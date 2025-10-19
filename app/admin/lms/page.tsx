'use client';

import { LMSConnections } from '../../../src/components';

export default function LMSAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">LMS Integrations</h1>
        <p className="text-gray-600 mt-2">
          Connect your Learning Management System to automatically sync students, classes, and assignments.
        </p>
      </div>
      
      <LMSConnections />
    </div>
  );
}