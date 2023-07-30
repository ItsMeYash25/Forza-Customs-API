import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AuthDomain,
  projectId: process.env.FIREBASE_Project_ID,
  storageBucket: process.env.FIREBASE_Storage_Bucket,
  messagingSenderId: process.env.FIREBASE_Messaging_Sender_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
