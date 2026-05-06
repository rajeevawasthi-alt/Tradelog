import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDgBzup2bSRoZnbLJbZy4lA5rGD_ZRj4P4",
  authDomain: "tradelog-14e2d.firebaseapp.com",
  projectId: "tradelog-14e2d",
  storageBucket: "tradelog-14e2d.firebasestorage.app",
  messagingSenderId: "728269492536",
  appId: "1:728269492536:web:09c19f9831d0d10c1831cd",
  measurementId: "G-FQGJ5C9J84"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export default app;
