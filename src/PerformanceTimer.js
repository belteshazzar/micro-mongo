/**
 * Performance timing utility for tracking operation durations
 */
export class PerformanceTimer {
  constructor(enabled = false) {
    this.enabled = enabled;
    this.timings = [];
    this.nestedLevel = 0;
  }

  /**
   * Enable or disable timing collection
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Start timing an operation
   */
  start(category, operation, details = {}) {
    if (!this.enabled) return null;

    return {
      category,
      operation,
      details,
      startTime: performance.now(),
      nestedLevel: this.nestedLevel++
    };
  }

  /**
   * End timing an operation
   */
  end(timer, additionalDetails = {}) {
    if (!this.enabled || !timer) return;

    this.nestedLevel--;
    
    const endTime = performance.now();
    const duration = endTime - timer.startTime;

    this.timings.push({
      category: timer.category,
      operation: timer.operation,
      duration,
      details: { ...timer.details, ...additionalDetails },
      nestedLevel: timer.nestedLevel,
      timestamp: timer.startTime
    });
  }

  /**
   * Get all collected timings
   */
  getTimings() {
    return this.timings;
  }

  /**
   * Get timings grouped by category
   */
  getTimingsByCategory() {
    const grouped = {};
    for (const timing of this.timings) {
      if (!grouped[timing.category]) {
        grouped[timing.category] = [];
      }
      grouped[timing.category].push(timing);
    }
    return grouped;
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const summary = {};
    
    for (const timing of this.timings) {
      const key = `${timing.category}.${timing.operation}`;
      if (!summary[key]) {
        summary[key] = {
          category: timing.category,
          operation: timing.operation,
          count: 0,
          total: 0,
          min: Infinity,
          max: -Infinity,
          avg: 0
        };
      }
      
      const stats = summary[key];
      stats.count++;
      stats.total += timing.duration;
      stats.min = Math.min(stats.min, timing.duration);
      stats.max = Math.max(stats.max, timing.duration);
      stats.avg = stats.total / stats.count;
    }
    
    return Object.values(summary);
  }

  /**
   * Clear all timings
   */
  clear() {
    this.timings = [];
    this.nestedLevel = 0;
  }

  /**
   * Format timings as a human-readable string
   */
  formatTimings() {
    const summary = this.getSummary();
    
    if (summary.length === 0) {
      return 'No timing data collected';
    }

    let output = '\n' + '='.repeat(80) + '\n';
    output += 'PERFORMANCE TIMING REPORT\n';
    output += '='.repeat(80) + '\n\n';

    // Group by category
    const byCategory = {};
    for (const stat of summary) {
      if (!byCategory[stat.category]) {
        byCategory[stat.category] = [];
      }
      byCategory[stat.category].push(stat);
    }

    for (const [category, stats] of Object.entries(byCategory)) {
      output += `${category.toUpperCase()}\n`;
      output += '-'.repeat(80) + '\n';
      output += 'Operation'.padEnd(30) + 'Count'.padStart(8) + 'Total(ms)'.padStart(12) + 
                'Avg(ms)'.padStart(12) + 'Min(ms)'.padStart(12) + 'Max(ms)'.padStart(12) + '\n';
      output += '-'.repeat(80) + '\n';

      for (const stat of stats) {
        output += stat.operation.padEnd(30) +
                  stat.count.toString().padStart(8) +
                  stat.total.toFixed(3).padStart(12) +
                  stat.avg.toFixed(3).padStart(12) +
                  stat.min.toFixed(3).padStart(12) +
                  stat.max.toFixed(3).padStart(12) + '\n';
      }
      output += '\n';
    }

    output += '='.repeat(80) + '\n';
    return output;
  }
}

// Global instance that can be accessed from anywhere
export const globalTimer = new PerformanceTimer(false);
