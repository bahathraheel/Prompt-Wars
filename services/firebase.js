const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, doc, updateDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

let db = null;
const memoryOrders = [];

// Only initialize if project ID is provided
if (firebaseConfig.projectId && firebaseConfig.projectId !== 'exo-stadium') {
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log('Firebase initialized');
    } catch (error) {
        console.warn('Firebase initialization failed:', error.message);
    }
} else {
    console.log('Using in-memory data store (Firebase not configured)');
}

const orderService = {
    async createOrder(order) {
        if (db) {
            try {
                const docRef = await addDoc(collection(db, "orders"), order);
                return { ...order, id: docRef.id };
            } catch (e) {
                console.error("Error adding document, falling back to memory: ", e);
            }
        }
        const orderWithId = { ...order, id: Math.random().toString(36).substr(2, 9) };
        memoryOrders.push(orderWithId);
        return orderWithId;
    },

    async getOrders() {
        if (db) {
            try {
                const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(50));
                const querySnapshot = await getDocs(q);
                return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (e) {
                console.error("Error getting documents: ", e);
            }
        }
        return [...memoryOrders].reverse();
    },

    async updateOrderStatus(id, status) {
        if (db) {
            try {
                const orderRef = doc(db, "orders", id);
                await updateDoc(orderRef, { status });
                return { id, status };
            } catch (e) {
                console.error("Error updating document: ", e);
            }
        }
        const order = memoryOrders.find(o => o.id === id);
        if (order) order.status = status;
        return order;
    }
};

module.exports = { orderService };
