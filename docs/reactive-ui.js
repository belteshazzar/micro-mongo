/**
 * Reactive UI Example
 * 
 * Demonstrates using change streams for reactive user interfaces in the browser.
 * This example shows patterns for React, Vue, and vanilla JS.
 */

import { MongoClient } from '../main.js';

// ==========================================
// React Pattern
// ==========================================

/**
 * React hook for reactive collection data
 */
function useReactiveCollection(collection, query = {}) {
  const [documents, setDocuments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let changeStream = null;

    async function setup() {
      // Load initial data
      const docs = await collection.find(query).toArray();
      setDocuments(docs);
      setLoading(false);

      // Watch for changes
      changeStream = collection.watch();

      changeStream.on('change', (change) => {
        switch (change.operationType) {
          case 'insert':
            setDocuments(prev => [...prev, change.fullDocument]);
            break;

          case 'update':
          case 'replace':
            setDocuments(prev => prev.map(doc =>
              doc._id.toString() === change.documentKey._id.toString()
                ? change.fullDocument || { ...doc, ...change.updateDescription.updatedFields }
                : doc
            ));
            break;

          case 'delete':
            setDocuments(prev => prev.filter(doc =>
              doc._id.toString() !== change.documentKey._id.toString()
            ));
            break;
        }
      });
    }

    setup();

    return () => {
      if (changeStream) {
        changeStream.close();
      }
    };
  }, [collection, JSON.stringify(query)]);

  return { documents, loading };
}

/**
 * React component using reactive data
 */
function UserList({ collection }) {
  const { documents: users, loading } = useReactiveCollection(collection);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Users ({users.length})</h2>
      <ul>
        {users.map(user => (
          <li key={user._id}>
            {user.name} - {user.age} years old
            <button onClick={() => collection.deleteOne({ _id: user._id })}>
              Delete
            </button>
          </li>
        ))}
      </ul>
      <button onClick={() => collection.insertOne({ 
        name: 'New User', 
        age: Math.floor(Math.random() * 50) + 20 
      })}>
        Add User
      </button>
    </div>
  );
}

// ==========================================
// Vue Pattern
// ==========================================

/**
 * Vue composable for reactive collection data
 */
function useReactiveCollectionVue(collection, query = {}) {
  const documents = Vue.ref([]);
  const loading = Vue.ref(true);
  let changeStream = null;

  Vue.onMounted(async () => {
    // Load initial data
    documents.value = await collection.find(query).toArray();
    loading.value = false;

    // Watch for changes
    changeStream = collection.watch();

    changeStream.on('change', (change) => {
      switch (change.operationType) {
        case 'insert':
          documents.value = [...documents.value, change.fullDocument];
          break;

        case 'update':
        case 'replace':
          documents.value = documents.value.map(doc =>
            doc._id.toString() === change.documentKey._id.toString()
              ? change.fullDocument || { ...doc, ...change.updateDescription.updatedFields }
              : doc
          );
          break;

        case 'delete':
          documents.value = documents.value.filter(doc =>
            doc._id.toString() !== change.documentKey._id.toString()
          );
          break;
      }
    });
  });

  Vue.onUnmounted(() => {
    if (changeStream) {
      changeStream.close();
    }
  });

  return { documents, loading };
}

// ==========================================
// Vanilla JavaScript Pattern
// ==========================================

class ReactiveCollection {
  constructor(collection, query = {}) {
    this.collection = collection;
    this.query = query;
    this.documents = [];
    this.listeners = new Set();
    this.changeStream = null;
  }

  async initialize() {
    // Load initial data
    this.documents = await this.collection.find(this.query).toArray();
    this.notify();

    // Watch for changes
    this.changeStream = this.collection.watch();

    this.changeStream.on('change', (change) => {
      this.handleChange(change);
      this.notify();
    });

    return this;
  }

  handleChange(change) {
    switch (change.operationType) {
      case 'insert':
        this.documents.push(change.fullDocument);
        break;

      case 'update':
      case 'replace':
        const index = this.documents.findIndex(doc =>
          doc._id.toString() === change.documentKey._id.toString()
        );
        if (index !== -1) {
          this.documents[index] = change.fullDocument || {
            ...this.documents[index],
            ...change.updateDescription.updatedFields
          };
        }
        break;

      case 'delete':
        this.documents = this.documents.filter(doc =>
          doc._id.toString() !== change.documentKey._id.toString()
        );
        break;
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    // Immediately call with current data
    listener(this.documents);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.documents));
  }

  close() {
    if (this.changeStream) {
      this.changeStream.close();
    }
    this.listeners.clear();
  }
}

