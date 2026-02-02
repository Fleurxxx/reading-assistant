/**
 * Performance monitoring and optimization utilities
 */

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
  memory?: number;
}

/**
 * Performance monitor class
 */
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private enabled: boolean = true;

  /**
   * Start timing an operation
   */
  startTimer(name: string): () => void {
    if (!this.enabled) return () => {};

    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize;

    return () => {
      const duration = performance.now() - startTime;
      const memory = (performance as any).memory?.usedJSHeapSize;

      const metric: PerformanceMetrics = {
        name,
        duration,
        timestamp: Date.now(),
        memory: memory && startMemory ? memory - startMemory : undefined,
      };

      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      this.metrics.get(name)!.push(metric);

      // Log slow operations
      if (duration > 100) {
        console.warn(`[Performance] Slow operation: ${name} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  /**
   * Measure async operation
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const end = this.startTimer(name);
    try {
      return await fn();
    } finally {
      end();
    }
  }

  /**
   * Measure sync operation
   */
  measure<T>(name: string, fn: () => T): T {
    const end = this.startTimer(name);
    try {
      return fn();
    } finally {
      end();
    }
  }

  /**
   * Get metrics summary
   */
  getSummary(name?: string): Record<string, any> {
    if (name) {
      const metrics = this.metrics.get(name) || [];
      return this.calculateStats(metrics);
    }

    const summary: Record<string, any> = {};
    for (const [metricName, metrics] of this.metrics) {
      summary[metricName] = this.calculateStats(metrics);
    }
    return summary;
  }

  /**
   * Calculate statistics for metrics
   */
  private calculateStats(metrics: PerformanceMetrics[]): any {
    if (metrics.length === 0) {
      return { count: 0 };
    }

    const durations = metrics.map((m) => m.duration);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return {
      count: metrics.length,
      avg: avg.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      total: durations.reduce((a, b) => a + b, 0).toFixed(2),
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Log summary to console
   */
  logSummary(): void {
    console.log("[Performance Monitor] Summary:");
    console.table(this.getSummary());
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

/**
 * Throttle function to limit execution rate
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function (this: any, ...args: Parameters<T>): void {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Debounce function to delay execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };

    const callNow = immediate && !timeout;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(this, args);
  };
}

/**
 * Batch process items with delay between batches
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10,
  delayMs: number = 0
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    // Add delay between batches to avoid blocking
    if (delayMs > 0 && i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);

    // Limit cache size
    if (cache.size > 1000) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    return result;
  }) as T;
}

/**
 * Check if performance API is available
 */
export function isPerformanceAvailable(): boolean {
  return typeof performance !== "undefined" && typeof performance.now === "function";
}

/**
 * Get memory usage info (if available)
 */
export function getMemoryUsage(): any {
  if ((performance as any).memory) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      totalJSHeapSize: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
    };
  }
  return null;
}

/**
 * Lazy load module
 */
export async function lazyLoad<T>(loader: () => Promise<T>): Promise<T> {
  return await perfMonitor.measureAsync("LazyLoad", loader);
}

/**
 * Request idle callback wrapper
 * Works in both browser and service worker contexts
 */
export function requestIdleTask(callback: () => void, options?: IdleRequestOptions): void {
  // Check if we're in a browser context with window object
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    (window as any).requestIdleCallback(callback, options);
  } else if (typeof globalThis !== "undefined" && "requestIdleCallback" in globalThis) {
    // Service worker context might have requestIdleCallback on globalThis
    (globalThis as any).requestIdleCallback(callback, options);
  } else {
    // Fallback to setTimeout for service workers
    setTimeout(callback, 1);
  }
}

/**
 * Chunk large array processing
 */
export async function processInChunks<T>(
  items: T[],
  processor: (chunk: T[]) => void | Promise<void>,
  chunkSize: number = 100
): Promise<void> {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await processor(chunk);

    // Yield to browser
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

/**
 * Create a performance mark
 */
export function mark(name: string): void {
  if (isPerformanceAvailable() && performance.mark) {
    performance.mark(name);
  }
}

/**
 * Measure between two marks
 */
export function measure(name: string, startMark: string, endMark: string): number | null {
  if (isPerformanceAvailable() && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0] as PerformanceMeasure;
      return measure ? measure.duration : null;
    } catch (error) {
      console.warn("[Performance] Measure failed:", error);
      return null;
    }
  }
  return null;
}

/**
 * Clear performance marks and measures
 */
export function clearMarks(name?: string): void {
  if (isPerformanceAvailable()) {
    if (name) {
      performance.clearMarks(name);
      performance.clearMeasures(name);
    } else {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
}
