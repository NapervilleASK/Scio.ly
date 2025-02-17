import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCZgC3YjKyN9ZvCAvpDsGlqyKsMAR5Ux1U",
  authDomain: "scio-ly-8f2fb.firebaseapp.com",
  projectId: "scio-ly-8f2fb",
  storageBucket: "scio-ly-8f2fb.firebasestorage.app",
  messagingSenderId: "497855635948",
  appId: "1:497855635948:web:001c365996fccdc2cde0c9",
  measurementId: "G-ML3GGGD47L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support persistence.');
    }
  });

  // Initialize Analytics only on client side
  getAnalytics(app);
} 