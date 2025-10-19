'use client';

import { CustomizePortal } from '../../../src/components';

export default function CustomizeAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customize Portal</h1>
        <p className="text-gray-600 mt-2">
          Brand your learning portal with custom themes, logos, and domain to match your school's identity.
        </p>
      </div>
      
      <CustomizePortal />
    </div>
  );
}