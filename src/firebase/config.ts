import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDfq3j1-MTYffRcDlNyzTvOcanrmG7oEgI",
  authDomain: "student-dropoutai.firebaseapp.com",
  projectId: "student-dropoutai",
  storageBucket: "student-dropoutai.firebasestorage.app",
  messagingSenderId: "457573667088",
  appId: "1:457573667088:web:353171ac3a145354f29595",
};

let firebaseApp: FirebaseApp | undefined;
let firestore: Firestore | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase is only available in the browser.");
  }

  if (!firebaseApp) {
    firebaseApp = getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);
  }

  return firebaseApp;
}

export function getDb(): Firestore {
  if (!firestore) {
    firestore = getFirestore(getFirebaseApp());
  }
  return firestore;
}
