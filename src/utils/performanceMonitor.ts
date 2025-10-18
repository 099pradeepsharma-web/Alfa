class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  startTiming(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
    };
  }

  recordMetric(label: string, value: number) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(value);
    
    // Keep only last 10 measurements
    const values = this.metrics.get(label)!;
    if (values.length > 10) {
      values.shift();
    }
  }

  getAverageMetric(label: string): number {
    const values = this.metrics.get(label) || [];
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  logPerformanceReport() {
    console.group('📊 Performance Report');
    this.metrics.forEach((values, label) => {
      const avg = this.getAverageMetric(label);
      console.log(`${label}: ${avg.toFixed(2)}ms (avg of ${values.length} samples)`);
    });
    console.groupEnd();
  }
}

export const perfMonitor = new PerformanceMonitor();
