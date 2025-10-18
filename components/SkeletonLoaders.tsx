import React from 'react';

/**
 * Skeleton Loading Components for Better UX
 * These provide immediate visual feedback while content loads
 */

const SkeletonBox: React.FC<{ width?: string; height?: string; className?: string }> = ({ 
  width = 'w-full', 
  height = 'h-4', 
  className = '' 
}) => (
  <div className={`bg-gray-200 animate-pulse rounded ${width} ${height} ${className}`}></div>
);

const SkeletonCircle: React.FC<{ size?: string }> = ({ size = 'w-12 h-12' }) => (
  <div className={`bg-gray-200 animate-pulse rounded-full ${size}`}></div>
);

// Dashboard Skeleton
export const SkeletonDashboard: React.FC = () => (
  <div className="p-6 space-y-6">
    {/* Header */}
    <div className="flex items-center space-x-4">
      <SkeletonCircle size="w-16 h-16" />
      <div className="space-y-2">
        <SkeletonBox width="w-32" height="h-6" />
        <SkeletonBox width="w-24" height="h-4" />
      </div>
    </div>
    
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg space-y-3">
          <SkeletonBox width="w-20" height="h-5" />
          <SkeletonBox width="w-16" height="h-8" />
          <SkeletonBox width="w-full" height="h-3" />
        </div>
      ))}
    </div>
    
    {/* Study Goals */}
    <div className="space-y-4">
      <SkeletonBox width="w-32" height="h-6" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 border rounded">
          <SkeletonBox width="w-5" height="h-5" />
          <SkeletonBox width="w-full" height="h-4" />
        </div>
      ))}
    </div>
    
    {/* Action Buttons */}
    <div className="flex space-x-4">
      <SkeletonBox width="w-32" height="h-10" className="rounded-lg" />
      <SkeletonBox width="w-28" height="h-10" className="rounded-lg" />
    </div>
  </div>
);

// Chapter Content Skeleton
export const SkeletonChapter: React.FC = () => (
  <div className="p-6 space-y-6">
    {/* Chapter Header */}
    <div className="space-y-3">
      <SkeletonBox width="w-3/4" height="h-8" />
      <SkeletonBox width="w-full" height="h-4" />
      <SkeletonBox width="w-2/3" height="h-4" />
    </div>
    
    {/* Mission Briefing */}
    <div className="bg-blue-50 p-4 rounded-lg space-y-3">
      <SkeletonBox width="w-40" height="h-6" />
      <SkeletonBox width="w-full" height="h-16" />
    </div>
    
    {/* Core Concepts */}
    <div className="space-y-4">
      <SkeletonBox width="w-48" height="h-6" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <SkeletonBox width="w-56" height="h-5" />
          <SkeletonBox width="w-full" height="h-4" />
          <SkeletonBox width="w-4/5" height="h-4" />
          <SkeletonBox width="w-3/4" height="h-4" />
        </div>
      ))}
    </div>
    
    {/* Practice Arena */}
    <div className="bg-green-50 p-4 rounded-lg space-y-4">
      <SkeletonBox width="w-36" height="h-6" />
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonBox width="w-full" height="h-6" />
          <SkeletonBox width="w-full" height="h-12" />
        </div>
      ))}
    </div>
  </div>
);

