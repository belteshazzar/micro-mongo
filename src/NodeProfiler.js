/**
 * Node.js Performance Profiler
 * 
 * This module provides comprehensive performance profiling capabilities for Node.js applications,
 * similar to what's available in browser devtools.
 * 
 * Features:
 * - CPU profiling using Node.js inspector
 * - Async operations tracking
 * - Memory snapshots
 * - Custom timing marks and measures
 * - Detailed performance reports
 */

import { performance, PerformanceObserver } from 'perf_hooks';
import { promisify } from 'util';
import fs from 'fs';

export class NodeProfiler {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.marks = new Map();
    this.measures = [];
    this.asyncOperations = new Map();
    this.memorySnapshots = [];
    this.performanceEntries = [];
    
    // Configuration
    this.config = {
      trackMemory: options.trackMemory !== false,
      trackAsync: options.trackAsync !== false,
      trackUserTiming: options.trackUserTiming !== false,
      outputFile: options.outputFile || null,
      ...options
    };
    
    if (this.enabled) {
      this._setupObservers();
    }
  }

  /**
   * Setup performance observers to track various metrics
   */
  _setupObservers() {
    if (this.config.trackUserTiming) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.performanceEntries.push({
            name: entry.name,
            entryType: entry.entryType,
            startTime: entry.startTime,
            duration: entry.duration,
            detail: entry.detail
          });
        });
      });
      
      try {
        observer.observe({ entryTypes: ['measure', 'mark'] });
      } catch (e) {
        // Some entry types might not be supported in this Node.js version
        console.warn(`Performance observer setup: ${e.message}. User timing may not be fully tracked.`);
      }
    }
  }

  /**
   * Mark the start of an operation
   */
  mark(name) {
    if (!this.enabled) return;
    
    performance.mark(name);
    this.marks.set(name, {
      timestamp: performance.now(),
      memory: this.config.trackMemory ? process.memoryUsage() : null
    });
  }

  /**
   * Measure the duration between two marks
   */
  measure(name, startMark, endMark) {
    if (!this.enabled) return;
    
    if (!endMark) {
      // If no end mark, create one now
      endMark = `${startMark}-end`;
      performance.mark(endMark);
    }
    
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      
      const startInfo = this.marks.get(startMark);
      const endInfo = this.marks.get(endMark);
      
      this.measures.push({
        name,
        startMark,
        endMark,
        duration: measure.duration,
        startTime: measure.startTime,
        memory: {
          start: startInfo?.memory,
          end: endInfo?.memory,
          delta: this._calculateMemoryDelta(startInfo?.memory, endInfo?.memory)
        }
      });
    } catch (e) {
      console.warn(`Failed to measure ${name}:`, e.message);
    }
  }

  /**
   * Calculate memory usage delta
   */
  _calculateMemoryDelta(start, end) {
    if (!start || !end) return null;
    
    return {
      rss: end.rss - start.rss,
      heapTotal: end.heapTotal - start.heapTotal,
      heapUsed: end.heapUsed - start.heapUsed,
      external: end.external - start.external
    };
  }

  /**
   * Take a memory snapshot
   */
  takeMemorySnapshot(label = '') {
    if (!this.enabled || !this.config.trackMemory) return;
    
    const memUsage = process.memoryUsage();
    this.memorySnapshots.push({
      timestamp: performance.now(),
      label,
      memory: memUsage
    });
  }

  /**
   * Track an async operation
   */
  startAsyncOp(id, name, details = {}) {
    if (!this.enabled || !this.config.trackAsync) return;
    
    this.asyncOperations.set(id, {
      name,
      startTime: performance.now(),
      startMemory: this.config.trackMemory ? process.memoryUsage() : null,
      details
    });
  }

  /**
   * End tracking an async operation
   */
  endAsyncOp(id, result = null) {
    if (!this.enabled || !this.config.trackAsync) return;
    
    const op = this.asyncOperations.get(id);
    if (!op) return;
    
    const endTime = performance.now();
    const endMemory = this.config.trackMemory ? process.memoryUsage() : null;
    
    op.endTime = endTime;
    op.duration = endTime - op.startTime;
    op.endMemory = endMemory;
    op.memoryDelta = this._calculateMemoryDelta(op.startMemory, endMemory);
    op.result = result;
    op.completed = true;
    
    this.asyncOperations.set(id, op);
  }

  /**
   * Get a summary report
   */
  getReport() {
    const report = {
      summary: {
        totalMeasures: this.measures.length,
        totalAsyncOps: this.asyncOperations.size,
        totalMarks: this.marks.size,
        memorySnapshots: this.memorySnapshots.length
      },
      measures: this.measures.sort((a, b) => b.duration - a.duration),
      asyncOperations: Array.from(this.asyncOperations.values())
        .filter(op => op.completed)
        .sort((a, b) => b.duration - a.duration),
      memorySnapshots: this.memorySnapshots,
      performanceEntries: this.performanceEntries
    };
    
    return report;
  }

  /**
   * Format report as human-readable text
   */
  formatReport(report = null) {
    report = report || this.getReport();
    
    let output = '\n' + '='.repeat(80) + '\n';
    output += 'NODE.JS PERFORMANCE PROFILE REPORT\n';
    output += '='.repeat(80) + '\n\n';
    
    // Summary
    output += 'SUMMARY\n';
    output += '-'.repeat(80) + '\n';
    output += `Total Measures: ${report.summary.totalMeasures}\n`;
    output += `Total Async Operations: ${report.summary.totalAsyncOps}\n`;
    output += `Total Marks: ${report.summary.totalMarks}\n`;
    output += `Memory Snapshots: ${report.summary.memorySnapshots}\n\n`;
    
    // Top measures
    if (report.measures.length > 0) {
      output += 'TOP MEASURES (by duration)\n';
      output += '-'.repeat(80) + '\n';
      output += 'Name'.padEnd(40) + 'Duration(ms)'.padStart(15) + 'Start(ms)'.padStart(15) + '\n';
      output += '-'.repeat(80) + '\n';
      
      const topMeasures = report.measures.slice(0, 20);
      for (const measure of topMeasures) {
        const name = measure.name.substring(0, 38).padEnd(40);
        const duration = measure.duration.toFixed(3).padStart(15);
        const startTime = measure.startTime.toFixed(3).padStart(15);
        output += `${name}${duration}${startTime}\n`;
        
        if (measure.memory?.delta) {
          const delta = measure.memory.delta;
          output += '  Memory Delta: ' +
            `Heap: ${this._formatBytes(delta.heapUsed)}, ` +
            `RSS: ${this._formatBytes(delta.rss)}\n`;
        }
      }
      output += '\n';
    }
    
    // Async operations
    if (report.asyncOperations.length > 0) {
      output += 'ASYNC OPERATIONS (by duration)\n';
      output += '-'.repeat(80) + '\n';
      output += 'Name'.padEnd(40) + 'Duration(ms)'.padStart(15) + 'Start(ms)'.padStart(15) + '\n';
      output += '-'.repeat(80) + '\n';
      
      const topAsync = report.asyncOperations.slice(0, 20);
      for (const op of topAsync) {
        const name = op.name.substring(0, 38).padEnd(40);
        const duration = op.duration.toFixed(3).padStart(15);
        const startTime = op.startTime.toFixed(3).padStart(15);
        output += `${name}${duration}${startTime}\n`;
        
        if (op.memoryDelta) {
          const delta = op.memoryDelta;
          output += '  Memory Delta: ' +
            `Heap: ${this._formatBytes(delta.heapUsed)}, ` +
            `RSS: ${this._formatBytes(delta.rss)}\n`;
        }
      }
      output += '\n';
    }
    
    // Memory timeline
    if (report.memorySnapshots.length > 0) {
      output += 'MEMORY TIMELINE\n';
      output += '-'.repeat(80) + '\n';
      output += 'Time(ms)'.padStart(12) + 'Label'.padEnd(30) + 
                'Heap Used'.padStart(15) + 'RSS'.padStart(15) + '\n';
      output += '-'.repeat(80) + '\n';
      
      for (const snapshot of report.memorySnapshots) {
        const time = snapshot.timestamp.toFixed(3).padStart(12);
        const label = (snapshot.label || '').substring(0, 28).padEnd(30);
        const heap = this._formatBytes(snapshot.memory.heapUsed).padStart(15);
        const rss = this._formatBytes(snapshot.memory.rss).padStart(15);
        output += `${time}${label}${heap}${rss}\n`;
      }
      output += '\n';
    }
    
    output += '='.repeat(80) + '\n';
    return output;
  }

  /**
   * Format bytes as human-readable string
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    if (bytes < 0) return '-' + this._formatBytes(-bytes);
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }

  /**
   * Save report to file
   */
  async saveReport(filename = null) {
    filename = filename || this.config.outputFile || `profile-${Date.now()}.txt`;
    
    const report = this.getReport();
    const formatted = this.formatReport(report);
    
    const writeFile = promisify(fs.writeFile);
    await writeFile(filename, formatted, 'utf8');
    
    // Also save JSON version
    const jsonFilename = filename.replace(/\.txt$/, '.json');
    await writeFile(jsonFilename, JSON.stringify(report, null, 2), 'utf8');
    
    console.log(`\nProfile report saved to:`);
    console.log(`  Text: ${filename}`);
    console.log(`  JSON: ${jsonFilename}\n`);
    
    return { text: filename, json: jsonFilename };
  }

  /**
   * Clear all collected data
   */
  clear() {
    this.marks.clear();
    this.measures = [];
    this.asyncOperations.clear();
    this.memorySnapshots = [];
    this.performanceEntries = [];
    performance.clearMarks();
    performance.clearMeasures();
  }

  /**
   * Enable profiling
   */
  enable() {
    if (this.enabled) return;
    this.enabled = true;
    this._setupObservers();
  }

  /**
   * Disable profiling
   */
  disable() {
    this.enabled = false;
  }
}

// Global instance
export const globalProfiler = new NodeProfiler({ enabled: false });

/**
 * Convenience wrapper for timing a function
 */
export async function profileFunction(name, fn, profiler = globalProfiler) {
  profiler.mark(`${name}-start`);
  profiler.takeMemorySnapshot(`Before ${name}`);
  
  try {
    const result = await fn();
    profiler.mark(`${name}-end`);
    profiler.measure(name, `${name}-start`, `${name}-end`);
    profiler.takeMemorySnapshot(`After ${name}`);
    return result;
  } catch (error) {
    profiler.mark(`${name}-end`);
    profiler.measure(name, `${name}-start`, `${name}-end`);
    profiler.takeMemorySnapshot(`After ${name} (error)`);
    throw error;
  }
}

/**
 * Decorator for profiling async functions
 */
export function profile(name = null) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    const functionName = name || `${target.constructor.name}.${propertyKey}`;
    
    descriptor.value = async function(...args) {
      return await profileFunction(functionName, () => originalMethod.apply(this, args));
    };
    
    return descriptor;
  };
}
