/**
 * ObjectId class - MongoDB-compatible 24-character hex string identifier
 * Format: 8-char timestamp + 16-char random data
 */
export class ObjectId {
  constructor(id) {
    if (id === undefined || id === null) {
      // Generate new ObjectId
      this.id = ObjectId.generate();
    } else if (typeof id === 'string') {
      // Create from hex string
      if (!ObjectId.isValid(id)) {
        throw new Error(`Argument passed in must be a string of 24 hex characters, got: ${id}`);
      }
      this.id = id.toLowerCase();
    } else if (id instanceof ObjectId) {
      // Copy constructor
      this.id = id.id;
    } else {
      throw new Error(`Argument passed in must be a string of 24 hex characters or an ObjectId`);
    }
  }

  /**
   * Returns the ObjectId as a 24-character hex string
   */
  toString() {
    return this.id;
  }

  /**
   * Returns the ObjectId as a 24-character hex string (alias for toString)
   */
  toHexString() {
    return this.id;
  }

  /**
   * Returns the timestamp portion of the ObjectId as a Date
   */
  getTimestamp() {
    const timestamp = parseInt(this.id.substring(0, 8), 16);
    return new Date(timestamp * 1000);
  }

  /**
   * Compares this ObjectId with another for equality
   */
  equals(other) {
    if (!other) return false;
    
    if (other instanceof ObjectId) {
      return this.id === other.id;
    }
    
    if (typeof other === 'string') {
      return this.id === other.toLowerCase();
    }
    
    // Handle objects with id property
    if (other.id) {
      return this.id === other.id;
    }
    
    return false;
  }

  /**
   * Returns the ObjectId in JSON format (as hex string)
   */
  toJSON() {
    return this.id;
  }

  /**
   * Custom inspect for Node.js console.log
   */
  inspect() {
    return `ObjectId("${this.id}")`;
  }

  /**
   * Validates if a string is a valid ObjectId hex string
   */
  static isValid(id) {
    if (!id) return false;
    if (typeof id !== 'string') return false;
    if (id.length !== 24) return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  /**
   * Creates an ObjectId from a timestamp
   */
  static createFromTime(timestamp) {
    const ts = Math.floor(timestamp / 1000);
    const tsHex = ('00000000' + ts.toString(16)).slice(-8);
    const tail = '0000000000000000'; // Zero out the random portion
    return new ObjectId(tsHex + tail);
  }

  /**
   * Generates a new ObjectId hex string
   * Format: 8-char timestamp (4 bytes) + 16-char random data (8 bytes)
   */
  static generate() {
    const ts = Math.floor(Date.now() / 1000);
    
    // Generate 8 random bytes
    const rand = typeof crypto !== 'undefined' && crypto.getRandomValues ? new Uint8Array(8) : null;
    let tail = '';
    
    if (rand) {
      crypto.getRandomValues(rand);
      for (let i = 0; i < rand.length; i++) {
        tail += ('0' + rand[i].toString(16)).slice(-2);
      }
    } else {
      // Fallback for environments without crypto
      // Generate two 8-character hex strings
      tail = Math.random().toString(16).slice(2).padEnd(8, '0').slice(0, 8) +
             Math.random().toString(16).slice(2).padEnd(8, '0').slice(0, 8);
    }
    
    const tsHex = ('00000000' + ts.toString(16)).slice(-8);
    return (tsHex + tail).slice(0, 24);
  }
}