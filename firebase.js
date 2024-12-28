// Import the functions you need from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTPbmDnhuW0bYczt7_uGLSCu2clGWCpTw",
  authDomain: "anochat-0359.firebaseapp.com",
  databaseURL: "https://anochat-0359-default-rtdb.firebaseio.com",
  projectId: "anochat-0359",
  storageBucket: "anochat-0359.appspot.com",
  messagingSenderId: "102386269637",
  appId: "1:102386269637:web:60729f73f8b39d62ce1fac",
  measurementId: "G-Y1336VJQCC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Realtime Database and export it
export const database = getDatabase(app);
