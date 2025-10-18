import { useState, useEffect } from 'react';

export const useProgressiveLoading = <T>(
  dataLoader: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Add artificial minimum loading time for better UX
        const [result] = await Promise.all([
          dataLoader(),
          new Promise(resolve => setTimeout(resolve, 300))
        ]);
        
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Loading failed');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();
    
    return () => {
      cancelled = true;
    };
  }, dependencies);

  return { data, loading, error };
};
