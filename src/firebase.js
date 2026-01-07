import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBEb01Wu873zSmkAXZZTq3rloCQKeBPm0U",
  authDomain: "mapa-comunitario-9f844.firebaseapp.com",
  projectId: "mapa-comunitario-9f844",
  storageBucket: "mapa-comunitario-9f844.firebasestorage.app",
  messagingSenderId: "432114532250",
  appId: "1:432114532250:web:bfca35f29198b0061e4423",
  measurementId: "G-X3F9GBNEM4"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);