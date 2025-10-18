import React, { lazy, ComponentType, Suspense } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

export const createLazyComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  // FIX: Changed type from JSX.Element to React.ReactNode to avoid issues with JSX namespace in .ts files.
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(importFunc);

  const WrappedComponent = (props: React.ComponentProps<T>) => {
    // FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file.
    // This resolves errors about unknown elements like 'div' and type issues with components.
    const defaultFallback = React.createElement('div', { className: 'flex justify-center items-center h-64' }, React.createElement(LoadingSpinner));
    
    let suspenseFallback;
    if (fallback === null) {
      suspenseFallback = null;
    } else {
      // Use provided fallback, or default spinner if fallback is undefined.
      suspenseFallback = fallback ?? defaultFallback;
    }

    return React.createElement(
      Suspense,
      { fallback: suspenseFallback },
      React.createElement(LazyComponent, props)
    );
  };

  return WrappedComponent;
};
