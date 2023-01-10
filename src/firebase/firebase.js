import { initializeApp } from "firebase/app";
import { getAuth, signOut, signInWithEmailAndPassword, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, collectionGroup, query, onSnapshot, orderBy } from "firebase/firestore";
// import { db } from "./Firebase/config";
// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  apiKey: "AIzaSyCA9xuf6IQ6JIwPBSk6f1XQSPCXIlI4LAo",
  authDomain: "ichief-7bd27.firebaseapp.com",
  projectId: "ichief-7bd27",
  storageBucket: "ichief-7bd27.appspot.com",
  messagingSenderId: "1043469175294",
  appId: "1:1043469175294:web:9ee5bb39673934f56518af",
  measurementId: "G-SXP0B58EF0",
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(firebaseApp);
const db = getFirestore();
export { db, auth, signOut, signInWithEmailAndPassword, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, collection, doc, getDoc, setDoc, getDocs, collectionGroup, query, onSnapshot, orderBy, deleteDoc };
