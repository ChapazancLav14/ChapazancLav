//data.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyANzIW_EqzkHVDzpZaD41LkMHugULjsFFk",
  authDomain: "quiz-app-e973d.firebaseapp.com",
  projectId: "quiz-app-e973d",
  storageBucket: "quiz-app-e973d.firebasestorage.app",
  messagingSenderId: "14843518571",
  appId: "1:14843518571:web:266c44f0a84001517c5b2e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);