// Usage example:
async function vanillaExample() {
  const client = new MongoClient();
  await client.connect();
  const collection = client.db('app').collection('users');

  const reactive = await new ReactiveCollection(collection).initialize();

  const unsubscribe = reactive.subscribe((users) => {
    console.log('Users updated:', users);
    updateUI(users);
  });

  // Later...
  // unsubscribe();
  // reactive.close();
}

function updateUI(users) {
  const list = document.getElementById('user-list');
  list.innerHTML = users.map(user => `
    <li>
      ${user.name} - ${user.age} years old
      <button onclick="deleteUser('${user._id}')">Delete</button>
    </li>
  `).join('');
}

// ==========================================
// Real-time Dashboard Example
// ==========================================

async function dashboardExample() {
  console.log('=== Reactive Dashboard Example ===\n');

  const client = new MongoClient();
  await client.connect();
  const db = client.db('dashboard');
  const metrics = db.collection('metrics');

  // Dashboard state
  let stats = {
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0
  };

  // Watch for metric changes
  const changeStream = metrics.watch();

  changeStream.on('change', async (change) => {
    // Recalculate stats when metrics change
    const allMetrics = await metrics.find().toArray();
    
    stats.totalUsers = allMetrics.reduce((sum, m) => sum + (m.userCount || 0), 0);
    stats.activeUsers = allMetrics.reduce((sum, m) => sum + (m.activeCount || 0), 0);
    stats.totalRevenue = allMetrics.reduce((sum, m) => sum + (m.revenue || 0), 0);

    console.log('Dashboard updated:', stats);
    // In real app: updateDashboardUI(stats);
  });

  // Simulate metrics updates
  await metrics.insertOne({ userCount: 100, activeCount: 75, revenue: 1000 });
  await new Promise(resolve => setTimeout(resolve, 50));

  await metrics.insertOne({ userCount: 50, activeCount: 30, revenue: 500 });
  await new Promise(resolve => setTimeout(resolve, 50));

  await metrics.updateOne({}, { $inc: { userCount: 10, revenue: 100 } });
  await new Promise(resolve => setTimeout(resolve, 50));

  changeStream.close();
  console.log('\nFinal stats:', stats);
  console.log('\n=== Example Complete ===\n');
}

// ==========================================
// Collaborative Editing Example
// ==========================================

async function collaborativeExample() {
  console.log('=== Collaborative Editing Example ===\n');

  const client = new MongoClient();
  await client.connect();
  const db = client.db('collab');
  const documents = db.collection('documents');

  // Simulate multiple users editing the same document
  const changeStream = documents.watch([
    { $match: { 'fullDocument.docId': 'doc-123' } }
  ]);

  changeStream.on('change', (change) => {
    if (change.operationType === 'update') {
      console.log('Document updated by another user:');
      console.log('Changed fields:', Object.keys(change.updateDescription.updatedFields));
      // In real app: applyRemoteChanges(change.updateDescription);
    }
  });

  // User 1 creates document
  await documents.insertOne({ 
    docId: 'doc-123', 
    title: 'Collaborative Doc',
    content: 'Hello',
    lastEditBy: 'user1'
  });
  await new Promise(resolve => setTimeout(resolve, 50));

  // User 2 updates content
  await documents.updateOne(
    { docId: 'doc-123' },
    { $set: { content: 'Hello World', lastEditBy: 'user2' } }
  );
  await new Promise(resolve => setTimeout(resolve, 50));

  // User 3 updates title
  await documents.updateOne(
    { docId: 'doc-123' },
    { $set: { title: 'Collaborative Document', lastEditBy: 'user3' } }
  );
  await new Promise(resolve => setTimeout(resolve, 50));

  changeStream.close();
  console.log('\n=== Example Complete ===\n');
}

// Export for use in different contexts
export {
  useReactiveCollection,
  useReactiveCollectionVue,
  ReactiveCollection,
  dashboardExample,
  collaborativeExample
};

// Run examples if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  dashboardExample()
    .then(() => collaborativeExample())
    .catch(console.error);
}
