// Chaves do projeto Firebase (projetoativi7)
// Console: https://console.firebase.google.com/project/projetoativi7

export const firebaseConfig = {
  apiKey: 'AIzaSyCQ50Xs4Ltnjmu7w7H7Fa3uVDGaK0ni9nY',
  authDomain: 'projetoativi7.firebaseapp.com',
  projectId: 'projetoativi7',
  storageBucket: 'projetoativi7.firebasestorage.app',
  messagingSenderId: '521930341445',
  appId: '1:521930341445:web:c2c84d9d7a306773c2f72c',
  measurementId: 'G-NDGBH32GNZ',
};

export function isFirebaseConfigurado() {
  const valores = Object.values(firebaseConfig);
  const temPlaceholder = valores.some(
    (v) => typeof v === 'string' && (v.includes('COLOQUE') || v.trim() === '')
  );
  return !temPlaceholder;
}