// Tutor Session Skeleton
export const SkeletonTutor: React.FC = () => (
  <div className="h-full flex flex-col">
    {/* Header */}
    <div className="border-b p-4 flex items-center space-x-3">
      <SkeletonCircle size="w-10 h-10" />
      <div className="space-y-2">
        <SkeletonBox width="w-32" height="h-5" />
        <SkeletonBox width="w-20" height="h-3" />
      </div>
    </div>
    
    {/* Chat Messages */}
    <div className="flex-1 p-4 space-y-4">
      {/* AI Message */}
      <div className="flex space-x-3">
        <SkeletonCircle size="w-8 h-8" />
        <div className="bg-gray-100 rounded-lg p-3 flex-1 space-y-2">
          <SkeletonBox width="w-full" height="h-4" />
          <SkeletonBox width="w-3/4" height="h-4" />
        </div>
      </div>
      
      {/* User Message */}
      <div className="flex space-x-3 justify-end">
        <div className="bg-blue-100 rounded-lg p-3 max-w-xs space-y-2">
          <SkeletonBox width="w-full" height="h-4" />
        </div>
        <SkeletonCircle size="w-8 h-8" />
      </div>
      
      {/* AI Response Loading */}
      <div className="flex space-x-3">
        <SkeletonCircle size="w-8 h-8" />
        <div className="bg-gray-100 rounded-lg p-3 flex-1 space-y-2">
          <SkeletonBox width="w-2/3" height="h-4" />
          <SkeletonBox width="w-1/2" height="h-4" />
        </div>
      </div>
    </div>
    
    {/* Input Area */}
    <div className="border-t p-4">
      <SkeletonBox width="w-full" height="h-10" className="rounded-lg" />
    </div>
  </div>
);

// Quiz Skeleton
export const SkeletonQuiz: React.FC = () => (
  <div className="p-6 space-y-6">
    {/* Question Header */}
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <SkeletonBox width="w-24" height="h-5" />
        <SkeletonBox width="w-16" height="h-5" />
      </div>
      <SkeletonBox width="w-full" height="h-6" />
    </div>
    
    {/* Question Content */}
    <div className="bg-white p-6 rounded-lg border space-y-4">
      <SkeletonBox width="w-full" height="h-12" />
      
      {/* Options */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-3 border rounded">
            <SkeletonBox width="w-4" height="h-4" className="rounded-full" />
            <SkeletonBox width="w-full" height="h-4" />
          </div>
        ))}
      </div>
    </div>
    
    {/* Action Buttons */}
    <div className="flex justify-between">
      <SkeletonBox width="w-20" height="h-10" className="rounded" />
      <SkeletonBox width="w-24" height="h-10" className="rounded" />
    </div>
  </div>
);

// Performance View Skeleton
export const SkeletonPerformance: React.FC = () => (
  <div className="p-6 space-y-6">
    {/* Student Info */}
    <div className="flex items-center space-x-4">
      <SkeletonCircle size="w-20 h-20" />
      <div className="space-y-2">
        <SkeletonBox width="w-40" height="h-6" />
        <SkeletonBox width="w-32" height="h-4" />
        <SkeletonBox width="w-28" height="h-4" />
      </div>
    </div>
    
    {/* Performance Chart */}
    <div className="bg-white p-6 rounded-lg border space-y-4">
      <SkeletonBox width="w-48" height="h-6" />
      <div className="h-64 bg-gray-100 rounded animate-pulse flex items-end justify-center space-x-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBox 
            key={i} 
            width="w-8" 
            height={`h-${Math.floor(Math.random() * 40) + 20}`} 
            className="rounded-t"
          />
        ))}
      </div>
    </div>
    
    {/* Recent Activities */}
    <div className="space-y-4">
      <SkeletonBox width="w-40" height="h-6" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 border rounded">
          <div className="flex items-center space-x-3">
            <SkeletonCircle size="w-8 h-8" />
            <div className="space-y-1">
              <SkeletonBox width="w-32" height="h-4" />
              <SkeletonBox width="w-24" height="h-3" />
            </div>
          </div>
          <SkeletonBox width="w-16" height="h-6" className="rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

// Loading States Container
export const SkeletonContainer: React.FC<{ 
  children: React.ReactNode;
  loading: boolean;
  skeleton: React.ComponentType;
}> = ({ children, loading, skeleton: Skeleton }) => {
  if (loading) {
    return <Skeleton />;
  }
  return <>{children}</>;
};

// Shimmer effect for enhanced visual feedback
export const ShimmerEffect: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
  </div>
);

// Add to your global CSS:
/*
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 1.5s infinite;
}
*/