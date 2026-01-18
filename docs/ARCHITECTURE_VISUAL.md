# Visual Architecture Guide

## Before (Current)

```
┌─────────────────────────────────────────────────────────────┐
│                           src/                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  MongoClient.js          ← Client Entry                     │
│  WorkerBridge.js         ← Client Code                      │
│  ProxyDB.js              ← Client Code                      │
│  ProxyCollection.js      ← Client Code                      │
│  ProxyCursor.js          ← Client Code                      │
│  ProxyChangeStream.js    ← Client Code                      │
│                                                              │
│  ServerWorker.js         ← Server Entry                     │
│  Server.js               ← Server Code                      │
│  Collection.js           ← Server Code                      │
│  DB.js                   ← Server Code                      │
│  Cursor.js               ← Server Code                      │
│  SortedCursor.js         ← Server Code                      │
│  ChangeStream.js         ← Server Code                      │
│  QueryPlanner.js         ← Server Code                      │
│  aggregationExpressions.js  ← Server Code                   │
│  queryMatcher.js         ← Server Code                      │
│  updates.js              ← Server Code                      │
│  Index.js                ← Server Code                      │
│  RegularCollectionIndex.js  ← Server Code                   │
│  TextCollectionIndex.js  ← Server Code                      │
│  GeospatialIndex.js      ← Server Code                      │
│  RTree.js                ← Server Code                      │
│                                                              │
│  errors.js               ← Shared                           │
│  utils.js                ← Shared                           │
│                                                              │
│  ❓ What runs where?                                        │
│  ❓ Are dependencies correct?                              │
│  ❓ Will server code get into main bundle?                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Issues:**
- 25 files with no visual grouping
- Mixed concerns everywhere
- Hard to tell which is which at a glance

---

## After (Proposed)

```
┌─────────────────────────────────────────────────────────────┐
│                           src/                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ client/                                               │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ ✓ MongoClient.js       (main thread entry)           │  │
│  │ ✓ WorkerBridge.js      (main↔worker communication)   │  │
│  │ ✓ ProxyDB.js           (proxy pattern)               │  │
│  │ ✓ ProxyCollection.js   (proxy pattern)               │  │
│  │ ✓ ProxyCursor.js       (proxy pattern)               │  │
│  │ ✓ ProxyChangeStream.js (proxy pattern)               │  │
│  │ ✓ index.js             (re-exports)                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ server/                                               │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ ✓ ServerWorker.js      (worker entry)                │  │
│  │ ✓ Server.js            (request dispatcher)          │  │
│  │ ✓ Collection.js        (core logic)                  │  │
│  │ ✓ DB.js                (core logic)                  │  │
│  │ ✓ Cursor.js            (core logic)                  │  │
│  │ ✓ SortedCursor.js      (core logic)                  │  │
│  │ ✓ ChangeStream.js      (core logic)                  │  │
│  │ ✓ QueryPlanner.js      (optimization)               │  │
│  │ ✓ aggregationExpressions.js                         │  │
│  │ ✓ queryMatcher.js                                   │  │
│  │ ✓ updates.js                                        │  │
│  │ ✓ index.js            (re-exports)                  │  │
│  │                                                       │  │
│  │ ┌───────────────────────────────────────────────┐   │  │
│  │ │ indexes/                                      │   │  │
│  │ ├───────────────────────────────────────────────┤   │  │
│  │ │ ✓ Index.js                                   │   │  │
│  │ │ ✓ RegularCollectionIndex.js                  │   │  │
│  │ │ ✓ TextCollectionIndex.js                     │   │  │
│  │ │ ✓ GeospatialIndex.js                         │   │  │
│  │ │ ✓ RTree.js                                   │   │  │
│  │ │ ✓ index.js                                   │   │  │
│  │ └───────────────────────────────────────────────┘   │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ shared/                                               │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ ✓ errors.js            (used by both)                │  │
│  │ ✓ utils.js             (used by both)                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  📍 Crystal clear where everything runs                    │
│  📍 Easy to spot dependencies                             │
│  📍 Can verify bundles are clean                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Benefits:**
- Each folder has clear purpose
- 3 visual zones = 3 concerns
- Easy to review what's where
- IDE can help enforce boundaries

---

## Bundle Flow Diagram

### Before (Implicit)

```
main.js
  └─ imports ProxyDB, MongoClient, WorkerBridge, ...
     └─ imports ProxyCollection, ProxyCursor, ...
        └─ imports errors.js
           └─ (exports 20+ error classes)
                └─ Vite tree-shakes (hopefully removes server code)
                   └─ ❓ Did it work?
```

### After (Explicit)

```
main.js
  └─ imports MongoClient from src/client/
     └─ imports src/client/ProxyDB.js
        └─ imports src/client/ProxyCollection.js
           └─ imports src/shared/errors.js
              └─ ✓ Nothing from src/server/ is imported
                 └─ ✓ Vite can statically verify tree-shaking
                    └─ ✓ We can run: strings build/micro-mongo-2.0.0.js | grep "class Server"
                       └─ ✓ Output: (empty = success!)
```

---

## Import Path Changes

### Before

```
src/ProxyDB.js                    import { ProxyCollection } from './ProxyCollection.js'
                                  import { ProxyChangeStream } from './ProxyChangeStream.js'
                                  import { ProxyCollection } from './errors.js'
```

