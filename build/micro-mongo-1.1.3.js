class ObjectId {
  constructor(id) {
    if (id === void 0 || id === null) {
      this.id = ObjectId.generate();
    } else if (typeof id === "string") {
      if (!ObjectId.isValid(id)) {
        throw new Error(`Argument passed in must be a string of 24 hex characters, got: ${id}`);
      }
      this.id = id.toLowerCase();
    } else if (id instanceof ObjectId) {
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
    return new Date(timestamp * 1e3);
  }
  /**
   * Compares this ObjectId with another for equality
   */
  equals(other) {
    if (!other) return false;
    if (other instanceof ObjectId) {
      return this.id === other.id;
    }
    if (typeof other === "string") {
      return this.id === other.toLowerCase();
    }
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
    if (typeof id !== "string") return false;
    if (id.length !== 24) return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
  /**
   * Creates an ObjectId from a timestamp
   */
  static createFromTime(timestamp) {
    const ts = Math.floor(timestamp / 1e3);
    const tsHex = ("00000000" + ts.toString(16)).slice(-8);
    const tail = "0000000000000000";
    return new ObjectId(tsHex + tail);
  }
  /**
   * Generates a new ObjectId hex string
   * Format: 8-char timestamp (4 bytes) + 16-char random data (8 bytes)
   */
  static generate() {
    const ts = Math.floor(Date.now() / 1e3);
    const rand = typeof crypto !== "undefined" && crypto.getRandomValues ? new Uint8Array(8) : null;
    let tail = "";
    if (rand) {
      crypto.getRandomValues(rand);
      for (let i = 0; i < rand.length; i++) {
        tail += ("0" + rand[i].toString(16)).slice(-2);
      }
    } else {
      tail = Math.random().toString(16).slice(2).padEnd(8, "0").slice(0, 8) + Math.random().toString(16).slice(2).padEnd(8, "0").slice(0, 8);
    }
    const tsHex = ("00000000" + ts.toString(16)).slice(-8);
    return (tsHex + tail).slice(0, 24);
  }
}
function valuesEqual$1(a, b) {
  if (a instanceof ObjectId || b instanceof ObjectId) {
    if (a instanceof ObjectId && b instanceof ObjectId) {
      return a.equals(b);
    }
    if (a instanceof ObjectId && typeof b === "string") {
      return a.equals(b);
    }
    if (b instanceof ObjectId && typeof a === "string") {
      return b.equals(a);
    }
    return false;
  }
  return a == b;
}
function copy(o) {
  if (o instanceof ObjectId) {
    return new ObjectId(o.id);
  }
  var out, v, key;
  out = Array.isArray(o) ? [] : {};
  for (key in o) {
    v = o[key];
    out[key] = typeof v === "object" && v !== null ? copy(v) : v;
  }
  return out;
}
function getProp(obj, name) {
  var path = name.split(".");
  var result = obj[path[0]];
  for (var i = 1; i < path.length; i++) {
    if (result == void 0 || result == null) return result;
    result = result[path[i]];
  }
  return result;
}
function isArray(o) {
  return Array == o.constructor;
}
function toArray(obj) {
  var arr = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      var el = {};
      el[key] = obj[key];
      arr.push(el);
    }
  }
  return arr;
}
function isIn(val, values) {
  for (var i = 0; i < values.length; i++) {
    if (valuesEqual$1(values[i], val)) return true;
  }
  return false;
}
function arrayMatches(x, y) {
  if (x.length != y.length) return false;
  for (var i = 0; i < x.length; i++) {
    if (valuesEqual$1(x[i], y[i])) continue;
    if (typeof x[i] != typeof y[i]) return false;
    if (typeof x[i] == "object" && x[i] !== null) {
      if (isArray(x[i])) {
        if (!arrayMatches(x[i], y[i])) return false;
      } else {
        if (!objectMatches(x[i], y[i])) return false;
      }
    } else {
      if (!valuesEqual$1(x[i], y[i])) return false;
    }
  }
  return true;
}
function objectMatches(x, y) {
  for (var p in x) {
    if (!x.hasOwnProperty(p)) continue;
    if (!y.hasOwnProperty(p)) return false;
    if (valuesEqual$1(x[p], y[p])) continue;
    if (typeof x[p] != typeof y[p]) return false;
    if (typeof x[p] == "object" && x[p] !== null) {
      if (isArray(x[p])) {
        if (!arrayMatches(x[p], y[p])) return false;
      } else {
        if (!objectMatches(x[p], y[p])) return false;
      }
    } else {
      if (!valuesEqual$1(x[p], y[p])) return false;
    }
  }
  for (var p in y) {
    if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) return false;
  }
  return true;
}
function applyProjection(projection, doc) {
  var result = {};
  var keys = Object.keys(projection);
  if (keys.length == 0) return doc;
  var hasInclusion = false;
  var hasExclusion = false;
  for (var i = 0; i < keys.length; i++) {
    if (keys[i] === "_id") continue;
    if (projection[keys[i]]) hasInclusion = true;
    else hasExclusion = true;
  }
  if (hasInclusion && hasExclusion) {
    throw { $err: "Can't canonicalize query: BadValue Projection cannot have a mix of inclusion and exclusion.", code: 17287 };
  }
  if (projection[keys[0]] || hasInclusion) {
    if (projection._id !== 0) {
      result._id = doc._id;
    }
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] === "_id") continue;
      if (!projection[keys[i]]) continue;
      result[keys[i]] = doc[keys[i]];
    }
  } else {
    for (var key in doc) {
      result[key] = doc[key];
    }
    for (var i = 0; i < keys.length; i++) {
      if (projection[keys[i]]) continue;
      delete result[keys[i]];
    }
  }
  return result;
}
class Cursor {
  constructor(collection, query, projection, matches2, storage, indexes, planQuery, SortedCursor2) {
    this.collection = collection;
    this.query = query;
    this.projection = projection;
    this.matches = matches2;
    this.storage = storage;
    this.indexes = indexes;
    this.planQuery = planQuery;
    this.SortedCursor = SortedCursor2;
    if (projection && Object.keys(projection).length > 0) {
      const keys = Object.keys(projection);
      let hasInclusion = false;
      let hasExclusion = false;
      for (let i = 0; i < keys.length; i++) {
        if (keys[i] === "_id") continue;
        if (projection[keys[i]]) hasInclusion = true;
        else hasExclusion = true;
      }
      if (hasInclusion && hasExclusion) {
        throw { $err: "Can't canonicalize query: BadValue Projection cannot have a mix of inclusion and exclusion.", code: 17287 };
      }
    }
    this.pos = 0;
    this.max = 0;
    this._next = false;
    const queryPlan = this.planQuery(this.query);
    this.useIndex = queryPlan && queryPlan.useIndex;
    this.planType = queryPlan ? queryPlan.planType : "full_scan";
    this.indexDocIds = null;
    this.indexPos = 0;
    this.fullScanDocIds = {};
    if (this.useIndex && queryPlan.docIds) {
      this.indexDocIds = queryPlan.docIds.slice();
    }
    this._findNext();
  }
  _findNext() {
    while (this.indexDocIds !== null && this.indexPos < this.indexDocIds.length) {
      const docId = this.indexDocIds[this.indexPos++];
      const doc = this.storage.getStore()[docId];
      if (doc && this.matches(doc, this.query)) {
        this.fullScanDocIds[doc._id] = true;
        this._next = doc;
        return;
      }
    }
    while (this.pos < this.storage.size() && (this.max == 0 || this.pos < this.max)) {
      const cur = this.storage.get(this.pos++);
      if (cur && !this.fullScanDocIds[cur._id] && this.matches(cur, this.query)) {
        this.fullScanDocIds[cur._id] = true;
        this._next = cur;
        return;
      }
    }
    this._next = null;
  }
  batchSize() {
    throw "Not Implemented";
  }
  close() {
    throw "Not Implemented";
  }
  comment() {
    throw "Not Implemented";
  }
  count() {
    let num = 0;
    const c = new Cursor(this.collection, this.query, null, this.matches, this.storage, this.indexes, this.planQuery, this.SortedCursor);
    while (c.hasNext()) {
      num++;
      c.next();
    }
    return num;
  }
  explain() {
    throw "Not Implemented";
  }
  async forEach(fn) {
    while (this.hasNext()) {
      await fn(this.next());
    }
  }
  hasNext() {
    if (this._next === false) this._findNext();
    return this._next != null;
  }
  hint() {
    throw "Not Implemented";
  }
  itcount() {
    throw "Not Implemented";
  }
  limit(_max) {
    this.max = _max;
    return this;
  }
  map(fn) {
    const results = [];
    while (this.hasNext()) {
      results.push(fn(this.next()));
    }
    return results;
  }
  maxScan() {
    throw "Not Implemented";
  }
  maxTimeMS() {
    throw "Not Implemented";
  }
  max() {
    throw "Not Implemented";
  }
  min() {
    throw "Not Implemented";
  }
  next() {
    if (this._next == null) throw "Error: error hasNext: false";
    const result = this._next;
    this._findNext();
    if (this.projection) return applyProjection(this.projection, result);
    else return result;
  }
  noCursorTimeout() {
    throw "Not Implemented";
  }
  objsLeftInBatch() {
    throw "Not Implemented";
  }
  pretty() {
    throw "Not Implemented";
  }
  readConcern() {
    throw "Not Implemented";
  }
  readPref() {
    throw "Not Implemented";
  }
  returnKey() {
    throw "Not Implemented";
  }
  showRecordId() {
    throw "Not Implemented";
  }
  size() {
    throw "Not Implemented";
  }
  skip(num) {
    while (num > 0) {
      this.next();
      num--;
    }
    return this;
  }
  snapshot() {
    throw "Not Implemented";
  }
  sort(s) {
    return new this.SortedCursor(this.collection, this.query, this, s);
  }
  tailable() {
    throw "Not Implemented";
  }
  async toArray() {
    const results = [];
    while (this.hasNext()) {
      results.push(this.next());
    }
    return results;
  }
  // Support for async iteration (for await...of)
  async *[Symbol.asyncIterator]() {
    while (this.hasNext()) {
      yield this.next();
    }
  }
}
class SortedCursor {
  constructor(collection, query, cursor, sort) {
    this.collection = collection;
    this.query = query;
    this.sortSpec = sort;
    this.pos = 0;
    this.items = [];
    while (cursor.hasNext()) {
      this.items.push(cursor.next());
    }
    const sortKeys = Object.keys(sort);
    this.items.sort(function(a, b) {
      for (let i = 0; i < sortKeys.length; i++) {
        if (a[sortKeys[i]] == void 0 && b[sortKeys[i]] != void 0) return -1 * sort[sortKeys[i]];
        if (a[sortKeys[i]] != void 0 && b[sortKeys[i]] == void 0) return 1 * sort[sortKeys[i]];
        if (a[sortKeys[i]] < b[sortKeys[i]]) return -1 * sort[sortKeys[i]];
        if (a[sortKeys[i]] > b[sortKeys[i]]) return 1 * sort[sortKeys[i]];
      }
      return 0;
    });
  }
  batchSize() {
    throw "Not Implemented";
  }
  close() {
    throw "Not Implemented";
  }
  comment() {
    throw "Not Implemented";
  }
  count() {
    return this.items.length;
  }
  explain() {
    throw "Not Implemented";
  }
  async forEach(fn) {
    while (this.hasNext()) {
      await fn(this.next());
    }
  }
  hasNext() {
    return this.pos < this.items.length;
  }
  hint() {
    throw "Not Implemented";
  }
  itcount() {
    throw "Not Implemented";
  }
  limit(max) {
    this.items = this.items.slice(0, max);
    return this;
  }
  map(fn) {
    const results = [];
    while (this.hasNext()) {
      results.push(fn(this.next()));
    }
    return results;
  }
  maxScan() {
    throw "Not Implemented";
  }
  maxTimeMS() {
    throw "Not Implemented";
  }
  max() {
    throw "Not Implemented";
  }
  min() {
    throw "Not Implemented";
  }
  next() {
    return this.items[this.pos++];
  }
  noCursorTimeout() {
    throw "Not Implemented";
  }
  objsLeftInBatch() {
    throw "Not Implemented";
  }
  pretty() {
    throw "Not Implemented";
  }
  readConcern() {
    throw "Not Implemented";
  }
  readPref() {
    throw "Not Implemented";
  }
  returnKey() {
    throw "Not Implemented";
  }
  showRecordId() {
    throw "Not Implemented";
  }
  size() {
    throw "Not Implemented";
  }
  skip(num) {
    while (num > 0) {
      this.next();
      num--;
    }
    return this;
  }
  snapshot() {
    throw "Not Implemented";
  }
  sort(s) {
    return new SortedCursor(this.collection, this.query, this, s);
  }
  tailable() {
    throw "Not Implemented";
  }
  async toArray() {
    const results = [];
    while (this.hasNext()) {
      results.push(this.next());
    }
    return results;
  }
  // Support for async iteration (for await...of)
  async *[Symbol.asyncIterator]() {
    while (this.hasNext()) {
      yield this.next();
    }
  }
}
const step2list = {
  ational: "ate",
  tional: "tion",
  enci: "ence",
  anci: "ance",
  izer: "ize",
  bli: "ble",
  alli: "al",
  entli: "ent",
  eli: "e",
  ousli: "ous",
  ization: "ize",
  ation: "ate",
  ator: "ate",
  alism: "al",
  iveness: "ive",
  fulness: "ful",
  ousness: "ous",
  aliti: "al",
  iviti: "ive",
  biliti: "ble",
  logi: "log"
};
const step3list = {
  icate: "ic",
  ative: "",
  alize: "al",
  iciti: "ic",
  ical: "ic",
  ful: "",
  ness: ""
};
const consonant = "[^aeiou]";
const vowel = "[aeiouy]";
const consonants = "(" + consonant + "[^aeiouy]*)";
const vowels = "(" + vowel + "[aeiou]*)";
const gt0 = new RegExp("^" + consonants + "?" + vowels + consonants);
const eq1 = new RegExp(
  "^" + consonants + "?" + vowels + consonants + vowels + "?$"
);
const gt1 = new RegExp("^" + consonants + "?(" + vowels + consonants + "){2,}");
const vowelInStem = new RegExp("^" + consonants + "?" + vowel);
const consonantLike = new RegExp("^" + consonants + vowel + "[^aeiouwxy]$");
const sfxLl = /ll$/;
const sfxE = /^(.+?)e$/;
const sfxY = /^(.+?)y$/;
const sfxIon = /^(.+?(s|t))(ion)$/;
const sfxEdOrIng = /^(.+?)(ed|ing)$/;
const sfxAtOrBlOrIz = /(at|bl|iz)$/;
const sfxEED = /^(.+?)eed$/;
const sfxS = /^.+?[^s]s$/;
const sfxSsesOrIes = /^.+?(ss|i)es$/;
const sfxMultiConsonantLike = /([^aeiouylsz])\1$/;
const step2 = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
const step3 = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
const step4 = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
function stemmer(value) {
  let result = String(value).toLowerCase();
  if (result.length < 3) {
    return result;
  }
  let firstCharacterWasLowerCaseY = false;
  if (result.codePointAt(0) === 121) {
    firstCharacterWasLowerCaseY = true;
    result = "Y" + result.slice(1);
  }
  if (sfxSsesOrIes.test(result)) {
    result = result.slice(0, -2);
  } else if (sfxS.test(result)) {
    result = result.slice(0, -1);
  }
  let match;
  if (match = sfxEED.exec(result)) {
    if (gt0.test(match[1])) {
      result = result.slice(0, -1);
    }
  } else if ((match = sfxEdOrIng.exec(result)) && vowelInStem.test(match[1])) {
    result = match[1];
    if (sfxAtOrBlOrIz.test(result)) {
      result += "e";
    } else if (sfxMultiConsonantLike.test(result)) {
      result = result.slice(0, -1);
    } else if (consonantLike.test(result)) {
      result += "e";
    }
  }
  if ((match = sfxY.exec(result)) && vowelInStem.test(match[1])) {
    result = match[1] + "i";
  }
  if ((match = step2.exec(result)) && gt0.test(match[1])) {
    result = match[1] + step2list[match[2]];
  }
  if ((match = step3.exec(result)) && gt0.test(match[1])) {
    result = match[1] + step3list[match[2]];
  }
  if (match = step4.exec(result)) {
    if (gt1.test(match[1])) {
      result = match[1];
    }
  } else if ((match = sfxIon.exec(result)) && gt1.test(match[1])) {
    result = match[1];
  }
  if ((match = sfxE.exec(result)) && (gt1.test(match[1]) || eq1.test(match[1]) && !consonantLike.test(match[1]))) {
    result = match[1];
  }
  if (sfxLl.test(result) && gt1.test(result)) {
    result = result.slice(0, -1);
  }
  if (firstCharacterWasLowerCaseY) {
    result = "y" + result.slice(1);
  }
  return result;
}
const STOPWORDS = /* @__PURE__ */ new Set([
  "a",
  "about",
  "after",
  "all",
  "also",
  "am",
  "an",
  "and",
  "another",
  "any",
  "are",
  "around",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "between",
  "both",
  "but",
  "by",
  "came",
  "can",
  "come",
  "could",
  "did",
  "do",
  "each",
  "for",
  "from",
  "get",
  "got",
  "has",
  "had",
  "he",
  "have",
  "her",
  "here",
  "him",
  "himself",
  "his",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "like",
  "make",
  "many",
  "me",
  "might",
  "more",
  "most",
  "much",
  "must",
  "my",
  "never",
  "now",
  "of",
  "on",
  "only",
  "or",
  "other",
  "our",
  "out",
  "over",
  "said",
  "same",
  "see",
  "should",
  "since",
  "some",
  "still",
  "such",
  "take",
  "than",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "up",
  "very",
  "was",
  "way",
  "we",
  "well",
  "were",
  "what",
  "where",
  "which",
  "while",
  "who",
  "with",
  "would",
  "you",
  "your"
]);
class TextIndex {
  constructor(options = {}) {
    this.index = /* @__PURE__ */ new Map();
    this.documentTerms = /* @__PURE__ */ new Map();
    this.documentLengths = /* @__PURE__ */ new Map();
    this.useStopWords = options.useStopWords !== false;
    this.stopWords = options.stopWords || new Set(STOPWORDS);
  }
  /**
   * Tokenize text into individual words
   * @param {string} text - The text to tokenize
   * @returns {string[]} Array of words
   */
  _tokenize(text2) {
    if (typeof text2 !== "string") {
      return [];
    }
    const words = text2.toLowerCase().split(/\W+/).filter((word) => word.length > 0);
    if (this.useStopWords) {
      return words.filter((word) => !this.stopWords.has(word));
    }
    return words;
  }
  /**
   * Add terms from text to the index for a given document ID
   * @param {string} docId - The document identifier
   * @param {string} text - The text content to index
   */
  add(docId, text2) {
    if (!docId) {
      throw new Error("Document ID is required");
    }
    const words = this._tokenize(text2);
    const termFrequency = /* @__PURE__ */ new Map();
    words.forEach((word) => {
      const stem = stemmer(word);
      termFrequency.set(stem, (termFrequency.get(stem) || 0) + 1);
    });
    termFrequency.forEach((frequency, stem) => {
      if (!this.index.has(stem)) {
        this.index.set(stem, /* @__PURE__ */ new Map());
      }
      this.index.get(stem).set(docId, frequency);
    });
    this.documentTerms.set(docId, termFrequency);
    this.documentLengths.set(docId, words.length);
  }
  /**
   * Remove all indexed terms for a given document ID
   * @param {string} docId - The document identifier to remove
   * @returns {boolean} True if document was found and removed, false otherwise
   */
  remove(docId) {
    if (!this.documentTerms.has(docId)) {
      return false;
    }
    const terms = this.documentTerms.get(docId);
    terms.forEach((frequency, term) => {
      if (this.index.has(term)) {
        this.index.get(term).delete(docId);
        if (this.index.get(term).size === 0) {
          this.index.delete(term);
        }
      }
    });
    this.documentTerms.delete(docId);
    this.documentLengths.delete(docId);
    return true;
  }
  /**
   * Query the index for documents containing the given terms with relevance scoring
   * @param {string} queryText - The search query text
   * @param {Object} options - Query options
   * @param {boolean} options.scored - If true, return scored results; if false, return just IDs (default: true)
   * @param {boolean} options.requireAll - If true, require ALL terms; if false, rank by relevance (default: false)
   * @returns {Array} Array of document IDs (if scored=false) or objects with {id, score} (if scored=true)
   */
  query(queryText, options = { scored: true, requireAll: false }) {
    const words = this._tokenize(queryText);
    if (words.length === 0) {
      return [];
    }
    const stemmedTerms = words.map((word) => stemmer(word));
    const uniqueTerms = [...new Set(stemmedTerms)];
    if (options.requireAll) {
      const docSets = uniqueTerms.map((term) => {
        const termDocs = this.index.get(term);
        return termDocs ? new Set(termDocs.keys()) : /* @__PURE__ */ new Set();
      });
      if (docSets.length === 0) {
        return [];
      }
      const intersection = new Set(docSets[0]);
      for (let i = 1; i < docSets.length; i++) {
        for (const docId of intersection) {
          if (!docSets[i].has(docId)) {
            intersection.delete(docId);
          }
        }
      }
      return Array.from(intersection);
    }
    const totalDocs = this.documentLengths.size;
    const idf = /* @__PURE__ */ new Map();
    uniqueTerms.forEach((term) => {
      const docsWithTerm = this.index.get(term)?.size || 0;
      if (docsWithTerm > 0) {
        idf.set(term, Math.log(totalDocs / docsWithTerm));
      }
    });
    const docScores = /* @__PURE__ */ new Map();
    uniqueTerms.forEach((term) => {
      const termDocs = this.index.get(term);
      if (!termDocs) return;
      termDocs.forEach((termFreq, docId) => {
        if (!docScores.has(docId)) {
          docScores.set(docId, 0);
        }
        const docLength = this.documentLengths.get(docId) || 1;
        const tf = termFreq / docLength;
        const termIdf = idf.get(term) || 0;
        const tfIdf = tf * termIdf;
        docScores.set(docId, docScores.get(docId) + tfIdf);
      });
    });
    docScores.forEach((score, docId) => {
      const docTerms = this.documentTerms.get(docId);
      if (docTerms) {
        const matchingTerms = uniqueTerms.filter((term) => docTerms.has(term)).length;
        const coverage = matchingTerms / uniqueTerms.length;
        docScores.set(docId, score * (1 + coverage));
      }
    });
    const results = Array.from(docScores.entries()).map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score);
    if (options.scored === false) {
      return results.map((r) => r.id);
    }
    return results;
  }
  /**
   * Get the number of unique terms in the index
   * @returns {number} Number of unique terms
   */
  getTermCount() {
    return this.index.size;
  }
  /**
   * Get the number of documents in the index
   * @returns {number} Number of indexed documents
   */
  getDocumentCount() {
    return this.documentTerms.size;
  }
  /**
   * Clear all data from the index
   */
  clear() {
    this.index.clear();
    this.documentTerms.clear();
    this.documentLengths.clear();
  }
  /**
   * Add custom stop words
   * @param {...string} words - Words to add to stop word list
   * @returns {TextIndex} this for chaining
   */
  addStopWords(...words) {
    words.forEach((word) => this.stopWords.add(word.toLowerCase()));
    return this;
  }
  /**
   * Remove words from stop word list
   * @param {...string} words - Words to remove from stop word list
   * @returns {TextIndex} this for chaining
   */
  removeStopWords(...words) {
    words.forEach((word) => this.stopWords.delete(word.toLowerCase()));
    return this;
  }
  /**
   * Enable or disable stop word filtering
   * @param {boolean} enabled - Whether to filter stop words
   * @returns {TextIndex} this for chaining
   */
  setStopWordFiltering(enabled) {
    this.useStopWords = enabled;
    return this;
  }
  /**
   * Serialize the text index state for storage
   * @returns {Object} Serializable state
   */
  serialize() {
    const indexObj = {};
    this.index.forEach((docs, term) => {
      const docsObj = {};
      docs.forEach((freq, docId) => {
        docsObj[docId] = freq;
      });
      indexObj[term] = docsObj;
    });
    const documentTermsObj = {};
    this.documentTerms.forEach((terms, docId) => {
      const termsObj = {};
      terms.forEach((freq, term) => {
        termsObj[term] = freq;
      });
      documentTermsObj[docId] = termsObj;
    });
    const documentLengthsObj = {};
    this.documentLengths.forEach((length, docId) => {
      documentLengthsObj[docId] = length;
    });
    return {
      index: indexObj,
      documentTerms: documentTermsObj,
      documentLengths: documentLengthsObj,
      useStopWords: this.useStopWords,
      stopWords: Array.from(this.stopWords)
    };
  }
  /**
   * Restore the text index state from serialized data
   * @param {Object} state - Serialized state
   */
  deserialize(state) {
    this.index = /* @__PURE__ */ new Map();
    for (const term in state.index) {
      const docs = /* @__PURE__ */ new Map();
      for (const docId in state.index[term]) {
        docs.set(docId, state.index[term][docId]);
      }
      this.index.set(term, docs);
    }
    this.documentTerms = /* @__PURE__ */ new Map();
    for (const docId in state.documentTerms) {
      const terms = /* @__PURE__ */ new Map();
      for (const term in state.documentTerms[docId]) {
        terms.set(term, state.documentTerms[docId][term]);
      }
      this.documentTerms.set(docId, terms);
    }
    this.documentLengths = /* @__PURE__ */ new Map();
    for (const docId in state.documentLengths) {
      this.documentLengths.set(docId, state.documentLengths[docId]);
    }
    this.useStopWords = state.useStopWords !== false;
    if (state.stopWords) {
      this.stopWords = new Set(state.stopWords);
    }
  }
}
function valuesEqual(a, b) {
  if (a instanceof ObjectId || b instanceof ObjectId) {
    if (a instanceof ObjectId && b instanceof ObjectId) {
      return a.equals(b);
    }
    if (a instanceof ObjectId && typeof b === "string") {
      return a.equals(b);
    }
    if (b instanceof ObjectId && typeof a === "string") {
      return b.equals(a);
    }
    return false;
  }
  return a == b;
}
function compareValues(a, b, operator) {
  let aVal = a;
  let bVal = b;
  if (a instanceof ObjectId) {
    aVal = a.toString();
  }
  if (b instanceof ObjectId) {
    bVal = b.toString();
  }
  switch (operator) {
    case ">":
      return aVal > bVal;
    case ">=":
      return aVal >= bVal;
    case "<":
      return aVal < bVal;
    case "<=":
      return aVal <= bVal;
    default:
      return false;
  }
}
function text(prop, query) {
  const textIndex = new TextIndex();
  textIndex.add("id", prop);
  const results = textIndex.query(query, { scored: false });
  return results.length === 1;
}
function geoWithin(prop, query) {
  try {
    if (!Array.isArray(query) || query.length !== 2) {
      return false;
    }
    const minLon = query[0][0];
    const maxLat = query[0][1];
    const maxLon = query[1][0];
    const minLat = query[1][1];
    return isGeometryWithinBBox(prop, minLon, maxLon, minLat, maxLat);
  } catch (e) {
    return false;
  }
}
function isGeometryWithinBBox(geoJson, minLon, maxLon, minLat, maxLat) {
  if (!geoJson) return false;
  if (geoJson.type === "FeatureCollection" && geoJson.features && geoJson.features.length > 0) {
    for (const feature of geoJson.features) {
      if (feature.geometry) {
        if (!isGeometryWithinBBox(feature.geometry, minLon, maxLon, minLat, maxLat)) {
          return false;
        }
      }
    }
    return true;
  }
  if (geoJson.type === "Feature" && geoJson.geometry) {
    return isGeometryWithinBBox(geoJson.geometry, minLon, maxLon, minLat, maxLat);
  }
  if (geoJson.type === "Point" && geoJson.coordinates) {
    const [lng, lat] = geoJson.coordinates;
    if (typeof lng === "number" && typeof lat === "number") {
      return lng >= minLon && lng <= maxLon && lat >= minLat && lat <= maxLat;
    }
  }
  if (geoJson.type === "Polygon" && geoJson.coordinates && geoJson.coordinates.length > 0) {
    for (const ring of geoJson.coordinates) {
      for (const coord of ring) {
        const lng = coord[0];
        const lat = coord[1];
        if (lng < minLon || lng > maxLon || lat < minLat || lat > maxLat) {
          return false;
        }
      }
    }
    return true;
  }
  return false;
}
function where(doc, value) {
  if (typeof value === "function") {
    try {
      return value.call(doc);
    } catch (e) {
      return false;
    }
  } else if (typeof value === "string") {
    try {
      var fn = new Function("return " + value);
      return fn.call(doc);
    } catch (e) {
      return false;
    }
  }
  return false;
}
function tlMatches(doc, query) {
  var key = Object.keys(query)[0];
  var value = query[key];
  if (key.charAt(0) == "$") {
    if (key == "$and") return and(doc, value);
    else if (key == "$or") return or(doc, value);
    else if (key == "$not") return not(doc, value);
    else if (key == "$nor") return nor(doc, value);
    else if (key == "$where") return where(doc, value);
    else throw { $err: "Can't canonicalize query: BadValue unknown top level operator: " + key, code: 17287 };
  } else {
    return opMatches(doc, key, value);
  }
}
function opMatches(doc, key, value) {
  if (typeof value == "string") return valuesEqual(getProp(doc, key), value);
  else if (typeof value == "number") return valuesEqual(getProp(doc, key), value);
  else if (typeof value == "boolean") return valuesEqual(getProp(doc, key), value);
  else if (value instanceof ObjectId) return valuesEqual(getProp(doc, key), value);
  else if (typeof value == "object") {
    if (value instanceof RegExp) return getProp(doc, key) && getProp(doc, key).match(value);
    else if (isArray(value)) return getProp(doc, key) && arrayMatches(getProp(doc, key), value);
    else {
      var keys = Object.keys(value);
      if (keys[0].charAt(0) == "$") {
        for (var i = 0; i < keys.length; i++) {
          var operator = Object.keys(value)[i];
          var operand = value[operator];
          if (operator == "$eq") {
            if (getProp(doc, key) == void 0 || !valuesEqual(getProp(doc, key), operand)) return false;
          } else if (operator == "$gt") {
            if (getProp(doc, key) == void 0 || !compareValues(getProp(doc, key), operand, ">")) return false;
          } else if (operator == "$gte") {
            if (getProp(doc, key) == void 0 || !compareValues(getProp(doc, key), operand, ">=")) return false;
          } else if (operator == "$lt") {
            if (getProp(doc, key) == void 0 || !compareValues(getProp(doc, key), operand, "<")) return false;
          } else if (operator == "$lte") {
            if (getProp(doc, key) == void 0 || !compareValues(getProp(doc, key), operand, "<=")) return false;
          } else if (operator == "$ne") {
            if (getProp(doc, key) == void 0 || !!valuesEqual(getProp(doc, key), operand)) return false;
          } else if (operator == "$in") {
            if (getProp(doc, key) == void 0 || !isIn(getProp(doc, key), operand)) return false;
          } else if (operator == "$nin") {
            if (getProp(doc, key) == void 0 || isIn(getProp(doc, key), operand)) return false;
          } else if (operator == "$exists") {
            if (operand ? getProp(doc, key) == void 0 : getProp(doc, key) != void 0) return false;
          } else if (operator == "$type") {
            if (typeof getProp(doc, key) != operand) return false;
          } else if (operator == "$mod") {
            if (operand.length != 2) throw { $err: "Can't canonicalize query: BadValue malformed mod, not enough elements", code: 17287 };
            if (getProp(doc, key) == void 0 || getProp(doc, key) % operand[0] != operand[1]) return false;
          } else if (operator == "$regex") {
            if (getProp(doc, key) == void 0 || !getProp(doc, key).match(operand)) return false;
          } else if (operator == "$text") {
            if (getProp(doc, key) == void 0 || !text(getProp(doc, key), operand)) return false;
          } else if (operator == "$geoWithin") {
            if (getProp(doc, key) == void 0 || !geoWithin(getProp(doc, key), operand)) return false;
          } else if (operator == "$not") {
            if (opMatches(doc, key, operand)) return false;
          } else if (operator == "$all") {
            var fieldValue = getProp(doc, key);
            if (fieldValue == void 0 || !isArray(fieldValue)) return false;
            for (var j = 0; j < operand.length; j++) {
              if (!isIn(operand[j], fieldValue)) return false;
            }
          } else if (operator == "$elemMatch") {
            var fieldValue = getProp(doc, key);
            if (fieldValue == void 0 || !isArray(fieldValue)) return false;
            var found = false;
            for (var j = 0; j < fieldValue.length; j++) {
              var element = fieldValue[j];
              if (typeof element === "object" && !isArray(element)) {
                if (matches(element, operand)) {
                  found = true;
                  break;
                }
              } else {
                var matchesPrimitive = true;
                var opKeys = Object.keys(operand);
                for (var k = 0; k < opKeys.length; k++) {
                  var op = opKeys[k];
                  var opValue = operand[op];
                  if (op == "$gte" && !(element >= opValue)) matchesPrimitive = false;
                  else if (op == "$gt" && !(element > opValue)) matchesPrimitive = false;
                  else if (op == "$lte" && !(element <= opValue)) matchesPrimitive = false;
                  else if (op == "$lt" && !(element < opValue)) matchesPrimitive = false;
                  else if (op == "$eq" && !(element == opValue)) matchesPrimitive = false;
                  else if (op == "$ne" && !(element != opValue)) matchesPrimitive = false;
                  else if (op == "$in" && !isIn(element, opValue)) matchesPrimitive = false;
                  else if (op == "$nin" && isIn(element, opValue)) matchesPrimitive = false;
                }
                if (matchesPrimitive) {
                  found = true;
                  break;
                }
              }
            }
            if (!found) return false;
          } else if (operator == "$size") {
            var fieldValue = getProp(doc, key);
            if (fieldValue == void 0 || !isArray(fieldValue)) return false;
            if (fieldValue.length != operand) return false;
          } else {
            throw { $err: "Can't canonicalize query: BadValue unknown operator: " + operator, code: 17287 };
          }
        }
        return true;
      } else {
        return getProp(doc, key) && objectMatches(getProp(doc, key), value);
      }
    }
  }
}
function not(doc, value) {
  return !tlMatches(doc, value);
}
function and(doc, els) {
  for (var i = 0; i < els.length; i++) {
    if (!tlMatches(doc, els[i])) {
      return false;
    }
  }
  return true;
}
function or(doc, els) {
  for (var i = 0; i < els.length; i++) {
    if (tlMatches(doc, els[i])) return true;
  }
  return false;
}
function nor(doc, els) {
  for (var i = 0; i < els.length; i++) {
    if (tlMatches(doc, els[i])) return false;
  }
  return true;
}
function matches(doc, query) {
  return and(doc, toArray(query));
}
function applyUpdates(updates, doc, setOnInsert) {
  var keys = Object.keys(updates);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = updates[key];
    if (key == "$inc") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = fields[j];
        var amount = value[field];
        doc[field] = doc[field] + amount;
      }
    } else if (key == "$mul") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = fields[j];
        var amount = value[field];
        doc[field] = doc[field] * amount;
      }
    } else if (key == "$rename") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = fields[j];
        var newName = value[field];
        doc[newName] = doc[field];
        delete doc[field];
      }
    } else if (key == "$setOnInsert" && setOnInsert) {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        doc[fields[j]] = value[fields[j]];
      }
    } else if (key == "$set") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        doc[fields[j]] = value[fields[j]];
      }
    } else if (key == "$unset") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        delete doc[fields[j]];
      }
    } else if (key == "$min") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = fields[j];
        var amount = value[field];
        doc[field] = Math.min(doc[field], amount);
      }
    } else if (key == "$max") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = fields[j];
        var amount = value[field];
        doc[field] = Math.max(doc[field], amount);
      }
    } else if (key == "$currentDate") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        doc[fields[j]] = /* @__PURE__ */ new Date();
      }
    } else if (key == "$addToSet") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = fields[j];
        var value = value[field];
        doc[field].push(value);
      }
    } else if (key == "$pop") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = fields[j];
        var value = value[field];
        if (value == 1) {
          doc[field].pop();
        } else if (value == -1) {
          doc[field].shift();
        }
      }
    } else if (key == "$pullAll") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var src = doc[fields[j]];
        var toRemove = value[fields[j]];
        var notRemoved = [];
        for (var k = 0; k < src.length; k++) {
          var removed = false;
          for (var l = 0; l < toRemove.length; l++) {
            if (src[k] == toRemove[l]) {
              removed = true;
              break;
            }
          }
          if (!removed) notRemoved.push(src[k]);
        }
        doc[fields[j]] = notRemoved;
      }
    } else if (key == "$pushAll") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = fields[j];
        var values = value[field];
        for (var k = 0; k < values.length; k++) {
          doc[field].push(values[k]);
        }
      }
    } else if (key == "$push") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = fields[j];
        doc[field].push(value[field]);
      }
    } else if (key == "$bit") {
      var field = Object.keys(value)[0];
      var operation = value[field];
      var operator = Object.keys(operation)[0];
      var operand = operation[operator];
      if (operator == "and") {
        doc[field] = doc[field] & operand;
      } else if (operator == "or") {
        doc[field] = doc[field] | operand;
      } else if (operator == "xor") {
        doc[field] = doc[field] ^ operand;
      } else {
        throw "unknown $bit operator: " + operator;
      }
    } else {
      throw "unknown update operator: " + key;
    }
  }
}
function createDocFromUpdate(query, updates, idGenerator) {
  var newDoc = { _id: idGenerator() };
  var onlyFields = true;
  var updateKeys = Object.keys(updates);
  for (var i = 0; i < updateKeys.length; i++) {
    if (updateKeys[i].charAt(0) == "$") {
      onlyFields = false;
      break;
    }
  }
  if (onlyFields) {
    for (var i = 0; i < updateKeys.length; i++) {
      newDoc[updateKeys[i]] = updates[updateKeys[i]];
    }
  } else {
    var queryKeys = Object.keys(query);
    for (var i = 0; i < queryKeys.length; i++) {
      newDoc[queryKeys[i]] = query[queryKeys[i]];
    }
    applyUpdates(updates, newDoc, true);
  }
  return newDoc;
}
class CollectionIndex {
  constructor(keys, options = {}) {
    this.keys = keys;
    this.options = options;
    this.name = options.name || this.generateIndexName(keys);
  }
  /**
   * Generate index name from keys
   */
  generateIndexName(keys) {
    const parts = [];
    for (const field in keys) {
      if (keys.hasOwnProperty(field)) {
        parts.push(field + "_" + keys[field]);
      }
    }
    return parts.join("_");
  }
  /**
   * Add a document to the index
   * @param {Object} doc - The document to index
   */
  add(doc) {
    throw new Error("add() must be implemented by subclass");
  }
  /**
   * Remove a document from the index
   * @param {Object} doc - The document to remove
   */
  remove(doc) {
    throw new Error("remove() must be implemented by subclass");
  }
  /**
   * Update a document in the index (remove old, add new)
   * @param {Object} oldDoc - The old document
   * @param {Object} newDoc - The new document
   */
  update(oldDoc, newDoc) {
    this.remove(oldDoc);
    this.add(newDoc);
  }
  /**
   * Query the index
   * @param {*} query - The query to execute
   * @returns {Array} Array of document IDs or null if index cannot satisfy query
   */
  query(query) {
    throw new Error("query() must be implemented by subclass");
  }
  /**
   * Clear all data from the index
   */
  clear() {
    throw new Error("clear() must be implemented by subclass");
  }
  /**
   * Get index specification (for getIndexes())
   */
  getSpec() {
    return {
      name: this.name,
      key: this.keys
    };
  }
  /**
   * Serialize index state for storage
   * @returns {Object} Serializable index state
   */
  serialize() {
    throw new Error("serialize() must be implemented by subclass");
  }
  /**
   * Restore index state from serialized data
   * @param {Object} data - Serialized index state
   */
  deserialize(data) {
    throw new Error("deserialize() must be implemented by subclass");
  }
}
class RegularCollectionIndex extends CollectionIndex {
  constructor(keys, options = {}) {
    super(keys, options);
    this.data = {};
  }
  /**
   * Extract index key value from a document
   */
  extractIndexKey(doc) {
    const keyFields = Object.keys(this.keys);
    if (keyFields.length === 0) return null;
    if (keyFields.length === 1) {
      const field = keyFields[0];
      const value = getProp(doc, field);
      if (value === void 0) return null;
      return JSON.stringify({ t: typeof value, v: value });
    }
    const keyParts = [];
    for (let i = 0; i < keyFields.length; i++) {
      const value = getProp(doc, keyFields[i]);
      if (value === void 0) return null;
      keyParts.push(JSON.stringify(value));
    }
    return keyParts.join("\0");
  }
  /**
   * Add a document to the index
   * @param {Object} doc - The document to index
   */
  add(doc) {
    const indexKey = this.extractIndexKey(doc);
    if (indexKey !== null) {
      if (!this.data[indexKey]) {
        this.data[indexKey] = [];
      }
      this.data[indexKey].push(doc._id);
    }
  }
  /**
   * Remove a document from the index
   * @param {Object} doc - The document to remove
   */
  remove(doc) {
    const indexKey = this.extractIndexKey(doc);
    if (indexKey !== null && this.data[indexKey]) {
      const arr = this.data[indexKey];
      const idx = arr.indexOf(doc._id);
      if (idx !== -1) {
        arr.splice(idx, 1);
      }
      if (arr.length === 0) {
        delete this.data[indexKey];
      }
    }
  }
  /**
   * Query the index
   * @param {*} query - The query object
   * @returns {Array|null} Array of document IDs or null if index cannot satisfy query
   */
  query(query) {
    const queryKeys = Object.keys(query);
    const indexFields = Object.keys(this.keys);
    if (indexFields.length !== 1) {
      return null;
    }
    const field = indexFields[0];
    if (queryKeys.indexOf(field) === -1) {
      return null;
    }
    const queryValue = query[field];
    if (typeof queryValue !== "object" || queryValue === null) {
      const indexKey = JSON.stringify({ t: typeof queryValue, v: queryValue });
      return this.data[indexKey] || [];
    }
    if (typeof queryValue === "object" && !Array.isArray(queryValue)) {
      return this._queryWithOperators(field, queryValue);
    }
    return null;
  }
  /**
   * Query index with comparison operators
   * @private
   */
  _queryWithOperators(field, operators) {
    const ops = Object.keys(operators);
    const results = /* @__PURE__ */ new Set();
    const hasRangeOp = ops.some((op) => ["$gt", "$gte", "$lt", "$lte"].includes(op));
    if (hasRangeOp) {
      for (const indexKey in this.data) {
        try {
          const parsed = JSON.parse(indexKey);
          const value = parsed.v;
          const type = parsed.t;
          let matches2 = true;
          for (const op of ops) {
            const operand = operators[op];
            if (op === "$gt" && !(value > operand)) matches2 = false;
            else if (op === "$gte" && !(value >= operand)) matches2 = false;
            else if (op === "$lt" && !(value < operand)) matches2 = false;
            else if (op === "$lte" && !(value <= operand)) matches2 = false;
            else if (op === "$eq" && !(value === operand)) matches2 = false;
            else if (op === "$ne" && !(value !== operand)) matches2 = false;
          }
          if (matches2) {
            this.data[indexKey].forEach((id) => results.add(id));
          }
        } catch (e) {
        }
      }
      return Array.from(results);
    }
    if (ops.includes("$in")) {
      const values = operators["$in"];
      if (Array.isArray(values)) {
        for (const value of values) {
          const indexKey = JSON.stringify({ t: typeof value, v: value });
          if (this.data[indexKey]) {
            this.data[indexKey].forEach((id) => results.add(id));
          }
        }
        return Array.from(results);
      }
    }
    if (ops.includes("$eq")) {
      const value = operators["$eq"];
      const indexKey = JSON.stringify({ t: typeof value, v: value });
      return this.data[indexKey] || [];
    }
    if (ops.includes("$ne")) {
      const excludeValue = operators["$ne"];
      const excludeKey = JSON.stringify({ t: typeof excludeValue, v: excludeValue });
      for (const indexKey in this.data) {
        if (indexKey !== excludeKey) {
          this.data[indexKey].forEach((id) => results.add(id));
        }
      }
      return Array.from(results);
    }
    return null;
  }
  /**
   * Clear all data from the index
   */
  clear() {
    this.data = {};
  }
  /**
   * Serialize index state for storage
   * @returns {Object} Serializable index state
   */
  serialize() {
    return {
      type: "regular",
      keys: this.keys,
      options: this.options,
      data: this.data
    };
  }
  /**
   * Restore index state from serialized data
   * @param {Object} state - Serialized index state
   */
  deserialize(state) {
    this.data = state.data || {};
  }
}
class TextCollectionIndex extends CollectionIndex {
  constructor(keys, options = {}) {
    super(keys, options);
    this.textIndex = new TextIndex(options);
    this.indexedFields = [];
    for (const field in keys) {
      if (keys[field] === "text") {
        this.indexedFields.push(field);
      }
    }
    if (this.indexedFields.length === 0) {
      throw new Error('Text index must have at least one field with type "text"');
    }
  }
  /**
   * Extract text content from a document for the indexed fields
   * @param {Object} doc - The document
   * @returns {string} Combined text from all indexed fields
   */
  _extractText(doc) {
    const textParts = [];
    for (const field of this.indexedFields) {
      const value = getProp(doc, field);
      if (value !== void 0 && value !== null) {
        textParts.push(String(value));
      }
    }
    return textParts.join(" ");
  }
  /**
   * Add a document to the text index
   * @param {Object} doc - The document to index
   */
  add(doc) {
    if (!doc._id) {
      throw new Error("Document must have an _id field");
    }
    const text2 = this._extractText(doc);
    if (text2) {
      this.textIndex.add(String(doc._id), text2);
    }
  }
  /**
   * Remove a document from the text index
   * @param {Object} doc - The document to remove
   */
  remove(doc) {
    if (!doc._id) {
      return;
    }
    this.textIndex.remove(String(doc._id));
  }
  /**
   * Query the text index
   * @param {*} query - The query object
   * @returns {Array|null} Array of document IDs or null if query is not a text search
   */
  query(query) {
    return null;
  }
  /**
   * Search the text index
   * @param {string} searchText - The text to search for
   * @param {Object} options - Search options
   * @returns {Array} Array of document IDs
   */
  search(searchText, options = {}) {
    const results = this.textIndex.query(searchText, { scored: false, ...options });
    return results;
  }
  /**
   * Clear all data from the index
   */
  clear() {
    this.textIndex.clear();
  }
  /**
   * Get index specification
   */
  getSpec() {
    return {
      name: this.name,
      key: this.keys,
      textIndexVersion: 3,
      weights: this._getWeights()
    };
  }
  /**
   * Get field weights (all default to 1 for now)
   */
  _getWeights() {
    const weights = {};
    for (const field of this.indexedFields) {
      weights[field] = 1;
    }
    return weights;
  }
  /**
   * Serialize index state for storage
   * @returns {Object} Serializable index state
   */
  serialize() {
    return {
      type: "text",
      keys: this.keys,
      options: this.options,
      indexedFields: this.indexedFields,
      textIndexState: this.textIndex.serialize()
    };
  }
  /**
   * Restore index state from serialized data
   * @param {Object} state - Serialized index state
   */
  deserialize(state) {
    this.indexedFields = state.indexedFields || [];
    if (state.textIndexState) {
      this.textIndex.deserialize(state.textIndexState);
    }
  }
}
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function radiusToBoundingBox(lat, lng, radiusKm) {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta
  };
}
function intersects(bbox1, bbox2) {
  return !(bbox1.maxLat < bbox2.minLat || bbox1.minLat > bbox2.maxLat || bbox1.maxLng < bbox2.minLng || bbox1.minLng > bbox2.maxLng);
}
function area(bbox) {
  return (bbox.maxLat - bbox.minLat) * (bbox.maxLng - bbox.minLng);
}
function union(bbox1, bbox2) {
  return {
    minLat: Math.min(bbox1.minLat, bbox2.minLat),
    maxLat: Math.max(bbox1.maxLat, bbox2.maxLat),
    minLng: Math.min(bbox1.minLng, bbox2.minLng),
    maxLng: Math.max(bbox1.maxLng, bbox2.maxLng)
  };
}
function enlargement(bbox1, bbox2) {
  const unionBox = union(bbox1, bbox2);
  return area(unionBox) - area(bbox1);
}
class RTreeNode {
  constructor(isLeaf = false) {
    this.isLeaf = isLeaf;
    this.children = [];
    this.bbox = null;
  }
  /**
   * Update the bounding box to contain all children
   */
  updateBBox() {
    if (this.children.length === 0) {
      this.bbox = null;
      return;
    }
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    for (const child of this.children) {
      const bbox = child.bbox;
      minLat = Math.min(minLat, bbox.minLat);
      maxLat = Math.max(maxLat, bbox.maxLat);
      minLng = Math.min(minLng, bbox.minLng);
      maxLng = Math.max(maxLng, bbox.maxLng);
    }
    this.bbox = { minLat, maxLat, minLng, maxLng };
  }
}
class RTree {
  constructor(maxEntries = 9) {
    this.maxEntries = maxEntries;
    this.minEntries = Math.max(2, Math.ceil(maxEntries / 2));
    this.root = new RTreeNode(true);
    this._size = 0;
  }
  /**
   * Insert a point into the R-tree
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {*} data - Associated data
   */
  insert(lat, lng, data) {
    const bbox = {
      minLat: lat,
      maxLat: lat,
      minLng: lng,
      maxLng: lng
    };
    const entry = { bbox, lat, lng, data };
    this._insert(entry, this.root, 1);
    this._size++;
  }
  /**
   * Internal insert method
   */
  _insert(entry, node, level) {
    if (node.isLeaf) {
      node.children.push(entry);
      node.updateBBox();
      if (node.children.length > this.maxEntries) {
        return this._split(node);
      }
    } else {
      const target = this._chooseSubtree(entry.bbox, node);
      const splitNode = this._insert(entry, target, level + 1);
      if (splitNode) {
        node.children.push(splitNode);
        node.updateBBox();
        if (node.children.length > this.maxEntries) {
          return this._split(node);
        }
      } else {
        node.updateBBox();
      }
    }
    return null;
  }
  /**
   * Choose the best subtree to insert an entry
   */
  _chooseSubtree(bbox, node) {
    let minEnlargement = Infinity;
    let minArea = Infinity;
    let targetNode = null;
    for (const child of node.children) {
      const enl = enlargement(child.bbox, bbox);
      const ar = area(child.bbox);
      if (enl < minEnlargement || enl === minEnlargement && ar < minArea) {
        minEnlargement = enl;
        minArea = ar;
        targetNode = child;
      }
    }
    return targetNode;
  }
  /**
   * Split an overflowing node
   */
  _split(node) {
    const children = node.children;
    const isLeaf = node.isLeaf;
    let maxDist = -Infinity;
    let seed1Idx = 0, seed2Idx = 1;
    for (let i = 0; i < children.length; i++) {
      for (let j = i + 1; j < children.length; j++) {
        const bbox1 = children[i].bbox;
        const bbox2 = children[j].bbox;
        const combinedBox = union(bbox1, bbox2);
        const waste = area(combinedBox) - area(bbox1) - area(bbox2);
        if (waste > maxDist) {
          maxDist = waste;
          seed1Idx = i;
          seed2Idx = j;
        }
      }
    }
    const node1 = new RTreeNode(isLeaf);
    const node2 = new RTreeNode(isLeaf);
    node1.children.push(children[seed1Idx]);
    node2.children.push(children[seed2Idx]);
    for (let i = 0; i < children.length; i++) {
      if (i === seed1Idx || i === seed2Idx) continue;
      const child = children[i];
      const bbox = child.bbox;
      const enl1 = node1.children.length === 0 ? Infinity : enlargement(node1.bbox || bbox, bbox);
      const enl2 = node2.children.length === 0 ? Infinity : enlargement(node2.bbox || bbox, bbox);
      if (node1.children.length < this.minEntries && children.length - i + node1.children.length <= this.minEntries) {
        node1.children.push(child);
      } else if (node2.children.length < this.minEntries && children.length - i + node2.children.length <= this.minEntries) {
        node2.children.push(child);
      } else if (enl1 < enl2) {
        node1.children.push(child);
      } else if (enl2 < enl1) {
        node2.children.push(child);
      } else {
        const area1 = node1.bbox ? area(node1.bbox) : 0;
        const area2 = node2.bbox ? area(node2.bbox) : 0;
        if (area1 < area2) {
          node1.children.push(child);
        } else {
          node2.children.push(child);
        }
      }
      node1.updateBBox();
      node2.updateBBox();
    }
    node.children = node1.children;
    node.updateBBox();
    if (node === this.root) {
      const newRoot = new RTreeNode(false);
      newRoot.children = [node1, node2];
      newRoot.updateBBox();
      this.root = newRoot;
      return null;
    }
    return node2;
  }
  /**
   * Search for points within a bounding box
   * @param {Object} bbox - Bounding box {minLat, maxLat, minLng, maxLng}
   * @returns {Array} Array of matching entries
   */
  searchBBox(bbox) {
    const results = [];
    this._searchBBox(bbox, this.root, results);
    return results;
  }
  /**
   * Internal bounding box search
   */
  _searchBBox(bbox, node, results) {
    if (!node.bbox || !intersects(bbox, node.bbox)) {
      return;
    }
    if (node.isLeaf) {
      for (const entry of node.children) {
        if (intersects(bbox, entry.bbox)) {
          results.push(entry);
        }
      }
    } else {
      for (const child of node.children) {
        this._searchBBox(bbox, child, results);
      }
    }
  }
  /**
   * Search for points within a radius of a location
   * @param {number} lat - Center latitude
   * @param {number} lng - Center longitude
   * @param {number} radiusKm - Radius in kilometers
   * @returns {Array} Array of matching entries
   */
  searchRadius(lat, lng, radiusKm) {
    const bbox = radiusToBoundingBox(lat, lng, radiusKm);
    const candidates = this.searchBBox(bbox);
    const results = [];
    for (const entry of candidates) {
      const dist = haversineDistance(lat, lng, entry.lat, entry.lng);
      if (dist <= radiusKm) {
        results.push(entry);
      }
    }
    return results;
  }
  /**
   * Remove a point from the R-tree
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {*} data - Associated data (optional, for exact match)
   * @returns {boolean} True if removed, false if not found
   */
  remove(lat, lng, data = null) {
    const bbox = {
      minLat: lat,
      maxLat: lat,
      minLng: lng,
      maxLng: lng
    };
    const removed = this._remove(bbox, data, this.root, null, -1);
    if (removed) {
      this._size--;
    }
    if (this.root.children.length === 1 && !this.root.isLeaf) {
      this.root = this.root.children[0];
    }
    return removed;
  }
  /**
   * Internal remove method
   */
  _remove(bbox, data, node, parent, indexInParent) {
    if (!node.bbox || !intersects(bbox, node.bbox)) {
      return false;
    }
    if (node.isLeaf) {
      for (let i = 0; i < node.children.length; i++) {
        const entry = node.children[i];
        if (entry.lat === bbox.minLat && entry.lng === bbox.minLng) {
          const dataMatches = data === null || JSON.stringify(entry.data) === JSON.stringify(data);
          if (dataMatches) {
            node.children.splice(i, 1);
            node.updateBBox();
            if (node.children.length < this.minEntries && node !== this.root) {
              const entries = node.children.slice();
              node.children = [];
              node.updateBBox();
              if (parent) {
                parent.children.splice(indexInParent, 1);
                parent.updateBBox();
              }
              for (const e of entries) {
                this._insert(e, this.root, 1);
              }
            }
            return true;
          }
        }
      }
    } else {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (this._remove(bbox, data, child, node, i)) {
          node.updateBBox();
          return true;
        }
      }
    }
    return false;
  }
  /**
   * Get all entries in the tree
   * @returns {Array} All entries
   */
  getAll() {
    const results = [];
    this._getAll(this.root, results);
    return results;
  }
  /**
   * Internal method to get all entries
   */
  _getAll(node, results) {
    if (node.isLeaf) {
      results.push(...node.children);
    } else {
      for (const child of node.children) {
        this._getAll(child, results);
      }
    }
  }
  /**
   * Get the number of entries in the tree
   * @returns {number} Number of entries
   */
  size() {
    return this._size;
  }
  /**
   * Clear all entries from the tree
   */
  clear() {
    this.root = new RTreeNode(true);
    this._size = 0;
  }
  /**
   * Serialize the R-tree state for storage
   * @returns {Object} Serializable state
   */
  serialize() {
    return {
      maxEntries: this.maxEntries,
      minEntries: this.minEntries,
      size: this._size,
      root: this._serializeNode(this.root)
    };
  }
  /**
   * Serialize a node recursively
   */
  _serializeNode(node) {
    const serialized = {
      isLeaf: node.isLeaf,
      bbox: node.bbox,
      children: []
    };
    if (node.isLeaf) {
      serialized.children = node.children.map((entry) => ({
        bbox: entry.bbox,
        lat: entry.lat,
        lng: entry.lng,
        data: entry.data
      }));
    } else {
      serialized.children = node.children.map((child) => this._serializeNode(child));
    }
    return serialized;
  }
  /**
   * Restore the R-tree state from serialized data
   * @param {Object} state - Serialized state
   */
  deserialize(state) {
    this.maxEntries = state.maxEntries || 9;
    this.minEntries = state.minEntries || Math.ceil(this.maxEntries / 2);
    this._size = state.size || 0;
    this.root = this._deserializeNode(state.root);
  }
  /**
   * Deserialize a node recursively
   */
  _deserializeNode(serialized) {
    const node = new RTreeNode(serialized.isLeaf);
    node.bbox = serialized.bbox;
    if (serialized.isLeaf) {
      node.children = serialized.children.map((entry) => ({
        bbox: entry.bbox,
        lat: entry.lat,
        lng: entry.lng,
        data: entry.data
      }));
    } else {
      node.children = serialized.children.map((child) => this._deserializeNode(child));
    }
    return node;
  }
}
class GeospatialCollectionIndex extends CollectionIndex {
  constructor(keys, options = {}) {
    super(keys, options);
    this.rtree = new RTree();
    this.geoField = null;
    for (const field in keys) {
      if (keys[field] === "2dsphere" || keys[field] === "2d") {
        this.geoField = field;
        break;
      }
    }
    if (!this.geoField) {
      throw new Error('Geospatial index must have at least one field with type "2dsphere" or "2d"');
    }
  }
  /**
   * Extract coordinates from a GeoJSON object
   * @param {Object} geoJson - The GeoJSON object
   * @returns {Object|null} Object with lat and lng, or null if invalid
   */
  _extractCoordinates(geoJson) {
    if (!geoJson) return null;
    if (geoJson.type === "FeatureCollection" && geoJson.features && geoJson.features.length > 0) {
      const feature = geoJson.features[0];
      if (feature.geometry) {
        return this._extractCoordinates(feature.geometry);
      }
    }
    if (geoJson.type === "Feature" && geoJson.geometry) {
      return this._extractCoordinates(geoJson.geometry);
    }
    if (geoJson.type === "Point" && geoJson.coordinates) {
      const [lng, lat] = geoJson.coordinates;
      if (typeof lng === "number" && typeof lat === "number") {
        return { lat, lng };
      }
    }
    if (geoJson.type === "Polygon" && geoJson.coordinates && geoJson.coordinates.length > 0) {
      const ring = geoJson.coordinates[0];
      if (ring.length > 0) {
        let sumLat = 0, sumLng = 0;
        for (const coord of ring) {
          sumLng += coord[0];
          sumLat += coord[1];
        }
        return {
          lat: sumLat / ring.length,
          lng: sumLng / ring.length
        };
      }
    }
    return null;
  }
  /**
   * Add a document to the geospatial index
   * @param {Object} doc - The document to index
   */
  add(doc) {
    if (!doc._id) {
      throw new Error("Document must have an _id field");
    }
    const geoValue = getProp(doc, this.geoField);
    const coords = this._extractCoordinates(geoValue);
    if (coords) {
      this.rtree.insert(coords.lat, coords.lng, {
        _id: doc._id,
        geoJson: geoValue
      });
    }
  }
  /**
   * Remove a document from the geospatial index
   * @param {Object} doc - The document to remove
   */
  remove(doc) {
    if (!doc._id) {
      return;
    }
    const geoValue = getProp(doc, this.geoField);
    const coords = this._extractCoordinates(geoValue);
    if (coords) {
      this.rtree.remove(coords.lat, coords.lng, {
        _id: doc._id,
        geoJson: geoValue
      });
    }
  }
  /**
   * Query the geospatial index
   * @param {*} query - The query object
   * @returns {Array|null} Array of document IDs or null if query is not a geospatial query
   */
  query(query) {
    if (!query[this.geoField]) {
      return null;
    }
    const geoQuery = query[this.geoField];
    if (geoQuery.$geoWithin) {
      const bbox = geoQuery.$geoWithin;
      if (Array.isArray(bbox) && bbox.length === 2) {
        const minLon = bbox[0][0];
        const maxLat = bbox[0][1];
        const maxLon = bbox[1][0];
        const minLat = bbox[1][1];
        const results = this.rtree.searchBBox({
          minLat,
          maxLat,
          minLng: minLon,
          maxLng: maxLon
        });
        return results.map((entry) => entry.data._id);
      }
    }
    return null;
  }
  /**
   * Clear all data from the index
   */
  clear() {
    this.rtree.clear();
  }
  /**
   * Get index specification
   */
  getSpec() {
    return {
      name: this.name,
      key: this.keys,
      "2dsphereIndexVersion": 3
    };
  }
  /**
   * Serialize index state for storage
   * @returns {Object} Serializable index state
   */
  serialize() {
    return {
      type: "geospatial",
      keys: this.keys,
      options: this.options,
      geoField: this.geoField,
      rtreeState: this.rtree.serialize()
    };
  }
  /**
   * Restore index state from serialized data
   * @param {Object} state - Serialized index state
   */
  deserialize(state) {
    this.geoField = state.geoField;
    if (state.rtreeState) {
      this.rtree.deserialize(state.rtreeState);
    }
  }
}
class QueryPlan {
  constructor() {
    this.type = "full_scan";
    this.indexes = [];
    this.indexScans = [];
    this.estimatedCost = Infinity;
  }
}
class QueryPlanner {
  constructor(indexes) {
    this.indexes = indexes;
  }
  /**
   * Generate an execution plan for a query
   * @param {Object} query - MongoDB query object
   * @returns {QueryPlan} Execution plan
   */
  plan(query) {
    const plan = new QueryPlan();
    if (!query || Object.keys(query).length === 0) {
      return plan;
    }
    const analysis = this._analyzeQuery(query);
    if (analysis.hasTextSearch) {
      const textPlan = this._planTextSearch(query, analysis);
      if (textPlan) {
        return textPlan;
      }
    }
    if (analysis.hasGeoQuery) {
      const geoPlan = this._planGeoQuery(query, analysis);
      if (geoPlan) {
        return geoPlan;
      }
    }
    if (analysis.type === "and") {
      const andPlan = this._planAndQuery(query, analysis);
      if (andPlan.type !== "full_scan") {
        return andPlan;
      }
    }
    if (analysis.type === "or") {
      const orPlan = this._planOrQuery(query, analysis);
      if (orPlan.type !== "full_scan") {
        return orPlan;
      }
    }
    const simplePlan = this._planSimpleQuery(query);
    if (simplePlan.type !== "full_scan") {
      return simplePlan;
    }
    return plan;
  }
  /**
   * Analyze query structure
   * @private
   */
  _analyzeQuery(query) {
    const analysis = {
      type: "simple",
      // 'simple', 'and', 'or', 'complex'
      fields: [],
      operators: {},
      hasTextSearch: false,
      hasGeoQuery: false,
      conditions: []
    };
    const keys = Object.keys(query);
    if (keys.length === 1) {
      const key = keys[0];
      if (key === "$and") {
        analysis.type = "and";
        analysis.conditions = query.$and;
        for (const condition of analysis.conditions) {
          const subAnalysis = this._analyzeQuery(condition);
          analysis.fields.push(...subAnalysis.fields);
          if (subAnalysis.hasTextSearch) analysis.hasTextSearch = true;
          if (subAnalysis.hasGeoQuery) analysis.hasGeoQuery = true;
        }
        return analysis;
      } else if (key === "$or") {
        analysis.type = "or";
        analysis.conditions = query.$or;
        for (const condition of analysis.conditions) {
          const subAnalysis = this._analyzeQuery(condition);
          analysis.fields.push(...subAnalysis.fields);
          if (subAnalysis.hasTextSearch) analysis.hasTextSearch = true;
          if (subAnalysis.hasGeoQuery) analysis.hasGeoQuery = true;
        }
        return analysis;
      }
    }
    for (const field of keys) {
      if (field.startsWith("$")) {
        continue;
      }
      analysis.fields.push(field);
      const value = query[field];
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const ops = Object.keys(value);
        analysis.operators[field] = ops;
        if (ops.includes("$text")) {
          analysis.hasTextSearch = true;
        }
        if (ops.some((op) => ["$geoWithin", "$geoIntersects", "$near", "$nearSphere"].includes(op))) {
          analysis.hasGeoQuery = true;
        }
      }
    }
    if (keys.length > 1) {
      analysis.type = "and";
    }
    return analysis;
  }
  /**
   * Plan for text search queries
   * @private
   */
  _planTextSearch(query, analysis) {
    for (const indexName in this.indexes) {
      const index = this.indexes[indexName];
      if (index instanceof TextCollectionIndex) {
        const textQuery = this._extractTextQuery(query);
        if (textQuery) {
          const plan = new QueryPlan();
          plan.type = "index_scan";
          plan.indexes = [indexName];
          const docIds = index.search(textQuery);
          plan.indexScans = [{ indexName, docIds }];
          plan.estimatedCost = docIds.length;
          return plan;
        }
      }
    }
    return null;
  }
  /**
   * Extract $text query from query object
   * @private
   */
  _extractTextQuery(query) {
    for (const field in query) {
      const value = query[field];
      if (typeof value === "object" && value !== null && value.$text) {
        return typeof value.$text === "string" ? value.$text : value.$text.$search;
      }
    }
    return null;
  }
  /**
   * Plan for geospatial queries
   * @private
   */
  _planGeoQuery(query, analysis) {
    for (const indexName in this.indexes) {
      const index = this.indexes[indexName];
      if (index instanceof GeospatialCollectionIndex) {
        const docIds = index.query(query);
        if (docIds !== null) {
          const plan = new QueryPlan();
          plan.type = "index_scan";
          plan.indexes = [indexName];
          plan.indexScans = [{ indexName, docIds }];
          plan.estimatedCost = docIds.length;
          return plan;
        }
      }
    }
    return null;
  }
  /**
   * Plan for $and queries (index intersection)
   * @private
   */
  _planAndQuery(query, analysis) {
    const plan = new QueryPlan();
    let conditions;
    if (query.$and) {
      conditions = query.$and;
    } else {
      conditions = Object.keys(query).map((field) => ({ [field]: query[field] }));
    }
    const indexableConditions = [];
    for (const condition of conditions) {
      const conditionPlan = this._planSimpleQuery(condition);
      if (conditionPlan.type === "index_scan") {
        indexableConditions.push(conditionPlan.indexScans[0]);
      }
    }
    if (indexableConditions.length > 1) {
      plan.type = "index_intersection";
      plan.indexScans = indexableConditions;
      plan.indexes = indexableConditions.map((scan) => scan.indexName);
      plan.estimatedCost = Math.min(...indexableConditions.map((scan) => scan.docIds.length));
      return plan;
    }
    if (indexableConditions.length === 1) {
      plan.type = "index_scan";
      plan.indexScans = [indexableConditions[0]];
      plan.indexes = [indexableConditions[0].indexName];
      plan.estimatedCost = indexableConditions[0].docIds.length;
      return plan;
    }
    return plan;
  }
  /**
   * Plan for $or queries (index union)
   * @private
   */
  _planOrQuery(query, analysis) {
    const plan = new QueryPlan();
    if (!query.$or) {
      return plan;
    }
    const conditions = query.$or;
    const indexableConditions = [];
    for (const condition of conditions) {
      const conditionPlan = this._planSimpleQuery(condition);
      if (conditionPlan.type === "index_scan") {
        indexableConditions.push(conditionPlan.indexScans[0]);
      }
    }
    if (indexableConditions.length > 0) {
      plan.type = "index_union";
      plan.indexScans = indexableConditions;
      plan.indexes = indexableConditions.map((scan) => scan.indexName);
      plan.estimatedCost = indexableConditions.reduce((sum, scan) => sum + scan.docIds.length, 0);
      return plan;
    }
    return plan;
  }
  /**
   * Plan for simple single-field queries
   * @private
   */
  _planSimpleQuery(query) {
    const plan = new QueryPlan();
    const queryKeys = Object.keys(query);
    if (queryKeys.length === 0) {
      return plan;
    }
    for (const indexName in this.indexes) {
      const index = this.indexes[indexName];
      if (index instanceof TextCollectionIndex || index instanceof GeospatialCollectionIndex) {
        continue;
      }
      const docIds = index.query(query);
      if (docIds !== null && docIds.length >= 0) {
        plan.type = "index_scan";
        plan.indexes = [indexName];
        plan.indexScans = [{ indexName, docIds }];
        plan.estimatedCost = docIds.length;
        return plan;
      }
    }
    return plan;
  }
  /**
   * Execute a query plan and return document IDs
   * @param {QueryPlan} plan - The execution plan
   * @returns {Array|null} Array of document IDs or null for full scan
   */
  execute(plan) {
    if (plan.type === "full_scan") {
      return null;
    }
    if (plan.type === "index_scan") {
      return plan.indexScans[0].docIds;
    }
    if (plan.type === "index_intersection") {
      if (plan.indexScans.length === 0) return null;
      const sorted = plan.indexScans.slice().sort((a, b) => a.docIds.length - b.docIds.length);
      let result = new Set(sorted[0].docIds);
      for (let i = 1; i < sorted.length; i++) {
        const currentSet = new Set(sorted[i].docIds);
        result = new Set([...result].filter((id) => currentSet.has(id)));
        if (result.size === 0) break;
      }
      return Array.from(result);
    }
    if (plan.type === "index_union") {
      const result = /* @__PURE__ */ new Set();
      for (const scan of plan.indexScans) {
        scan.docIds.forEach((id) => result.add(id));
      }
      return Array.from(result);
    }
    return null;
  }
}
class Collection {
  constructor(db, storage, idGenerator) {
    this.db = db;
    this.storage = storage;
    this.idGenerator = idGenerator;
    this.indexes = {};
    this.queryPlanner = new QueryPlanner(this.indexes);
    this.isCollection = true;
  }
  /**
   * Generate index name from keys
   */
  generateIndexName(keys) {
    const parts = [];
    for (const field in keys) {
      if (keys.hasOwnProperty(field)) {
        parts.push(field + "_" + keys[field]);
      }
    }
    return parts.join("_");
  }
  /**
   * Determine if keys specify a text index
   */
  isTextIndex(keys) {
    for (const field in keys) {
      if (keys[field] === "text") {
        return true;
      }
    }
    return false;
  }
  /**
   * Determine if keys specify a geospatial index
   */
  isGeospatialIndex(keys) {
    for (const field in keys) {
      if (keys[field] === "2dsphere" || keys[field] === "2d") {
        return true;
      }
    }
    return false;
  }
  /**
   * Build/rebuild an index
   */
  buildIndex(indexName, keys, options = {}) {
    let index;
    if (this.isTextIndex(keys)) {
      index = new TextCollectionIndex(keys, { ...options, name: indexName });
    } else if (this.isGeospatialIndex(keys)) {
      index = new GeospatialCollectionIndex(keys, { ...options, name: indexName });
    } else {
      index = new RegularCollectionIndex(keys, { ...options, name: indexName });
    }
    for (let i = 0; i < this.storage.size(); i++) {
      const doc = this.storage.get(i);
      if (doc) {
        index.add(doc);
      }
    }
    this.indexes[indexName] = index;
    return index;
  }
  /**
   * Update indexes when a document is inserted
   */
  updateIndexesOnInsert(doc) {
    for (const indexName in this.indexes) {
      if (this.indexes.hasOwnProperty(indexName)) {
        const index = this.indexes[indexName];
        index.add(doc);
      }
    }
  }
  /**
   * Update indexes when a document is deleted
   */
  updateIndexesOnDelete(doc) {
    for (const indexName in this.indexes) {
      if (this.indexes.hasOwnProperty(indexName)) {
        const index = this.indexes[indexName];
        index.remove(doc);
      }
    }
  }
  /**
   * Query planner - analyze query and determine optimal execution plan
   */
  planQuery(query) {
    const plan = this.queryPlanner.plan(query);
    const docIds = this.queryPlanner.execute(plan);
    return {
      useIndex: plan.type !== "full_scan",
      planType: plan.type,
      indexNames: plan.indexes,
      docIds,
      estimatedCost: plan.estimatedCost
    };
  }
  /**
   * Get a text index for the given field
   * @param {string} field - The field name
   * @returns {TextCollectionIndex|null} The text index or null if not found
   */
  getTextIndex(field) {
    for (const indexName in this.indexes) {
      if (this.indexes.hasOwnProperty(indexName)) {
        const index = this.indexes[indexName];
        if (index instanceof TextCollectionIndex) {
          if (index.indexedFields.includes(field)) {
            return index;
          }
        }
      }
    }
    return null;
  }
  // Collection methods
  aggregate(pipeline) {
    if (!pipeline || !isArray(pipeline)) {
      throw { $err: "Pipeline must be an array", code: 17287 };
    }
    let results = [];
    const cursor = this.find({});
    while (cursor.hasNext()) {
      results.push(cursor.next());
    }
    for (let i = 0; i < pipeline.length; i++) {
      const stage = pipeline[i];
      const stageKeys = Object.keys(stage);
      if (stageKeys.length !== 1) {
        throw { $err: "Each pipeline stage must have exactly one key", code: 17287 };
      }
      const stageType = stageKeys[0];
      const stageSpec = stage[stageType];
      if (stageType === "$match") {
        const matched = [];
        for (let j = 0; j < results.length; j++) {
          if (matches(results[j], stageSpec)) {
            matched.push(results[j]);
          }
        }
        results = matched;
      } else if (stageType === "$project") {
        const projected = [];
        for (let j = 0; j < results.length; j++) {
          projected.push(applyProjection(stageSpec, results[j]));
        }
        results = projected;
      } else if (stageType === "$sort") {
        const sortKeys = Object.keys(stageSpec);
        results.sort(function(a, b) {
          for (let k = 0; k < sortKeys.length; k++) {
            const key = sortKeys[k];
            if (a[key] === void 0 && b[key] !== void 0) return -1 * stageSpec[key];
            if (a[key] !== void 0 && b[key] === void 0) return 1 * stageSpec[key];
            if (a[key] < b[key]) return -1 * stageSpec[key];
            if (a[key] > b[key]) return 1 * stageSpec[key];
          }
          return 0;
        });
      } else if (stageType === "$limit") {
        results = results.slice(0, stageSpec);
      } else if (stageType === "$skip") {
        results = results.slice(stageSpec);
      } else if (stageType === "$group") {
        const groups = {};
        const groupId = stageSpec._id;
        for (let j = 0; j < results.length; j++) {
          const doc = results[j];
          let key;
          if (groupId === null || groupId === void 0) {
            key = null;
          } else if (typeof groupId === "string" && groupId.charAt(0) === "$") {
            key = getProp(doc, groupId.substring(1));
          } else if (typeof groupId === "object") {
            key = JSON.stringify(groupId);
          } else {
            key = groupId;
          }
          const keyStr = JSON.stringify(key);
          if (!groups[keyStr]) {
            groups[keyStr] = {
              _id: key,
              docs: [],
              accumulators: {}
            };
          }
          groups[keyStr].docs.push(doc);
        }
        const grouped = [];
        for (const groupKey in groups) {
          const group = groups[groupKey];
          const result = { _id: group._id };
          for (const field in stageSpec) {
            if (field === "_id") continue;
            const accumulator = stageSpec[field];
            const accKeys = Object.keys(accumulator);
            if (accKeys.length !== 1) continue;
            const accType = accKeys[0];
            const accExpr = accumulator[accType];
            if (accType === "$sum") {
              let sum = 0;
              for (let k = 0; k < group.docs.length; k++) {
                if (typeof accExpr === "number") {
                  sum += accExpr;
                } else if (typeof accExpr === "string" && accExpr.charAt(0) === "$") {
                  const val = getProp(group.docs[k], accExpr.substring(1));
                  sum += val || 0;
                }
              }
              result[field] = sum;
            } else if (accType === "$avg") {
              let sum = 0;
              let count = 0;
              for (let k = 0; k < group.docs.length; k++) {
                if (typeof accExpr === "string" && accExpr.charAt(0) === "$") {
                  const val = getProp(group.docs[k], accExpr.substring(1));
                  if (val !== void 0 && val !== null) {
                    sum += val;
                    count++;
                  }
                }
              }
              result[field] = count > 0 ? sum / count : 0;
            } else if (accType === "$min") {
              let min = void 0;
              for (let k = 0; k < group.docs.length; k++) {
                if (typeof accExpr === "string" && accExpr.charAt(0) === "$") {
                  const val = getProp(group.docs[k], accExpr.substring(1));
                  if (val !== void 0 && (min === void 0 || val < min)) {
                    min = val;
                  }
                }
              }
              result[field] = min;
            } else if (accType === "$max") {
              let max = void 0;
              for (let k = 0; k < group.docs.length; k++) {
                if (typeof accExpr === "string" && accExpr.charAt(0) === "$") {
                  const val = getProp(group.docs[k], accExpr.substring(1));
                  if (val !== void 0 && (max === void 0 || val > max)) {
                    max = val;
                  }
                }
              }
              result[field] = max;
            } else if (accType === "$push") {
              const arr = [];
              for (let k = 0; k < group.docs.length; k++) {
                if (typeof accExpr === "string" && accExpr.charAt(0) === "$") {
                  const val = getProp(group.docs[k], accExpr.substring(1));
                  arr.push(val);
                }
              }
              result[field] = arr;
            } else if (accType === "$addToSet") {
              const set = {};
              for (let k = 0; k < group.docs.length; k++) {
                if (typeof accExpr === "string" && accExpr.charAt(0) === "$") {
                  const val = getProp(group.docs[k], accExpr.substring(1));
                  set[JSON.stringify(val)] = val;
                }
              }
              const arr = [];
              for (const valKey in set) {
                arr.push(set[valKey]);
              }
              result[field] = arr;
            } else if (accType === "$first") {
              if (group.docs.length > 0) {
                if (typeof accExpr === "string" && accExpr.charAt(0) === "$") {
                  result[field] = getProp(group.docs[0], accExpr.substring(1));
                }
              }
            } else if (accType === "$last") {
              if (group.docs.length > 0) {
                if (typeof accExpr === "string" && accExpr.charAt(0) === "$") {
                  result[field] = getProp(group.docs[group.docs.length - 1], accExpr.substring(1));
                }
              }
            }
          }
          grouped.push(result);
        }
        results = grouped;
      } else if (stageType === "$count") {
        results = [{ [stageSpec]: results.length }];
      } else if (stageType === "$unwind") {
        const unwound = [];
        let fieldPath = stageSpec;
        if (typeof fieldPath === "string" && fieldPath.charAt(0) === "$") {
          fieldPath = fieldPath.substring(1);
        }
        for (let j = 0; j < results.length; j++) {
          const doc = results[j];
          const arr = getProp(doc, fieldPath);
          if (arr && isArray(arr) && arr.length > 0) {
            for (let k = 0; k < arr.length; k++) {
              const unwoundDoc = copy(doc);
              const parts = fieldPath.split(".");
              let target = unwoundDoc;
              for (let l = 0; l < parts.length - 1; l++) {
                if (!target[parts[l]]) {
                  target[parts[l]] = {};
                }
                target = target[parts[l]];
              }
              target[parts[parts.length - 1]] = arr[k];
              unwound.push(unwoundDoc);
            }
          }
        }
        results = unwound;
      } else {
        throw { $err: "Unsupported aggregation stage: " + stageType, code: 17287 };
      }
    }
    return results;
  }
  bulkWrite() {
    throw "Not Implemented";
  }
  async count() {
    return this.storage.size();
  }
  async copyTo(destCollectionName) {
    if (!this.db[destCollectionName]) {
      this.db.createCollection(destCollectionName);
    }
    const destCol = this.db[destCollectionName];
    let numCopied = 0;
    const c = this.find({});
    while (c.hasNext()) {
      await destCol.insertOne(c.next());
      numCopied++;
    }
    return numCopied;
  }
  async createIndex(keys, options) {
    if (!keys || typeof keys !== "object" || Array.isArray(keys)) {
      throw { $err: "createIndex requires a key specification object", code: 2 };
    }
    const indexName = options && options.name ? options.name : this.generateIndexName(keys);
    if (this.indexes[indexName]) {
      const existingIndex = this.indexes[indexName];
      const existingKeys = JSON.stringify(existingIndex.keys);
      const newKeys = JSON.stringify(keys);
      if (existingKeys !== newKeys) {
        throw { $err: "Index with name '" + indexName + "' already exists with a different key specification", code: 85 };
      }
      return indexName;
    }
    this.buildIndex(indexName, keys, options);
    return indexName;
  }
  dataSize() {
    throw "Not Implemented";
  }
  async deleteOne(query) {
    const doc = await this.findOne(query);
    if (doc) {
      this.updateIndexesOnDelete(doc);
      this.storage.remove(doc._id);
      return { deletedCount: 1 };
    } else {
      return { deletedCount: 0 };
    }
  }
  async deleteMany(query) {
    const c = this.find(query);
    const ids = [];
    const docs = [];
    while (c.hasNext()) {
      const doc = c.next();
      ids.push(doc._id);
      docs.push(doc);
    }
    const deletedCount = ids.length;
    for (let i = 0; i < ids.length; i++) {
      this.updateIndexesOnDelete(docs[i]);
      this.storage.remove(ids[i]);
    }
    return { deletedCount };
  }
  async distinct(field, query) {
    const vals = {};
    const c = this.find(query);
    while (c.hasNext()) {
      const d = c.next();
      if (d[field]) {
        vals[d[field]] = true;
      }
    }
    return Object.keys(vals);
  }
  drop() {
    this.storage.clear();
    for (const indexName in this.indexes) {
      if (this.indexes.hasOwnProperty(indexName)) {
        this.indexes[indexName].clear();
      }
    }
  }
  dropIndex(indexName) {
    if (!this.indexes[indexName]) {
      throw { $err: "Index not found with name: " + indexName, code: 27 };
    }
    this.indexes[indexName].clear();
    delete this.indexes[indexName];
    return { nIndexesWas: Object.keys(this.indexes).length + 1, ok: 1 };
  }
  dropIndexes() {
    const count = Object.keys(this.indexes).length;
    for (const indexName in this.indexes) {
      if (this.indexes.hasOwnProperty(indexName)) {
        this.indexes[indexName].clear();
      }
    }
    this.indexes = {};
    return { nIndexesWas: count, msg: "non-_id indexes dropped", ok: 1 };
  }
  ensureIndex() {
    throw "Not Implemented";
  }
  explain() {
    throw "Not Implemented";
  }
  find(query, projection) {
    return new Cursor(
      this,
      query == void 0 ? {} : query,
      projection,
      matches,
      this.storage,
      this.indexes,
      this.planQuery.bind(this),
      SortedCursor
    );
  }
  findAndModify() {
    throw "Not Implemented";
  }
  async findOne(query, projection) {
    const cursor = this.find(query, projection);
    if (cursor.hasNext()) {
      return cursor.next();
    } else {
      return null;
    }
  }
  async findOneAndDelete(filter, options) {
    let c = this.find(filter);
    if (options && options.sort) c = c.sort(options.sort);
    if (!c.hasNext()) return null;
    const doc = c.next();
    this.storage.remove(doc._id);
    if (options && options.projection) return applyProjection(options.projection, doc);
    else return doc;
  }
  async findOneAndReplace(filter, replacement, options) {
    let c = this.find(filter);
    if (options && options.sort) c = c.sort(options.sort);
    if (!c.hasNext()) return null;
    const doc = c.next();
    replacement._id = doc._id;
    this.storage.set(doc._id, replacement);
    if (options && options.returnNewDocument) {
      if (options && options.projection) return applyProjection(options.projection, replacement);
      else return replacement;
    } else {
      if (options && options.projection) return applyProjection(options.projection, doc);
      else return doc;
    }
  }
  async findOneAndUpdate(filter, update, options) {
    let c = this.find(filter);
    if (options && options.sort) c = c.sort(options.sort);
    if (!c.hasNext()) return null;
    const doc = c.next();
    const clone = Object.assign({}, doc);
    applyUpdates(update, clone);
    this.storage.set(doc._id, clone);
    if (options && options.returnNewDocument) {
      if (options && options.projection) return applyProjection(options.projection, clone);
      else return clone;
    } else {
      if (options && options.projection) return applyProjection(options.projection, doc);
      else return doc;
    }
  }
  getIndexes() {
    const result = [];
    for (const indexName in this.indexes) {
      if (this.indexes.hasOwnProperty(indexName)) {
        result.push(this.indexes[indexName].getSpec());
      }
    }
    return result;
  }
  getShardDistribution() {
    throw "Not Implemented";
  }
  getShardVersion() {
    throw "Not Implemented";
  }
  // non-mongo
  getStore() {
    return this.storage.getStore();
  }
  group() {
    throw "Not Implemented";
  }
  async insert(doc) {
    if (Array == doc.constructor) {
      return await this.insertMany(doc);
    } else {
      return await this.insertOne(doc);
    }
  }
  async insertOne(doc) {
    if (doc._id == void 0) doc._id = this.idGenerator();
    this.storage.set(doc._id, doc);
    this.updateIndexesOnInsert(doc);
    return { insertedId: doc._id };
  }
  async insertMany(docs) {
    const insertedIds = [];
    for (let i = 0; i < docs.length; i++) {
      const result = await this.insertOne(docs[i]);
      insertedIds.push(result.insertedId);
    }
    return { insertedIds };
  }
  isCapped() {
    throw "Not Implemented";
  }
  mapReduce() {
    throw "Not Implemented";
  }
  reIndex() {
    throw "Not Implemented";
  }
  async replaceOne(query, replacement, options) {
    const result = {};
    const c = this.find(query);
    result.matchedCount = c.count();
    if (result.matchedCount == 0) {
      result.modifiedCount = 0;
      if (options && options.upsert) {
        const newDoc = replacement;
        newDoc._id = this.idGenerator();
        this.storage.set(newDoc._id, newDoc);
        result.upsertedId = newDoc._id;
      }
    } else {
      result.modifiedCount = 1;
      const doc = c.next();
      this.updateIndexesOnDelete(doc);
      replacement._id = doc._id;
      this.storage.set(doc._id, replacement);
      this.updateIndexesOnInsert(replacement);
    }
    return result;
  }
  remove(query, options) {
    const c = this.find(query);
    if (!c.hasNext()) return;
    if (options === true || options && options.justOne) {
      const doc = c.next();
      this.updateIndexesOnDelete(doc);
      this.storage.remove(doc._id);
    } else {
      while (c.hasNext()) {
        const doc = c.next();
        this.updateIndexesOnDelete(doc);
        this.storage.remove(doc._id);
      }
    }
  }
  renameCollection() {
    throw "Not Implemented";
  }
  save() {
    throw "Not Implemented";
  }
  stats() {
    throw "Not Implemented";
  }
  storageSize() {
    throw "Not Implemented";
  }
  totalSize() {
    throw "Not Implemented";
  }
  totalIndexSize() {
    throw "Not Implemented";
  }
  update(query, updates, options) {
    const c = this.find(query);
    if (c.hasNext()) {
      if (options && options.multi) {
        while (c.hasNext()) {
          const doc = c.next();
          this.updateIndexesOnDelete(doc);
          applyUpdates(updates, doc);
          this.storage.set(doc._id, doc);
          this.updateIndexesOnInsert(doc);
        }
      } else {
        const doc = c.next();
        this.updateIndexesOnDelete(doc);
        applyUpdates(updates, doc);
        this.storage.set(doc._id, doc);
        this.updateIndexesOnInsert(doc);
      }
    } else {
      if (options && options.upsert) {
        const newDoc = createDocFromUpdate(query, updates, this.idGenerator);
        this.storage.set(newDoc._id, newDoc);
        this.updateIndexesOnInsert(newDoc);
      }
    }
  }
  async updateOne(query, updates, options) {
    const c = this.find(query);
    if (c.hasNext()) {
      const doc = c.next();
      this.updateIndexesOnDelete(doc);
      applyUpdates(updates, doc);
      this.storage.set(doc._id, doc);
      this.updateIndexesOnInsert(doc);
    } else {
      if (options && options.upsert) {
        const newDoc = createDocFromUpdate(query, updates, this.idGenerator);
        this.storage.set(newDoc._id, newDoc);
        this.updateIndexesOnInsert(newDoc);
      }
    }
  }
  async updateMany(query, updates, options) {
    const c = this.find(query);
    if (c.hasNext()) {
      while (c.hasNext()) {
        const doc = c.next();
        this.updateIndexesOnDelete(doc);
        applyUpdates(updates, doc);
        this.storage.set(doc._id, doc);
        this.updateIndexesOnInsert(doc);
      }
    } else {
      if (options && options.upsert) {
        const newDoc = createDocFromUpdate(query, updates, this.idGenerator);
        this.storage.set(newDoc._id, newDoc);
        this.updateIndexesOnInsert(newDoc);
      }
    }
  }
  validate() {
    throw "Not Implemented";
  }
  /**
   * Export collection state for storage
   * @returns {Object} Collection state including documents and indexes
   */
  exportState() {
    const documents = [];
    for (let i = 0; i < this.storage.size(); i++) {
      const doc = this.storage.get(i);
      if (doc) {
        documents.push(doc);
      }
    }
    const indexes = [];
    for (const indexName in this.indexes) {
      if (this.indexes.hasOwnProperty(indexName)) {
        const index = this.indexes[indexName];
        indexes.push(index.serialize());
      }
    }
    return {
      documents,
      indexes
    };
  }
  /**
   * Import collection state from storage
   * @param {Object} state - Collection state including documents and indexes
   */
  async importState(state) {
    this.storage.clear();
    for (const indexName in this.indexes) {
      if (this.indexes.hasOwnProperty(indexName)) {
        this.indexes[indexName].clear();
      }
    }
    this.indexes = {};
    if (state.documents && Array.isArray(state.documents)) {
      for (const doc of state.documents) {
        this.storage.set(doc._id, doc);
      }
    }
    if (state.indexes && Array.isArray(state.indexes)) {
      for (const indexState of state.indexes) {
        let index;
        if (indexState.type === "text") {
          index = new TextCollectionIndex(indexState.keys, indexState.options);
          index.deserialize(indexState);
        } else if (indexState.type === "geospatial") {
          index = new GeospatialCollectionIndex(indexState.keys, indexState.options);
          index.deserialize(indexState);
        } else {
          index = new RegularCollectionIndex(indexState.keys, indexState.options);
          index.deserialize(indexState);
        }
        this.indexes[index.name] = index;
      }
    }
  }
}
class StorageEngine {
  constructor() {
    if (new.target === StorageEngine) {
      throw new TypeError("Cannot construct StorageEngine instances directly");
    }
  }
  /**
   * Initialize the storage engine
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error("initialize() must be implemented by subclass");
  }
  /**
   * Save the entire database state
   * @param {Object} dbState - The database state to save
   * @param {string} dbState.name - The database name
   * @param {Object} dbState.collections - Map of collection names to collection data
   * @returns {Promise<void>}
   */
  async saveDatabase(dbState) {
    throw new Error("saveDatabase() must be implemented by subclass");
  }
  /**
   * Load the entire database state
   * @param {string} dbName - The database name
   * @returns {Promise<Object|null>} The database state or null if not found
   */
  async loadDatabase(dbName) {
    throw new Error("loadDatabase() must be implemented by subclass");
  }
  /**
   * Save a single collection's state
   * @param {string} dbName - The database name
   * @param {string} collectionName - The collection name
   * @param {Object} collectionState - The collection state to save
   * @param {Array} collectionState.documents - The documents in the collection
   * @param {Array} collectionState.indexes - The indexes in the collection
   * @returns {Promise<void>}
   */
  async saveCollection(dbName, collectionName, collectionState) {
    throw new Error("saveCollection() must be implemented by subclass");
  }
  /**
   * Load a single collection's state
   * @param {string} dbName - The database name
   * @param {string} collectionName - The collection name
   * @returns {Promise<Object|null>} The collection state or null if not found
   */
  async loadCollection(dbName, collectionName) {
    throw new Error("loadCollection() must be implemented by subclass");
  }
  /**
   * Delete a collection
   * @param {string} dbName - The database name
   * @param {string} collectionName - The collection name
   * @returns {Promise<void>}
   */
  async deleteCollection(dbName, collectionName) {
    throw new Error("deleteCollection() must be implemented by subclass");
  }
  /**
   * Delete the entire database
   * @param {string} dbName - The database name
   * @returns {Promise<void>}
   */
  async deleteDatabase(dbName) {
    throw new Error("deleteDatabase() must be implemented by subclass");
  }
  /**
   * Close/cleanup the storage engine
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error("close() must be implemented by subclass");
  }
}
class ObjectStorageEngine extends StorageEngine {
  constructor() {
    super();
    this.databases = {};
  }
  /**
   * Initialize the storage engine
   * @returns {Promise<void>}
   */
  async initialize() {
  }
  /**
   * Save the entire database state
   * @param {Object} dbState - The database state to save
   * @returns {Promise<void>}
   */
  async saveDatabase(dbState) {
    this.databases[dbState.name] = JSON.parse(JSON.stringify(dbState));
  }
  /**
   * Load the entire database state
   * @param {string} dbName - The database name
   * @returns {Promise<Object|null>} The database state or null if not found
   */
  async loadDatabase(dbName) {
    if (this.databases[dbName]) {
      return JSON.parse(JSON.stringify(this.databases[dbName]));
    }
    return null;
  }
  /**
   * Save a single collection's state
   * @param {string} dbName - The database name
   * @param {string} collectionName - The collection name
   * @param {Object} collectionState - The collection state to save
   * @returns {Promise<void>}
   */
  async saveCollection(dbName, collectionName, collectionState) {
    if (!this.databases[dbName]) {
      this.databases[dbName] = {
        name: dbName,
        collections: {}
      };
    }
    this.databases[dbName].collections[collectionName] = JSON.parse(JSON.stringify(collectionState));
  }
  /**
   * Load a single collection's state
   * @param {string} dbName - The database name
   * @param {string} collectionName - The collection name
   * @returns {Promise<Object|null>} The collection state or null if not found
   */
  async loadCollection(dbName, collectionName) {
    if (this.databases[dbName] && this.databases[dbName].collections[collectionName]) {
      return JSON.parse(JSON.stringify(this.databases[dbName].collections[collectionName]));
    }
    return null;
  }
  /**
   * Delete a collection
   * @param {string} dbName - The database name
   * @param {string} collectionName - The collection name
   * @returns {Promise<void>}
   */
  async deleteCollection(dbName, collectionName) {
    if (this.databases[dbName] && this.databases[dbName].collections) {
      delete this.databases[dbName].collections[collectionName];
    }
  }
  /**
   * Delete the entire database
   * @param {string} dbName - The database name
   * @returns {Promise<void>}
   */
  async deleteDatabase(dbName) {
    delete this.databases[dbName];
  }
  /**
   * Close/cleanup the storage engine
   * @returns {Promise<void>}
   */
  async close() {
  }
}
class DB {
  constructor(options) {
    this.options = options || {};
    this.dbName = this.options.dbName || "default";
    this.storageEngine = this.options.storageEngine || null;
    if (typeof localStorage !== "undefined") {
      this.localStorage = new Collection(
        this,
        this.options.localStorage ? this.options.localStorage : LocalStorageStore,
        this._id.bind(this)
      );
    } else {
      this.localStorage = null;
    }
    return new Proxy(this, {
      get(target, property, receiver) {
        if (property in target) {
          return Reflect.get(target, property, receiver);
        }
        if (typeof property === "symbol" || property.startsWith("_")) {
          return void 0;
        }
        if (typeof property === "string" && property !== "localStorage") {
          if (Object.prototype.hasOwnProperty.call(target, property)) {
            return target[property];
          }
          target.createCollection(property);
          return target[property];
        }
        return void 0;
      }
    });
  }
  /**
   * Log function
   */
  _log(msg) {
    if (this.options && this.options.print) this.options.print(msg);
    else console.log(msg);
  }
  /**
   * ID generator function
   */
  _id() {
    if (this.options && this.options.id) return this.options.id();
    else return new ObjectId();
  }
  // DB Methods
  cloneCollection() {
    throw "Not Implemented";
  }
  cloneDatabase() {
    throw "Not Implemented";
  }
  commandHelp() {
    throw "Not Implemented";
  }
  copyDatabase() {
    throw "Not Implemented";
  }
  createCollection(name) {
    if (!name) return;
    if (name == "localStorage") {
      this.localStorage = new Collection(
        this,
        this.options.localStorage ? this.options.localStorage : LocalStorageStore,
        this._id.bind(this)
      );
    } else {
      this[name] = new Collection(
        this,
        this.options && this.options.storage ? new this.options.storage() : new ObjectStore(),
        this._id.bind(this)
      );
    }
  }
  currentOp() {
    throw "Not Implemented";
  }
  dropDatabase() {
    for (const key in this) {
      if (this[key] != null && this[key].isCollection) {
        this[key].drop();
        delete this[key];
      }
    }
  }
  eval() {
    throw "Not Implemented";
  }
  fsyncLock() {
    throw "Not Implemented";
  }
  fsyncUnlock() {
    throw "Not Implemented";
  }
  getCollection() {
    throw "Not Implemented";
  }
  getCollectionInfos() {
    throw "Not Implemented";
  }
  getCollectionNames() {
    const names = [];
    for (const key in this) {
      if (this[key] != null && this[key].isCollection) {
        names.push(key);
      }
    }
    return names;
  }
  getLastError() {
    throw "Not Implemented";
  }
  getLastErrorObj() {
    throw "Not Implemented";
  }
  getLogComponents() {
    throw "Not Implemented";
  }
  getMongo() {
    throw "Not Implemented";
  }
  getName() {
    throw "Not Implemented";
  }
  getPrevError() {
    throw "Not Implemented";
  }
  getProfilingLevel() {
    throw "Not Implemented";
  }
  getProfilingStatus() {
    throw "Not Implemented";
  }
  getReplicationInfo() {
    throw "Not Implemented";
  }
  getSiblingDB() {
    throw "Not Implemented";
  }
  help() {
    this._log("        help mr                      mapreduce");
    this._log("        db.foo.find()                list objects in collection foo");
    this._log("        db.foo.find( { a : 1 } )     list objects in foo where a == 1");
    this._log("        it                           result of the last line evaluated; use to further iterate");
  }
  hostInfo() {
    throw "Not Implemented";
  }
  isMaster() {
    throw "Not Implemented";
  }
  killOp() {
    throw "Not Implemented";
  }
  listCommands() {
    throw "Not Implemented";
  }
  loadServerScripts() {
    throw "Not Implemented";
  }
  logout() {
    throw "Not Implemented";
  }
  printCollectionStats() {
    throw "Not Implemented";
  }
  printReplicationInfo() {
    throw "Not Implemented";
  }
  printShardingStatus() {
    throw "Not Implemented";
  }
  printSlaveReplicationInfo() {
    throw "Not Implemented";
  }
  repairDatabase() {
    throw "Not Implemented";
  }
  resetError() {
    throw "Not Implemented";
  }
  runCommand() {
    throw "Not Implemented";
  }
  serverBuildInfo() {
    throw "Not Implemented";
  }
  serverCmdLineOpts() {
    throw "Not Implemented";
  }
  serverStatus() {
    throw "Not Implemented";
  }
  setLogLevel() {
    throw "Not Implemented";
  }
  setProfilingLevel() {
    throw "Not Implemented";
  }
  shutdownServer() {
    throw "Not Implemented";
  }
  stats() {
    throw "Not Implemented";
  }
  version() {
    throw "Not Implemented";
  }
  upgradeCheck() {
    throw "Not Implemented";
  }
  upgradeCheckAllDBs() {
    throw "Not Implemented";
  }
  /**
   * Save database state to storage engine
   * @returns {Promise<void>}
   */
  async saveToStorage() {
    if (!this.storageEngine) {
      throw new Error("No storage engine configured. Pass a storageEngine option when creating the DB.");
    }
    if (this.storageEngine.initialize) {
      await this.storageEngine.initialize();
    }
    const collections = {};
    for (const key in this) {
      if (this[key] != null && this[key].isCollection) {
        collections[key] = this[key].exportState();
      }
    }
    await this.storageEngine.saveDatabase({
      name: this.dbName,
      collections
    });
  }
  /**
   * Load database state from storage engine
   * @returns {Promise<void>}
   */
  async loadFromStorage() {
    if (!this.storageEngine) {
      throw new Error("No storage engine configured. Pass a storageEngine option when creating the DB.");
    }
    if (this.storageEngine.initialize) {
      await this.storageEngine.initialize();
    }
    const dbState = await this.storageEngine.loadDatabase(this.dbName);
    if (!dbState || !dbState.collections) {
      return;
    }
    this.dropDatabase();
    for (const collectionName in dbState.collections) {
      if (dbState.collections.hasOwnProperty(collectionName)) {
        this.createCollection(collectionName);
        await this[collectionName].importState(dbState.collections[collectionName]);
      }
    }
  }
  /**
   * Save a specific collection to storage engine
   * @param {string} collectionName - Name of the collection to save
   * @returns {Promise<void>}
   */
  async saveCollection(collectionName) {
    if (!this.storageEngine) {
      throw new Error("No storage engine configured. Pass a storageEngine option when creating the DB.");
    }
    if (!this[collectionName] || !this[collectionName].isCollection) {
      throw new Error(`Collection '${collectionName}' does not exist`);
    }
    if (this.storageEngine.initialize) {
      await this.storageEngine.initialize();
    }
    const collectionState = this[collectionName].exportState();
    await this.storageEngine.saveCollection(this.dbName, collectionName, collectionState);
  }
  /**
   * Load a specific collection from storage engine
   * @param {string} collectionName - Name of the collection to load
   * @returns {Promise<void>}
   */
  async loadCollection(collectionName) {
    if (!this.storageEngine) {
      throw new Error("No storage engine configured. Pass a storageEngine option when creating the DB.");
    }
    if (this.storageEngine.initialize) {
      await this.storageEngine.initialize();
    }
    const collectionState = await this.storageEngine.loadCollection(this.dbName, collectionName);
    if (!collectionState) {
      return;
    }
    if (!this[collectionName]) {
      this.createCollection(collectionName);
    }
    await this[collectionName].importState(collectionState);
  }
}
class MongoClient {
  constructor(uri, options = {}) {
    this.uri = uri;
    this.options = options;
  }
  static async connect(uri, options = {}) {
    return new MongoClient(uri, options);
  }
  db(name, opts = {}) {
    const dbOptions = { ...this.options, ...opts, dbName: name };
    return new DB(dbOptions);
  }
  async close() {
  }
}
class IndexedDbStorageEngine extends StorageEngine {
  constructor(dbName = "micro-mongo") {
    super();
    this.dbName = dbName;
    this.db = null;
    this.indexedDBName = `micro-mongo-${dbName}`;
  }
  /**
   * Initialize the IndexedDB connection
   * @returns {Promise<void>}
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.indexedDBName, 1);
      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB: " + request.error));
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("collections")) {
          db.createObjectStore("collections", { keyPath: "name" });
        }
        if (!db.objectStoreNames.contains("metadata")) {
          db.createObjectStore("metadata", { keyPath: "key" });
        }
      };
    });
  }
  /**
   * Save the entire database state
   * @param {Object} dbState - The database state to save
   * @returns {Promise<void>}
   */
  async saveDatabase(dbState) {
    if (!this.db) {
      await this.initialize();
    }
    const transaction = this.db.transaction(["metadata"], "readwrite");
    const metadataStore = transaction.objectStore("metadata");
    await new Promise((resolve, reject) => {
      const request = metadataStore.put({
        key: "dbName",
        value: dbState.name
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    for (const collectionName in dbState.collections) {
      if (dbState.collections.hasOwnProperty(collectionName)) {
        await this.saveCollection(dbState.name, collectionName, dbState.collections[collectionName]);
      }
    }
  }
  /**
   * Load the entire database state
   * @param {string} dbName - The database name
   * @returns {Promise<Object|null>} The database state or null if not found
   */
  async loadDatabase(dbName) {
    if (!this.db) {
      await this.initialize();
    }
    const transaction = this.db.transaction(["collections"], "readonly");
    const collectionsStore = transaction.objectStore("collections");
    return new Promise((resolve, reject) => {
      const request = collectionsStore.getAll();
      request.onsuccess = () => {
        const collections = {};
        for (const collectionData of request.result) {
          collections[collectionData.name] = {
            documents: collectionData.documents || [],
            indexes: collectionData.indexes || []
          };
        }
        resolve({
          name: dbName,
          collections
        });
      };
      request.onerror = () => reject(request.error);
    });
  }
  /**
   * Save a single collection's state
   * @param {string} dbName - The database name
   * @param {string} collectionName - The collection name
   * @param {Object} collectionState - The collection state to save
   * @returns {Promise<void>}
   */
  async saveCollection(dbName, collectionName, collectionState) {
    if (!this.db) {
      await this.initialize();
    }
    const transaction = this.db.transaction(["collections"], "readwrite");
    const collectionsStore = transaction.objectStore("collections");
    return new Promise((resolve, reject) => {
      const request = collectionsStore.put({
        name: collectionName,
        documents: collectionState.documents || [],
        indexes: collectionState.indexes || []
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  /**
   * Load a single collection's state
   * @param {string} dbName - The database name
   * @param {string} collectionName - The collection name
   * @returns {Promise<Object|null>} The collection state or null if not found
   */
  async loadCollection(dbName, collectionName) {
    if (!this.db) {
      await this.initialize();
    }
    const transaction = this.db.transaction(["collections"], "readonly");
    const collectionsStore = transaction.objectStore("collections");
    return new Promise((resolve, reject) => {
      const request = collectionsStore.get(collectionName);
      request.onsuccess = () => {
        if (request.result) {
          resolve({
            documents: request.result.documents || [],
            indexes: request.result.indexes || []
          });
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
  /**
   * Delete a collection
   * @param {string} dbName - The database name
   * @param {string} collectionName - The collection name
   * @returns {Promise<void>}
   */
  async deleteCollection(dbName, collectionName) {
    if (!this.db) {
      await this.initialize();
    }
    const transaction = this.db.transaction(["collections"], "readwrite");
    const collectionsStore = transaction.objectStore("collections");
    return new Promise((resolve, reject) => {
      const request = collectionsStore.delete(collectionName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  /**
   * Delete the entire database
   * @param {string} dbName - The database name
   * @returns {Promise<void>}
   */
  async deleteDatabase(dbName) {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.indexedDBName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  /**
   * Close/cleanup the storage engine
   * @returns {Promise<void>}
   */
  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
const LocalStorageStore = /* @__PURE__ */ (function() {
  return {
    clear: function() {
      localStorage.clear();
    },
    get: function(i) {
      return JSON.parse(localStorage.getItem(localStorage.key(i)));
    },
    getStore: function() {
      return localStorage;
    },
    remove: function(key) {
      localStorage.removeItem(key);
    },
    set: async function(key, val) {
      localStorage.setItem(key, JSON.stringify(val));
    },
    size: function() {
      return localStorage.length;
    }
  };
})();
const ObjectStore = function() {
  var objs = {};
  return {
    clear: function() {
      objs = {};
    },
    get: function(i) {
      return objs[Object.keys(objs)[i]];
    },
    getStore: function() {
      return objs;
    },
    remove: function(key) {
      delete objs[key];
    },
    set: function(key, val) {
      objs[key] = val;
    },
    size: function() {
      return Object.keys(objs).length;
    }
  };
};
export {
  IndexedDbStorageEngine,
  LocalStorageStore,
  MongoClient,
  ObjectId,
  ObjectStorageEngine,
  ObjectStore,
  StorageEngine
};
//# sourceMappingURL=micro-mongo-1.1.3.js.map
