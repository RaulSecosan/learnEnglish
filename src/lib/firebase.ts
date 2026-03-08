import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBk-at65OxP3CiDhkajPQG0i-1VOiTV13U",
  authDomain: "learningenglish-f1065.firebaseapp.com",
  projectId: "learningenglish-f1065",
  storageBucket: "learningenglish-f1065.firebasestorage.app",
  messagingSenderId: "638046697020",
  appId: "1:638046697020:web:bb0c15aac15c5464177539",
  measurementId: "G-E19NDPCCH0",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
