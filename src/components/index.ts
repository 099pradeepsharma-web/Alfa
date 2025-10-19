// Authentication Components
export { default as AuthCallback } from './auth/AuthCallback';
export { default as AuthRouter } from './auth/AuthRouter';

// Dashboard Components
export { default as TeacherDashboard } from './dashboard/TeacherDashboard';
export { default as ParentDashboard } from './parent/ParentDashboard';
export { default as AtRiskCard } from './dashboard/AtRiskCard';

// Status Components  
export { default as CloudStatus } from './status/CloudStatus';

// Admin Components
export { default as DemoDataSeeder } from './admin/DemoDataSeeder';
export { default as MFASetup } from './admin/MFASetup';
export { default as LMSConnections } from './admin/LMSConnections';
export { default as CustomizePortal } from './admin/CustomizePortal';
export { default as ContentGeneratorConsole } from './admin/ContentGeneratorConsole';

// Navigation Components
export { default as AdminNav } from './nav/AdminNav';

// Layout Components
export { default as AdminHeader } from './layout/AdminHeader';

// Re-export existing components (add as needed)
// export { default as Dashboard } from './Dashboard';
// export { default as StudentProfile } from './StudentProfile';
// export { default as PerformanceChart } from './PerformanceChart';

// Types for component props (if needed)
export type { 
  // Add component prop types here as they're created
} from './types';