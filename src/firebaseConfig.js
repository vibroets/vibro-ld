import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC-nsWAvb-QIjBCV3VzuY7vnW4HKiBGdic",
  authDomain: "vibro-ld-software.firebaseapp.com",
  projectId: "vibro-ld-software",
  storageBucket: "vibro-ld-software.firebasestorage.app",
  messagingSenderId: "641624497016",
  appId: "1:641624497016:web:0055b2b26b7dabcf09c68d",
  measurementId: "G-HMV9GRJQRS"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";
