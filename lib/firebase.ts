import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAnalytics } from "firebase/analytics" // Importar getAnalytics

// Tu configuración de Firebase actualizada
const firebaseConfig = {
  apiKey: "AIzaSyAboV2MQ27MYK5RkoLUbAd36rQuBfw69xY",
  authDomain: "cortes-4fcf9.firebaseapp.com",
  projectId: "cortes-4fcf9",
  storageBucket: "cortes-4fcf9.firebasestorage.app",
  messagingSenderId: "273826504341",
  appId: "1:273826504341:web:f84449a48afdf64356059c", // App ID actualizado
  measurementId: "G-WK78L3C431", // Measurement ID actualizado
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)

// Inicializar servicios de Firebase
export const db = getFirestore(app)
export const storage = getStorage(app)

// Inicializar Analytics solo en el entorno del navegador
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null

export default app
