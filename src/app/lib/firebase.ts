import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// isi konfigurasi sesuai dengan konfigurasi firebase kalian
    const firebaseConfig = {
        apiKey: "AIzaSyAhYPDmXmgkw7oHe2XHcmTcuFiDVPpS5w4",
        authDomain: "todolist-301295.firebaseapp.com",
        projectId: "todolist-301295",
        storageBucket: "todolist-301295.firebasestorage.app",
        messagingSenderId: "1089921585989",
        appId: "1:1089921585989:web:17eeab50f2df8b6b01e42c",
        measurementId: "G-Z5ZYBPXQ4Q"
      };

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