### After

```
src/client/ProxyDB.js             import { ProxyCollection } from './ProxyCollection.js'  ← same
                                  import { ProxyChangeStream } from './ProxyChangeStream.js'  ← same
                                  import { MongoError } from '../errors.js'  ← goes up one level
```

**Pattern:**
- ✓ Same folder: `./` → `./` (no change)
- ✓ Shared (parent): `./` → `../` (one level up)
- ✓ Shared from indexes: `./` → `../../` (two levels up)

---

## Bundling Verification Paths

### Now (Hard to Verify)

```
$ npm run build
$ ls -lh build/
micro-mongo-2.0.0.js              ← Contains what exactly? 🤔
server-worker.js                  ← Contains what exactly? 🤔

$ strings build/micro-mongo-2.0.0.js | grep "class Collection"
(found or not found? unclear what's correct)
```

### After (Easy to Verify)

```
$ npm run build
$ ./scripts/bundling-verify.sh

✓ Main bundle contains ProxyDB
✓ Main bundle does NOT contain Collection
✓ Main bundle does NOT contain QueryPlanner
✓ Worker bundle contains Collection
✓ Worker bundle contains QueryPlanner
✓ Worker bundle does NOT contain ProxyDB

✅ All checks passed!
```

---

## Development Workflow

### Before

```
You:  "Where does the query logic live?"
Dev:  "Umm... looks for queryMatcher.js"
You:  "Is it server-side?"
Dev:  "Let me check... yes, it's imported by Server.js"
You:  "Should it be in the main bundle?"
Dev:  "No, let me verify: strings build/micro-mongo-2.0.0.js | grep queryMatcher"
Dev:  "Phew, it's not there"
```

### After

```
You:  "Where does the query logic live?"
Dev:  "src/server/queryMatcher.js - it's server-side"
You:  "Is it in the main bundle?"
Dev:  "No, it's in src/server/, so it only gets bundled in server-worker.js"
You:  "Can we verify?"
Dev:  "./scripts/bundling-verify.sh - instant verification"
```

---

## File Organization at a Glance

```
Development Time:                 Build Time:

src/client/                        → micro-mongo-2.0.0.js
├─ MongoClient.js                    ├─ ProxyDB
├─ WorkerBridge.js                   ├─ ProxyCollection
├─ ProxyDB.js                        ├─ ProxyCursor
├─ ProxyCollection.js                ├─ ProxyChangeStream
├─ ProxyCursor.js                    ├─ MongoClient
├─ ProxyChangeStream.js              ├─ WorkerBridge
└─ index.js                          └─ (errors.js functions)

                           +

src/server/                        → server-worker.js
├─ ServerWorker.js                   ├─ Server dispatcher
├─ Server.js                         ├─ Collection logic
├─ Collection.js                     ├─ DB logic
├─ DB.js                             ├─ Cursor logic
├─ Cursor.js                         ├─ QueryPlanner
├─ SortedCursor.js                   ├─ Aggregation
├─ ChangeStream.js                   ├─ Index classes
├─ QueryPlanner.js                   └─ (errors.js functions)
├─ aggregationExpressions.js
├─ queryMatcher.js
├─ updates.js
├─ indexes/
│  ├─ Index.js
│  ├─ RegularCollectionIndex.js
│  ├─ TextCollectionIndex.js
│  ├─ GeospatialIndex.js
│  ├─ RTree.js
│  └─ index.js
└─ index.js

                           +

src/shared/
├─ errors.js              → Included in both bundles
└─ utils.js
```

---

## Size Impact

```
BEFORE (mixed in one src/):
main bundle:   ~65 KB (includes some server code that shouldn't be there)
worker bundle: ~120 KB
total:         ~185 KB ❌ Some bloat

AFTER (organized):
main bundle:   ~55 KB (pure client code) ✓ Cleaner
worker bundle: ~125 KB (pure server code)
total:         ~180 KB (slightly better)

+ Verification automated ✓
```

---

## Migration Timeline

```
Start
  ↓
Create feature branch  (5 min)
  ↓
Move files with git    (30 min)
  ↓
Update imports         (45 min)
  ↓
Fix build errors       (10 min)
  ↓
Run tests             (5 min)
  ↓
Verify bundles        (5 min)
  ↓
Create PR             (5 min)
  ↓
Done! ✅ (~2 hours)
```

---

## Decision Flowchart

```
Does your project need...

┌─────────────────────────────────────────┐
│ Multiple folders with different concerns?│
│         (Client vs Server)               │
│              ↓ YES                       │
│              ↓                           │
│    → USE: src/client/ + src/server/     │
│            → Clear boundaries            │
│            → IDE support                 │
│            → Automated verification      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ To verify bundling is correct?           │
│              ↓ YES                       │
│              ↓                           │
│    → USE: Organized folders              │
│            → grep "class X" build/*.js  │
│            → bundling-verify.sh          │
│            → Confidence in output        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Want new developers to understand        │
│ architecture instantly?                  │
│              ↓ YES                       │
│              ↓                           │
│    → USE: src/client/ + src/server/     │
│            → Folder names = architecture │
│            → No documentation needed     │
│            → Obvious from structure      │
└─────────────────────────────────────────┘

Result: Split is worth it! →  Proceed with refactoring ✅
```
