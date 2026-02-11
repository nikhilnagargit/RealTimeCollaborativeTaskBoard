/**
 * React Profiler Utilities
 * 
 * Provides utilities for measuring and logging component rendering performance.
 * Uses React's built-in Profiler API to track render times and phases.
 */

import { ProfilerOnRenderCallback } from 'react';

/**
 * Profiler callback that logs render performance to console
 * 
 * @param id - The "id" prop of the Profiler tree that has just committed
 * @param phase - Either "mount" (first render) or "update" (re-render)
 * @param actualDuration - Time spent rendering the committed update
 * @param baseDuration - Estimated time to render the entire subtree without memoization
 * @param startTime - When React began rendering this update
 * @param commitTime - When React committed this update
 */
export const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  // Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    const phaseEmoji = phase === 'mount' ? '🚀' : '🔄';
    const performanceLevel = actualDuration < 16 ? '✅' : actualDuration < 50 ? '⚠️' : '❌';
    
    console.group(`${phaseEmoji} ${performanceLevel} Profiler: ${id}`);
    console.log(`Phase: ${phase}`);
    console.log(`Actual Duration: ${actualDuration.toFixed(2)}ms`);
    console.log(`Base Duration: ${baseDuration.toFixed(2)}ms`);
    console.log(`Start Time: ${startTime.toFixed(2)}ms`);
    console.log(`Commit Time: ${commitTime.toFixed(2)}ms`);
    
    // Calculate optimization percentage
    if (baseDuration > 0) {
      const optimization = ((baseDuration - actualDuration) / baseDuration) * 100;
      console.log(`Optimization: ${optimization.toFixed(1)}% faster than base`);
    }
    
    // Performance recommendations
    if (actualDuration > 50) {
      console.warn('⚠️ Slow render detected! Consider:');
      console.warn('  - Using React.memo() for expensive components');
      console.warn('  - Optimizing useCallback/useMemo dependencies');
      console.warn('  - Reducing component tree depth');
    } else if (actualDuration > 16) {
      console.info('ℹ️ Render time is acceptable but could be optimized');
    } else {
      console.info('✨ Excellent render performance!');
    }
    
    console.groupEnd();
  }
};

/**
 * Performance metrics storage
 */
interface PerformanceMetric {
  id: string;
  phase: 'mount' | 'update' | 'nested-update';
  actualDuration: number;
  baseDuration: number;
  timestamp: number;
}

class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100; // Keep last 100 measurements

  addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getMetrics(id?: string): PerformanceMetric[] {
    if (id) {
      return this.metrics.filter(m => m.id === id);
    }
    return this.metrics;
  }

  getAverageDuration(id: string, phase?: 'mount' | 'update' | 'nested-update'): number {
    const filtered = this.metrics.filter(m => 
      m.id === id && (!phase || m.phase === phase)
    );
    
    if (filtered.length === 0) return 0;
    
    const sum = filtered.reduce((acc, m) => acc + m.actualDuration, 0);
    return sum / filtered.length;
  }

  getSummary(id: string) {
    const metrics = this.getMetrics(id);
    if (metrics.length === 0) {
      return null;
    }

    const mountMetrics = metrics.filter(m => m.phase === 'mount');
    const updateMetrics = metrics.filter(m => m.phase === 'update');

    return {
      totalRenders: metrics.length,
      mounts: mountMetrics.length,
      updates: updateMetrics.length,
      avgMountDuration: this.getAverageDuration(id, 'mount'),
      avgUpdateDuration: this.getAverageDuration(id, 'update'),
      avgOverallDuration: this.getAverageDuration(id),
      lastRender: metrics[metrics.length - 1]
    };
  }

  printSummary(id: string) {
    const summary = this.getSummary(id);
    if (!summary) {
      console.log(`No metrics found for: ${id}`);
      return;
    }

    console.group(`📊 Performance Summary: ${id}`);
    console.log(`Total Renders: ${summary.totalRenders}`);
    console.log(`Mounts: ${summary.mounts}`);
    console.log(`Updates: ${summary.updates}`);
    console.log(`Avg Mount Duration: ${summary.avgMountDuration.toFixed(2)}ms`);
    console.log(`Avg Update Duration: ${summary.avgUpdateDuration.toFixed(2)}ms`);
    console.log(`Avg Overall Duration: ${summary.avgOverallDuration.toFixed(2)}ms`);
    console.groupEnd();
  }

  clear() {
    this.metrics = [];
  }
}

// Global performance tracker instance
export const performanceTracker = new PerformanceTracker();

/**
 * Enhanced profiler callback that tracks metrics
 */
export const trackingOnRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  // Log to console
  onRenderCallback(id, phase, actualDuration, baseDuration, startTime, commitTime);
  
  // Track metrics
  performanceTracker.addMetric({
    id,
    phase,
    actualDuration,
    baseDuration,
    timestamp: commitTime
  });
};

/**
 * Expose performance tracker to window for debugging
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).performanceTracker = performanceTracker;
  console.log('💡 Performance tracker available at: window.performanceTracker');
  console.log('   Usage: window.performanceTracker.printSummary("ComponentName")');
}
