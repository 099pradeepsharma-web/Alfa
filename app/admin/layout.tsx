import { headers } from 'next/headers';
import AdminNav from '../../src/components/nav/AdminNav';
import AdminHeader from '../../src/components/layout/AdminHeader';

export const metadata = {
  title: 'Admin Console - Alfanumrik',
  description: 'Administrative dashboard for school management and configuration',
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Get user info from middleware headers or server session
  const headersList = headers();
  const userRole = headersList.get('x-user-role') || '';
  const userOrg = headersList.get('x-user-org') || '';
  
  // In production, fetch org details from database
  // For now, use a placeholder
  const orgName = 'Demo School';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <AdminNav />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <AdminHeader orgName={orgName} userRole={userRole} />
        
        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}