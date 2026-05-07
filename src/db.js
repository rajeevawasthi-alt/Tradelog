import { 
  collection, doc, setDoc, getDoc, getDocs, 
  query, where, onSnapshot, deleteDoc, 
  serverTimestamp, orderBy 
} from "firebase/firestore";
import { db } from "./firebase";

export const dbService = {
  // Trades
  syncTrades: (userId, callback) => {
    const q = query(
      collection(db, `users/${userId}/trades`),
      orderBy("date", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      const trades = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(trades);
    });
  },

  saveTrade: async (userId, trade) => {
    const docRef = doc(db, `users/${userId}/trades`, trade.id);
    await setDoc(docRef, { ...trade, updatedAt: serverTimestamp() }, { merge: true });
  },

  deleteTrade: async (userId, tradeId) => {
    await deleteDoc(doc(db, `users/${userId}/trades`, tradeId));
  },

  // Settings
  getSettings: async (userId) => {
    const docRef = doc(db, "users", userId, "config", "settings");
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  },

  saveSettings: async (userId, settings) => {
    const docRef = doc(db, "users", userId, "config", "settings");
    await setDoc(docRef, { ...settings, updatedAt: serverTimestamp() });
  },

  // Review Notes
  syncNotes: (userId, callback) => {
    const docRef = doc(db, "users", userId, "config", "notes");
    return onSnapshot(docRef, (snap) => {
      callback(snap.exists() ? snap.data() : {});
    });
  },

  saveNote: async (userId, notes) => {
    const docRef = doc(db, "users", userId, "config", "notes");
    await setDoc(docRef, { ...notes, updatedAt: serverTimestamp() });
  },

  // AI Analysis
  saveAIAnalysis: async (userId, analysis) => {
    const docRef = doc(db, "users", userId, "config", "ai_analysis");
    await setDoc(docRef, { ...analysis, updatedAt: serverTimestamp() });
  },

  getAIAnalysis: async (userId) => {
    const docRef = doc(db, "users", userId, "config", "ai_analysis");
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  }
};
