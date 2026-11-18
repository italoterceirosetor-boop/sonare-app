/* ============================================================
   SONARE — Firebase Realtime Database: config do projeto
   Projeto: sonare-b854d (Plano Spark gratuito)
============================================================ */

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyDB-3pk6yyJqbTCUh8V892X5wxDkJM9oeA",
  authDomain: "sonare-b854d.firebaseapp.com",
  databaseURL: "https://sonare-b854d-default-rtdb.firebaseio.com",
  projectId: "sonare-b854d",
  storageBucket: "sonare-b854d.firebasestorage.app",
  messagingSenderId: "311772660142",
  appId: "1:311772660142:web:8bcd6f0cf051a3c9adc83f"
};

// Detecta se configurou (se apiKey não for placeholder)
window.FIREBASE_CONFIGURED = !window.FIREBASE_CONFIG.apiKey.includes('COLOQUE_');
