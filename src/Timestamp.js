/**
 * Timestamp class - MongoDB-compatible BSON Timestamp
 * A 64-bit value where the high 32 bits represent seconds since Unix epoch
 * and the low 32 bits represent an incrementing ordinal
 */
export class Timestamp {
  constructor(low, high) {
    if (arguments.length === 0) {
      // Generate new timestamp with current time
      this.low = 0;
      this.high = Math.floor(Date.now() / 1000);
    } else if (arguments.length === 1) {
      // Handle object with low/high properties
      if (typeof low === 'object' && low !== null) {
        this.low = low.low || 0;
        this.high = low.high || 0;
      } else {
        // Single argument - use as high (seconds)
        this.low = 0;
        this.high = low;
      }
    } else {
      // Two arguments: low (increment) and high (seconds)
      this.low = low >>> 0; // Ensure unsigned 32-bit integer
      this.high = high >>> 0; // Ensure unsigned 32-bit integer
    }
  }

  /**
   * Returns the timestamp in a comparable form
   */
  valueOf() {
    return this.high * 0x100000000 + this.low;
  }

  /**
   * Returns the timestamp as a string
   */
  toString() {
    return `Timestamp(${this.high}, ${this.low})`;
  }

  /**
   * Returns the timestamp as a JSON object
   */
  toJSON() {
    return {
      $timestamp: {
        t: this.high,
        i: this.low
      }
    };
  }

  /**
   * Custom inspect for Node.js console.log
   */
  inspect() {
    return this.toString();
  }

  /**
   * Compares this Timestamp with another for equality
   */
  equals(other) {
    if (!other) return false;
    
    if (other instanceof Timestamp) {
      return this.low === other.low && this.high === other.high;
    }
    
    if (typeof other === 'object' && other.low !== undefined && other.high !== undefined) {
      return this.low === other.low && this.high === other.high;
    }
    
    return false;
  }

  /**
   * Get the seconds part of the timestamp
   */
  getHighBits() {
    return this.high;
  }

  /**
   * Get the increment part of the timestamp
   */
  getLowBits() {
    return this.low;
  }

  /**
   * Returns a Date object representing the timestamp
   */
  toDate() {
    return new Date(this.high * 1000);
  }

  /**
   * Creates a Timestamp from a Date object
   */
  static fromDate(date) {
    const seconds = Math.floor(date.getTime() / 1000);
    return new Timestamp(0, seconds);
  }

  /**
   * Creates a Timestamp for the current time
   */
  static now() {
    return new Timestamp();
  }
}
